const express = require('express');
const router = express.Router();
const db = require('../database/database');
const { generateToken, hashPassword, comparePassword, authenticateToken } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log('Login attempt:', { username, passwordProvided: !!password });

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Find user
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        
        console.log('User found:', user ? { id: user.id, username: user.username, role: user.role } : 'No user found');
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('Password hash from DB:', user.password_hash);

        // Check password
        const validPassword = await comparePassword(password, user.password_hash);
        
        console.log('Password validation result:', validPassword);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user);

        console.log('Login successful for user:', user.username);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                display_name: user.display_name
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
                display_name
            }
        });
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
            display_name: req.user.display_name
        }
    });
});

// Get all users (admin only)
router.get('/users', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const users = await db.all('SELECT id, username, role, display_name, created_at FROM users ORDER BY created_at DESC');
        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Debug endpoint to check admin user (temporary)
router.get('/debug/admin', async (req, res) => {
    try {
        const user = await db.get('SELECT username, password_hash, role, created_at FROM users WHERE username = ?', ['admin']);
        res.json(user || { message: 'Admin user not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;