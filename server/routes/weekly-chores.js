const express = require('express');
const router = express.Router();
const db = require('../database/database');
const { authenticateToken, requireFamily } = require('../middleware/auth');
const { 
    rotateWeeklyChores,
    getCurrentWeeklyAssignments,
    getWeeklyChoreRotationOrder,
    updateWeeklyChoreRotationOrder
} = require('../services/scheduler');

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
            return res.status(403).json({ error: 'Only family admins can perform this action' });
        }
        
        req.user.family_id = userInfo.family_id;
        next();
    } catch (error) {
        console.error('Family admin check error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get all weekly chore types for family
router.get('/types', authenticateToken, requireFamily, async (req, res) => {
    try {
        const familyId = req.user.family_id;
        const choreTypes = await db.all(
            'SELECT * FROM weekly_chore_types WHERE family_id = ? AND is_active = 1 ORDER BY name',
            [familyId]
        );
        res.json({ choreTypes });
    } catch (error) {
        console.error('Get weekly chore types error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new weekly chore type (family admin only)
router.post('/types', authenticateToken, requireFamilyAdmin, async (req, res) => {
    try {
        const { name, description, icon } = req.body;
        const familyId = req.user.family_id;
        
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        
        // Check if chore type already exists for this family
        const existing = await db.get(
            'SELECT id FROM weekly_chore_types WHERE family_id = ? AND name = ?',
            [familyId, name]
        );
        
        if (existing) {
            return res.status(400).json({ error: 'Weekly chore type with this name already exists' });
        }
        
        const result = await db.run(
            'INSERT INTO weekly_chore_types (family_id, name, description, icon) VALUES (?, ?, ?, ?)',
            [familyId, name, description || '', icon || '🏠']
        );
        
        res.status(201).json({
            message: 'Weekly chore type created successfully',
            choreType: {
                id: result.lastID,
                family_id: familyId,
                name,
                description: description || '',
                icon: icon || '🏠'
            }
        });
    } catch (error) {
        console.error('Create weekly chore type error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update weekly chore type (family admin only)
router.put('/types/:id', authenticateToken, requireFamilyAdmin, async (req, res) => {
    try {
        const choreTypeId = req.params.id;
        const { name, description, icon, is_active } = req.body;
        const familyId = req.user.family_id;
        
        // Verify chore type belongs to this family
        const choreType = await db.get(
            'SELECT * FROM weekly_chore_types WHERE id = ? AND family_id = ?',
            [choreTypeId, familyId]
        );
        
        if (!choreType) {
            return res.status(404).json({ error: 'Weekly chore type not found' });
        }
        
        await db.run(
            'UPDATE weekly_chore_types SET name = ?, description = ?, icon = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name || choreType.name, description ?? choreType.description, icon || choreType.icon, is_active ?? choreType.is_active, choreTypeId]
        );
        
        res.json({ message: 'Weekly chore type updated successfully' });
    } catch (error) {
        console.error('Update weekly chore type error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete weekly chore type (family admin only)
router.delete('/types/:id', authenticateToken, requireFamilyAdmin, async (req, res) => {
    try {
        const choreTypeId = req.params.id;
        const familyId = req.user.family_id;
        
        // Verify chore type belongs to this family
        const choreType = await db.get(
            'SELECT * FROM weekly_chore_types WHERE id = ? AND family_id = ?',
            [choreTypeId, familyId]
        );
        
        if (!choreType) {
            return res.status(404).json({ error: 'Weekly chore type not found' });
        }
        
        // Check if there are active assignments for this chore type
        const activeAssignments = await db.get(
            'SELECT COUNT(*) as count FROM weekly_assignments WHERE weekly_chore_type_id = ? AND is_active = 1',
            [choreTypeId]
        );
        
        if (activeAssignments.count > 0) {
            return res.status(400).json({ error: 'Cannot delete chore type with active assignments' });
        }
        
        // Delete rotation orders first
        await db.run(
            'DELETE FROM weekly_rotation_orders WHERE weekly_chore_type_id = ?',
            [choreTypeId]
        );
        
        // Delete chore type
        await db.run('DELETE FROM weekly_chore_types WHERE id = ?', [choreTypeId]);
        
        res.json({ message: 'Weekly chore type deleted successfully' });
    } catch (error) {
        console.error('Delete weekly chore type error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current weekly assignments for family
router.get('/assignments', authenticateToken, requireFamily, async (req, res) => {
    try {
        const familyId = req.user.family_id;
        const assignments = await getCurrentWeeklyAssignments(familyId);
        res.json({ assignments });
    } catch (error) {
        console.error('Get weekly assignments error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Manually trigger weekly chore rotation (family admin only)
router.post('/rotate/:choreTypeId?', authenticateToken, requireFamilyAdmin, async (req, res) => {
    try {
        const familyId = req.user.family_id;
        const choreTypeId = req.params.choreTypeId || null;
        
        await rotateWeeklyChores(familyId, choreTypeId);
        
        const message = choreTypeId ? 
            'Weekly chore rotated successfully' : 
            'All weekly chores rotated successfully';
            
        res.json({ message });
    } catch (error) {
        console.error('Manual weekly chore rotation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get rotation order for a weekly chore type (family admin only)
router.get('/types/:id/rotation', authenticateToken, requireFamilyAdmin, async (req, res) => {
    try {
        const choreTypeId = req.params.id;
        const familyId = req.user.family_id;
        
        // Verify chore type belongs to this family
        const choreType = await db.get(
            'SELECT * FROM weekly_chore_types WHERE id = ? AND family_id = ?',
            [choreTypeId, familyId]
        );
        
        if (!choreType) {
            return res.status(404).json({ error: 'Weekly chore type not found' });
        }
        
        const rotationOrder = await getWeeklyChoreRotationOrder(choreTypeId, familyId);
        res.json({ rotationOrder });
    } catch (error) {
        console.error('Get rotation order error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update rotation order for a weekly chore type (family admin only)
router.put('/types/:id/rotation', authenticateToken, requireFamilyAdmin, async (req, res) => {
    try {
        const choreTypeId = req.params.id;
        const { userIds } = req.body;
        const familyId = req.user.family_id;
        
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'userIds must be a non-empty array' });
        }
        
        // Verify chore type belongs to this family
        const choreType = await db.get(
            'SELECT * FROM weekly_chore_types WHERE id = ? AND family_id = ?',
            [choreTypeId, familyId]
        );
        
        if (!choreType) {
            return res.status(404).json({ error: 'Weekly chore type not found' });
        }
        
        // Verify all user IDs belong to this family and are kids
        for (const userId of userIds) {
            const user = await db.get(
                'SELECT * FROM users WHERE id = ? AND family_id = ? AND role = ?',
                [userId, familyId, 'kid']
            );
            if (!user) {
                return res.status(400).json({ error: `Invalid user ID: ${userId}` });
            }
        }
        
        const updatedOrder = await updateWeeklyChoreRotationOrder(choreTypeId, familyId, userIds);
        
        res.json({
            message: 'Rotation order updated successfully',
            rotationOrder: updatedOrder
        });
    } catch (error) {
        console.error('Update rotation order error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;