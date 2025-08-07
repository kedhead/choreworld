const express = require('express');
const router = express.Router();
const db = require('../database/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { 
    getCurrentDishDuty, 
    getDailyAssignments, 
    completeAssignment,
    assignDailyChores,
    rotateDishDuty,
    formatDate,
    getWeekStart,
    getWeekEnd,
    getDishDutyOrder,
    updateDishDutyOrder
} = require('../services/scheduler');

// Get current dish duty assignment
router.get('/dish-duty', authenticateToken, async (req, res) => {
    try {
        const duty = await getCurrentDishDuty();
        res.json({ duty: duty || null });
    } catch (error) {
        console.error('Get dish duty error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get daily assignments for current user or all users (admin)
router.get('/daily', authenticateToken, async (req, res) => {
    try {
        const { date } = req.query;
        let userId = null;

        // If not admin, only show current user's assignments
        if (req.user.role !== 'admin') {
            userId = req.user.id;
        }

        const assignments = await getDailyAssignments(userId, date);
        res.json({ assignments: assignments || [] });
    } catch (error) {
        console.error('Get daily assignments error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Complete a daily assignment
router.post('/daily/:id/complete', authenticateToken, async (req, res) => {
    try {
        await completeAssignment(req.params.id, req.user.id);
        res.json({ message: 'Assignment completed successfully' });
    } catch (error) {
        console.error('Complete assignment error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Manually trigger daily chore assignment (admin only)
router.post('/daily/assign', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await assignDailyChores();
        res.json({ message: 'Daily chores assigned successfully' });
    } catch (error) {
        console.error('Manual daily assignment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Manually assign specific chore to specific user for specific date (admin only)
router.post('/daily/assign-manual', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId, choreId, assignedDate } = req.body;
        
        if (!userId || !choreId || !assignedDate) {
            return res.status(400).json({ error: 'userId, choreId, and assignedDate are required' });
        }

        // Check if user exists and is a kid
        const user = await db.get('SELECT * FROM users WHERE id = ? AND role = ?', [userId, 'kid']);
        if (!user) {
            return res.status(400).json({ error: 'User not found or not a kid' });
        }

        // Check if chore exists
        const chore = await db.get('SELECT * FROM chores WHERE id = ? AND is_active = 1', [choreId]);
        if (!chore) {
            return res.status(400).json({ error: 'Chore not found or not active' });
        }

        // Check if assignment already exists for this user and date
        const existingAssignment = await db.get(
            'SELECT * FROM daily_assignments WHERE user_id = ? AND assigned_date = ?',
            [userId, assignedDate]
        );

        if (existingAssignment) {
            // Update existing assignment
            await db.run(
                'UPDATE daily_assignments SET chore_id = ?, points_earned = ?, is_completed = 0, completed_at = NULL WHERE user_id = ? AND assigned_date = ?',
                [choreId, chore.points, userId, assignedDate]
            );
        } else {
            // Create new assignment
            await db.run(
                'INSERT INTO daily_assignments (user_id, chore_id, assigned_date, points_earned) VALUES (?, ?, ?, ?)',
                [userId, choreId, assignedDate, chore.points]
            );
        }

        res.json({ 
            message: 'Chore assigned successfully',
            assignment: {
                user_name: user.display_name,
                chore_name: chore.name,
                assigned_date: assignedDate
            }
        });
    } catch (error) {
        console.error('Manual assignment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete/unassign a daily assignment (admin only)
router.delete('/daily/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const assignmentId = req.params.id;
        
        const result = await db.run('DELETE FROM daily_assignments WHERE id = ?', [assignmentId]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        res.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Manually trigger dish duty rotation (admin only)
router.post('/dish-duty/rotate', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await rotateDishDuty();
        res.json({ message: 'Dish duty rotated successfully' });
    } catch (error) {
        console.error('Manual dish duty rotation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get weekly summary for a specific week
router.get('/summary', authenticateToken, async (req, res) => {
    try {
        const { week } = req.query; // Format: YYYY-MM-DD (Monday of the week)
        
        let weekStart;
        if (week) {
            weekStart = formatDate(new Date(week));
        } else {
            weekStart = formatDate(getWeekStart());
        }

        // Get completion history for the week
        const completions = await db.all(`
            SELECT 
                ch.*,
                u.display_name,
                c.name as chore_name,
                c.description as chore_description
            FROM completion_history ch
            JOIN users u ON ch.user_id = u.id
            JOIN chores c ON ch.chore_id = c.id
            WHERE ch.week_start = ?
            ORDER BY u.display_name, ch.completed_at
        `, [weekStart]);

        // Get dish duty for the week
        const dishDuty = await db.get(`
            SELECT dd.*, u.display_name
            FROM dish_duty dd
            JOIN users u ON dd.user_id = u.id
            WHERE dd.week_start = ?
        `, [weekStart]);

        // Get daily assignments for the week (completed and incomplete)
        const weekEnd = formatDate(getWeekEnd(new Date(weekStart)));
        const dailyAssignments = await db.all(`
            SELECT 
                da.*,
                u.display_name,
                c.name as chore_name,
                c.description as chore_description
            FROM daily_assignments da
            JOIN users u ON da.user_id = u.id
            JOIN chores c ON da.chore_id = c.id
            WHERE da.assigned_date >= ? AND da.assigned_date <= ?
            ORDER BY da.assigned_date, u.display_name
        `, [weekStart, weekEnd]);

        // Calculate summary stats
        const stats = {};
        dailyAssignments.forEach(assignment => {
            if (!stats[assignment.display_name]) {
                stats[assignment.display_name] = {
                    total_assigned: 0,
                    total_completed: 0,
                    total_points: 0
                };
            }
            stats[assignment.display_name].total_assigned++;
            if (assignment.is_completed) {
                stats[assignment.display_name].total_completed++;
                stats[assignment.display_name].total_points += assignment.points_earned;
            }
        });

        res.json({
            week_start: weekStart,
            week_end: weekEnd,
            dish_duty: dishDuty,
            daily_assignments: dailyAssignments,
            completions,
            stats
        });
    } catch (error) {
        console.error('Get weekly summary error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get available weeks for history
router.get('/weeks', authenticateToken, async (req, res) => {
    try {
        const weeks = await db.all(`
            SELECT DISTINCT week_start
            FROM completion_history
            UNION
            SELECT DISTINCT week_start
            FROM dish_duty
            ORDER BY week_start DESC
        `);

        res.json({ weeks: weeks.map(w => w.week_start) });
    } catch (error) {
        console.error('Get weeks error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get dish duty order configuration (admin only)
router.get('/dish-duty/order', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const order = getDishDutyOrder();
        res.json({ order });
    } catch (error) {
        console.error('Get dish duty order error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update dish duty order (admin only)
router.put('/dish-duty/order', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { order } = req.body;
        
        if (!Array.isArray(order) || order.length === 0) {
            return res.status(400).json({ error: 'Order must be a non-empty array' });
        }

        const updatedOrder = updateDishDutyOrder(order);
        res.json({ 
            message: 'Dish duty order updated successfully',
            order: updatedOrder 
        });
    } catch (error) {
        console.error('Update dish duty order error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;