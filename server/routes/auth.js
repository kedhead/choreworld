const express = require('express');
const router = express.Router();
const db = require('../database/database');
const { generateToken, hashPassword, comparePassword, authenticateToken } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Find user
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await comparePassword(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                display_name: user.display_name,
                family_id: user.family_id
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Register new user (admin only)
router.post('/register', authenticateToken, async (req, res) => {
    try {
        // Only admins can register new users
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { username, password, role, display_name } = req.body;

        if (!username || !password || !role || !display_name) {
            return res.status(400).json({ error: 'All fields required' });
        }

        if (!['admin', 'kid'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Check if username already exists
        const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [username]);
        
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password and create user
        const passwordHash = await hashPassword(password);
        
        const result = await db.run(
            'INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)',
            [username, passwordHash, role, display_name]
        );

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: result.id,
                username,
                role,
                display_name,
                family_id: req.user.family_id // New users inherit admin's family
            }
        });
        
        // Assign new user to the same family as the admin
        if (req.user.family_id) {
            await db.run('UPDATE users SET family_id = ? WHERE id = ?', [req.user.family_id, result.id]);
        }
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user info
router.get('/me', authenticateToken, (req, res) => {
    res.json({
        user: {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role,
            display_name: req.user.display_name,
            family_id: req.user.family_id
        }
    });
});

// Get all users (admin only - family scoped)
router.get('/users', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const familyId = req.user.family_id;
        let users;
        
        if (familyId) {
            // Show only users in the same family
            users = await db.all(
                'SELECT id, username, role, display_name, family_id, created_at FROM users WHERE family_id = ? ORDER BY created_at DESC',
                [familyId]
            );
        } else {
            // If admin has no family, show all users (for migration compatibility)
            users = await db.all('SELECT id, username, role, display_name, family_id, created_at FROM users ORDER BY created_at DESC');
        }
        
        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword, targetUserId } = req.body;
        const requestingUserId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // Determine which user's password to change
        let userId = requestingUserId;
        if (targetUserId && isAdmin) {
            // Admin can change any user's password
            userId = targetUserId;
        } else if (targetUserId && !isAdmin) {
            return res.status(403).json({ error: 'Only admins can change other users passwords' });
        }

        // Get the target user
        const targetUser = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // If changing own password, verify current password
        if (userId === requestingUserId && !isAdmin) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Current password is required' });
            }
            
            const validCurrentPassword = await comparePassword(currentPassword, targetUser.password_hash);
            if (!validCurrentPassword) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }
        }

        // Hash new password and update
        const newPasswordHash = await hashPassword(newPassword);
        await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, userId]);

        res.json({ 
            message: isAdmin && targetUserId ? 
                `Password updated for ${targetUser.display_name}` : 
                'Password updated successfully' 
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;