const express = require('express');
const router = express.Router();
const db = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

// Helper function to check if user is admin of their family
const requireFamilyAdmin = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userInfo = await db.get(
            'SELECT family_id, role FROM users WHERE id = ?', 
            [userId]
        );
        
        if (!userInfo || !userInfo.family_id) {
            return res.status(400).json({ error: 'You must belong to a family' });
        }
        
        if (userInfo.role !== 'admin') {
            return res.status(403).json({ error: 'Only family admins can manage payments' });
        }
        
        req.user.family_id = userInfo.family_id;
        next();
    } catch (error) {
        console.error('Family admin check error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Helper function to get week start (Monday) and end (Sunday) for a given date
const getWeekBounds = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return {
        weekStart: weekStart.toISOString().split('T')[0], // YYYY-MM-DD format
        weekEnd: weekEnd.toISOString().split('T')[0]
    };
};

// Get payment status for current week or specified week (available to all family members)
router.get('/weekly', authenticateToken, async (req, res) => {
    try {
        const { week } = req.query; // Optional: YYYY-MM-DD format for specific week
        const userId = req.user.id;
        
        // Get user's family
        const userInfo = await db.get('SELECT family_id, role FROM users WHERE id = ?', [userId]);
        if (!userInfo || !userInfo.family_id) {
            return res.status(400).json({ error: 'You must belong to a family' });
        }
        
        const familyId = userInfo.family_id;
        
        // Calculate week bounds
        const targetDate = week ? new Date(week) : new Date();
        const { weekStart, weekEnd } = getWeekBounds(targetDate);
        
        // If user is admin, get payments for all family members
        // If user is kid, get only their own payment status
        let payments;
        if (userInfo.role === 'admin') {
            payments = await db.all(`
                SELECT 
                    wp.*,
                    u.display_name as child_name,
                    u.username as child_username,
                    p.display_name as paid_by_name
                FROM weekly_payments wp
                JOIN users u ON wp.user_id = u.id
                JOIN users p ON wp.paid_by = p.id
                WHERE wp.family_id = ? AND wp.week_start = ?
                ORDER BY u.display_name
            `, [familyId, weekStart]);
            
            // Also get family members who haven't been paid yet
            const allKids = await db.all(`
                SELECT id, display_name, username
                FROM users 
                WHERE family_id = ? AND role = 'kid'
                ORDER BY display_name
            `, [familyId]);
            
            // Mark which kids have been paid
            const paidUserIds = new Set(payments.map(p => p.user_id));
            const unpaidKids = allKids.filter(kid => !paidUserIds.has(kid.id));
            
            res.json({
                week_start: weekStart,
                week_end: weekEnd,
                payments,
                unpaid_kids: unpaidKids,
                total_kids: allKids.length,
                paid_count: payments.length
            });
        } else {
            // Kid can only see their own payment status
            const payment = await db.get(`
                SELECT 
                    wp.*,
                    p.display_name as paid_by_name
                FROM weekly_payments wp
                JOIN users p ON wp.paid_by = p.id
                WHERE wp.user_id = ? AND wp.family_id = ? AND wp.week_start = ?
            `, [userId, familyId, weekStart]);
            
            res.json({
                week_start: weekStart,
                week_end: weekEnd,
                payment: payment || null,
                is_paid: !!payment
            });
        }
    } catch (error) {
        console.error('Get weekly payments error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Mark a child as paid for the week (family admin only)
router.post('/mark-paid', authenticateToken, requireFamilyAdmin, async (req, res) => {
    try {
        const { user_id, amount, notes, week } = req.body;
        const familyId = req.user.family_id;
        const paidBy = req.user.id;
        
        if (!user_id) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        // Verify the child belongs to the same family
        const childInfo = await db.get(
            'SELECT * FROM users WHERE id = ? AND family_id = ? AND role = ?',
            [user_id, familyId, 'kid']
        );
        
        if (!childInfo) {
            return res.status(404).json({ error: 'Child not found in your family' });
        }
        
        // Calculate week bounds
        const targetDate = week ? new Date(week) : new Date();
        const { weekStart, weekEnd } = getWeekBounds(targetDate);
        
        // Check if already paid for this week
        const existingPayment = await db.get(
            'SELECT id FROM weekly_payments WHERE user_id = ? AND family_id = ? AND week_start = ?',
            [user_id, familyId, weekStart]
        );
        
        if (existingPayment) {
            return res.status(400).json({ error: 'Child has already been marked as paid for this week' });
        }
        
        // Create payment record
        const result = await db.run(`
            INSERT INTO weekly_payments (user_id, family_id, week_start, week_end, paid_by, amount, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [user_id, familyId, weekStart, weekEnd, paidBy, amount || 0.00, notes || null]);
        
        // Get the created payment record with names
        const payment = await db.get(`
            SELECT 
                wp.*,
                u.display_name as child_name,
                p.display_name as paid_by_name
            FROM weekly_payments wp
            JOIN users u ON wp.user_id = u.id
            JOIN users p ON wp.paid_by = p.id
            WHERE wp.id = ?
        `, [result.id]);
        
        res.status(201).json({
            message: `${childInfo.display_name} marked as paid for week of ${weekStart}`,
            payment
        });
    } catch (error) {
        console.error('Mark paid error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Unmark payment (remove payment record) - family admin only
router.delete('/:paymentId', authenticateToken, requireFamilyAdmin, async (req, res) => {
    try {
        const { paymentId } = req.params;
        const familyId = req.user.family_id;
        
        // Verify payment belongs to this family
        const payment = await db.get(
            'SELECT wp.*, u.display_name as child_name FROM weekly_payments wp JOIN users u ON wp.user_id = u.id WHERE wp.id = ? AND wp.family_id = ?',
            [paymentId, familyId]
        );
        
        if (!payment) {
            return res.status(404).json({ error: 'Payment record not found' });
        }
        
        // Delete the payment record
        await db.run('DELETE FROM weekly_payments WHERE id = ?', [paymentId]);
        
        res.json({
            message: `Payment record for ${payment.child_name} has been removed`
        });
    } catch (error) {
        console.error('Unmark payment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get payment history for a specific child (family admin only)
router.get('/history/:userId', authenticateToken, requireFamilyAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10 } = req.query;
        const familyId = req.user.family_id;
        
        // Verify child belongs to family
        const childInfo = await db.get(
            'SELECT display_name FROM users WHERE id = ? AND family_id = ? AND role = ?',
            [userId, familyId, 'kid']
        );
        
        if (!childInfo) {
            return res.status(404).json({ error: 'Child not found in your family' });
        }
        
        // Get payment history
        const history = await db.all(`
            SELECT 
                wp.*,
                p.display_name as paid_by_name
            FROM weekly_payments wp
            JOIN users p ON wp.paid_by = p.id
            WHERE wp.user_id = ? AND wp.family_id = ?
            ORDER BY wp.week_start DESC
            LIMIT ?
        `, [userId, familyId, parseInt(limit)]);
        
        res.json({
            child: childInfo,
            payment_history: history
        });
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;