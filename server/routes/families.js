const express = require('express');
const router = express.Router();
const db = require('../database/database');
const { authenticateToken, requireAdmin, hashPassword, generateToken } = require('../middleware/auth');
const crypto = require('crypto');

// Generate unique family code
function generateFamilyCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Generate invite code
function generateInviteCode() {
    return crypto.randomBytes(8).toString('hex').toUpperCase();
}

// Create new family (any authenticated user)
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.id;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Family name is required' });
        }

        // Check if user already has a family - if so, leave it first
        const userFamily = await db.get('SELECT family_id FROM users WHERE id = ?', [userId]);
        if (userFamily && userFamily.family_id) {
            // Leave current family before creating new one
            await db.run('UPDATE users SET family_id = NULL WHERE id = ?', [userId]);
            console.log(`User ${userId} left family ${userFamily.family_id} to create new family`);
        }

        // Generate unique family code
        let familyCode;
        let attempts = 0;
        do {
            familyCode = generateFamilyCode();
            const existing = await db.get('SELECT id FROM families WHERE family_code = ?', [familyCode]);
            if (!existing) break;
            attempts++;
        } while (attempts < 10);

        if (attempts >= 10) {
            return res.status(500).json({ error: 'Could not generate unique family code' });
        }

        // Create family
        const familyResult = await db.run(
            'INSERT INTO families (name, family_code, created_by) VALUES (?, ?, ?)',
            [name.trim(), familyCode, userId]
        );

        const familyId = familyResult.id;

        // Assign creator to the family and make them admin
        await db.run('UPDATE users SET family_id = ?, role = ? WHERE id = ?', [familyId, 'admin', userId]);

        // Create initial invite code
        const inviteCode = generateInviteCode();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

        await db.run(
            'INSERT INTO family_invites (family_id, invite_code, created_by, expires_at, max_uses) VALUES (?, ?, ?, ?, ?)',
            [familyId, inviteCode, userId, expiresAt.toISOString(), 10]
        );

        // Get updated user info with family_id and admin role
        const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
        
        // Generate new token with updated user info
        const newToken = generateToken(updatedUser);

        res.status(201).json({
            message: 'Family created successfully',
            token: newToken, // Return new token with updated family_id
            family: {
                id: familyId,
                name: name.trim(),
                family_code: familyCode,
                invite_code: inviteCode
            },
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                role: updatedUser.role,
                display_name: updatedUser.display_name,
                family_id: updatedUser.family_id
            }
        });
    } catch (error) {
        console.error('Create family error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Join family using invite code
router.post('/join', authenticateToken, async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const userId = req.user.id;

        if (!inviteCode) {
            return res.status(400).json({ error: 'Invite code is required' });
        }

        // Check if user already has a family
        const userFamily = await db.get('SELECT family_id FROM users WHERE id = ?', [userId]);
        if (userFamily && userFamily.family_id) {
            return res.status(400).json({ error: 'You already belong to a family' });
        }

        // Find valid invite
        const invite = await db.get(`
            SELECT fi.*, f.name as family_name 
            FROM family_invites fi
            JOIN families f ON fi.family_id = f.id
            WHERE fi.invite_code = ? AND fi.is_active = 1 AND fi.expires_at > datetime('now')
        `, [inviteCode.toUpperCase()]);

        if (!invite) {
            return res.status(404).json({ error: 'Invalid or expired invite code' });
        }

        // Check if invite has remaining uses
        if (invite.used_count >= invite.max_uses) {
            return res.status(400).json({ error: 'This invite code has been used up' });
        }

        // Join family
        await db.run('UPDATE users SET family_id = ? WHERE id = ?', [invite.family_id, userId]);

        // Increment invite usage
        await db.run(
            'UPDATE family_invites SET used_count = used_count + 1 WHERE id = ?',
            [invite.id]
        );

        // Get updated user info with family_id
        const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
        
        // Generate new token with updated user info
        const newToken = generateToken(updatedUser);

        res.json({
            message: 'Successfully joined family',
            token: newToken, // Return new token with updated family_id
            family: {
                id: invite.family_id,
                name: invite.family_name
            },
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                role: updatedUser.role,
                display_name: updatedUser.display_name,
                family_id: updatedUser.family_id
            }
        });
    } catch (error) {
        console.error('Join family error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current family info
router.get('/current', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const familyInfo = await db.get(`
            SELECT f.*, u.display_name as created_by_name
            FROM families f
            JOIN users u ON f.created_by = u.id
            WHERE f.id = (SELECT family_id FROM users WHERE id = ?)
        `, [userId]);

        if (!familyInfo) {
            return res.json({ family: null });
        }

        // Get family members
        const members = await db.all(`
            SELECT id, username, display_name, role, created_at
            FROM users
            WHERE family_id = ?
            ORDER BY role DESC, display_name
        `, [familyInfo.id]);

        // Get active invites (admin only)
        let invites = [];
        if (req.user.role === 'admin') {
            invites = await db.all(`
                SELECT invite_code, expires_at, max_uses, used_count, created_at
                FROM family_invites
                WHERE family_id = ? AND is_active = 1 AND expires_at > datetime('now')
                ORDER BY created_at DESC
            `, [familyInfo.id]);
        }

        res.json({
            family: {
                ...familyInfo,
                members,
                invites
            }
        });
    } catch (error) {
        console.error('Get current family error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new invite code (family admin only)
router.post('/invite', authenticateToken, async (req, res) => {
    try {
        const { maxUses = 5, expiryDays = 7 } = req.body;
        const userId = req.user.id;

        // Get user's family and role
        const userInfo = await db.get('SELECT family_id, role FROM users WHERE id = ?', [userId]);
        if (!userInfo || !userInfo.family_id) {
            return res.status(400).json({ error: 'You must belong to a family to create invites' });
        }
        
        if (userInfo.role !== 'admin') {
            return res.status(403).json({ error: 'Only family admins can create invite codes' });
        }

        // Generate invite code
        const inviteCode = generateInviteCode();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays));

        await db.run(
            'INSERT INTO family_invites (family_id, invite_code, created_by, expires_at, max_uses) VALUES (?, ?, ?, ?, ?)',
            [userInfo.family_id, inviteCode, userId, expiresAt.toISOString(), parseInt(maxUses)]
        );

        res.status(201).json({
            message: 'Invite code created successfully',
            invite: {
                code: inviteCode,
                expires_at: expiresAt.toISOString(),
                max_uses: parseInt(maxUses)
            }
        });
    } catch (error) {
        console.error('Create invite error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update family settings (family admin only)
router.put('/settings', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.id;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Family name is required' });
        }

        // Get user's family and role
        const userInfo = await db.get('SELECT family_id, role FROM users WHERE id = ?', [userId]);
        if (!userInfo || !userInfo.family_id) {
            return res.status(400).json({ error: 'You must belong to a family' });
        }
        
        if (userInfo.role !== 'admin') {
            return res.status(403).json({ error: 'Only family admins can update family settings' });
        }

        // Update family name
        await db.run(
            'UPDATE families SET name = ? WHERE id = ?',
            [name.trim(), userInfo.family_id]
        );

        res.json({ message: 'Family settings updated successfully' });
    } catch (error) {
        console.error('Update family settings error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Remove user from family (family admin only)
router.post('/remove-member', authenticateToken, async (req, res) => {
    try {
        const { userId: targetUserId } = req.body;
        const adminUserId = req.user.id;

        if (!targetUserId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Get admin's family and role
        const adminInfo = await db.get('SELECT family_id, role FROM users WHERE id = ?', [adminUserId]);
        if (!adminInfo || !adminInfo.family_id) {
            return res.status(400).json({ error: 'You must belong to a family' });
        }
        
        if (adminInfo.role !== 'admin') {
            return res.status(403).json({ error: 'Only family admins can remove members' });
        }

        // Get target user's family
        const targetUser = await db.get(
            'SELECT family_id, display_name, role FROM users WHERE id = ?',
            [targetUserId]
        );

        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (targetUser.family_id !== adminInfo.family_id) {
            return res.status(403).json({ error: 'User is not in your family' });
        }

        if (targetUserId == adminUserId) {
            return res.status(400).json({ error: 'You cannot remove yourself' });
        }

        // Remove user from family
        await db.run('UPDATE users SET family_id = NULL WHERE id = ?', [targetUserId]);

        res.json({
            message: `${targetUser.display_name} has been removed from the family`
        });
    } catch (error) {
        console.error('Remove family member error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Leave family
router.post('/leave', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user's family and role
        const userInfo = await db.get(
            'SELECT family_id, role FROM users WHERE id = ?',
            [userId]
        );

        if (!userInfo || !userInfo.family_id) {
            return res.status(400).json({ error: 'You are not in a family' });
        }

        // Check if user is the only admin
        if (userInfo.role === 'admin') {
            const adminCount = await db.get(
                'SELECT COUNT(*) as count FROM users WHERE family_id = ? AND role = ?',
                [userInfo.family_id, 'admin']
            );

            if (adminCount.count === 1) {
                return res.status(400).json({
                    error: 'You cannot leave the family as the only admin. Transfer admin rights first or delete the family.'
                });
            }
        }

        // Remove user from family
        await db.run('UPDATE users SET family_id = NULL WHERE id = ?', [userId]);

        res.json({ message: 'You have left the family' });
    } catch (error) {
        console.error('Leave family error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete family (family owner only - removes all members and data)
router.delete('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user's family
        const userFamily = await db.get('SELECT family_id FROM users WHERE id = ?', [userId]);
        if (!userFamily || !userFamily.family_id) {
            return res.status(400).json({ error: 'You must belong to a family' });
        }

        const familyId = userFamily.family_id;

        // Get family info
        const family = await db.get('SELECT * FROM families WHERE id = ?', [familyId]);
        if (family.created_by !== userId) {
            return res.status(403).json({ error: 'Only the family creator can delete the family' });
        }

        // Delete all family data
        await db.run('DELETE FROM family_invites WHERE family_id = ?', [familyId]);
        await db.run('DELETE FROM bonus_chores WHERE family_id = ?', [familyId]);
        await db.run('DELETE FROM completion_history WHERE family_id = ?', [familyId]);
        await db.run('DELETE FROM daily_assignments WHERE family_id = ?', [familyId]);
        await db.run('DELETE FROM dish_duty WHERE family_id = ?', [familyId]);
        await db.run('DELETE FROM chores WHERE family_id = ?', [familyId]);
        await db.run('UPDATE users SET family_id = NULL WHERE family_id = ?', [familyId]);
        await db.run('DELETE FROM families WHERE id = ?', [familyId]);

        res.json({ message: 'Family deleted successfully' });
    } catch (error) {
        console.error('Delete family error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;