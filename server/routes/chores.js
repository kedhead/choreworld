const express = require('express');
const router = express.Router();
const db = require('../database/database');
const { authenticateToken, requireAdmin, requireFamily } = require('../middleware/auth');

// Get all chores (available to all authenticated users)
router.get('/', authenticateToken, requireFamily, async (req, res) => {
    try {
        const familyId = req.user.family_id;
        const chores = await db.all(
            'SELECT * FROM chores WHERE is_active = 1 AND family_id = ? ORDER BY name',
            [familyId]
        );
        res.json({ chores });
    } catch (error) {
        console.error('Get chores error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single chore
router.get('/:id', authenticateToken, requireFamily, async (req, res) => {
    try {
        const familyId = req.user.family_id;
        const chore = await db.get(
            'SELECT * FROM chores WHERE id = ? AND is_active = 1 AND family_id = ?',
            [req.params.id, familyId]
        );
        
        if (!chore) {
            return res.status(404).json({ error: 'Chore not found' });
        }

        res.json({ chore });
    } catch (error) {
        console.error('Get chore error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new chore (admin only)
router.post('/', authenticateToken, requireAdmin, requireFamily, async (req, res) => {
    try {
        const { name, description, points, is_bonus_available } = req.body;
        const familyId = req.user.family_id;

        if (!name) {
            return res.status(400).json({ error: 'Chore name is required' });
        }

        const result = await db.run(
            'INSERT INTO chores (name, description, points, is_bonus_available, family_id) VALUES (?, ?, ?, ?, ?)',
            [name, description || '', points || 1, is_bonus_available ? 1 : 0, familyId]
        );

        const chore = await db.get('SELECT * FROM chores WHERE id = ?', [result.id]);

        res.status(201).json({
            message: 'Chore created successfully',
            chore
        });
    } catch (error) {
        console.error('Create chore error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update chore (admin only)
router.put('/:id', authenticateToken, requireAdmin, requireFamily, async (req, res) => {
    try {
        const { name, description, points, is_active, is_bonus_available } = req.body;
        const choreId = req.params.id;
        const familyId = req.user.family_id;

        // Check if chore exists and belongs to family
        const existingChore = await db.get(
            'SELECT * FROM chores WHERE id = ? AND family_id = ?',
            [choreId, familyId]
        );
        
        if (!existingChore) {
            return res.status(404).json({ error: 'Chore not found' });
        }

        // Update chore
        await db.run(
            'UPDATE chores SET name = ?, description = ?, points = ?, is_active = ?, is_bonus_available = ? WHERE id = ? AND family_id = ?',
            [
                name || existingChore.name,
                description !== undefined ? description : existingChore.description,
                points !== undefined ? points : existingChore.points,
                is_active !== undefined ? is_active : existingChore.is_active,
                is_bonus_available !== undefined ? (is_bonus_available ? 1 : 0) : existingChore.is_bonus_available,
                choreId,
                familyId
            ]
        );

        const updatedChore = await db.get('SELECT * FROM chores WHERE id = ?', [choreId]);

        res.json({
            message: 'Chore updated successfully',
            chore: updatedChore
        });
    } catch (error) {
        console.error('Update chore error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete chore (admin only) - soft delete by setting is_active = 0
router.delete('/:id', authenticateToken, requireAdmin, requireFamily, async (req, res) => {
    try {
        const choreId = req.params.id;
        const familyId = req.user.family_id;

        const result = await db.run(
            'UPDATE chores SET is_active = 0 WHERE id = ? AND family_id = ?',
            [choreId, familyId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Chore not found' });
        }

        res.json({ message: 'Chore deleted successfully' });
    } catch (error) {
        console.error('Delete chore error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;