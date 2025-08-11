const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'choreworld-secret-key-2025';

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username, 
            role: user.role,
            display_name: user.display_name,
            family_id: user.family_id || null
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Verify JWT token middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Admin role check middleware
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Family membership check middleware
const requireFamily = (req, res, next) => {
    if (!req.user.family_id) {
        return res.status(403).json({ error: 'Family membership required' });
    }
    next();
};

// Same family check middleware (for accessing family-scoped resources)
const requireSameFamily = (paramName = 'familyId') => {
    return (req, res, next) => {
        const targetFamilyId = req.params[paramName] || req.body[paramName] || req.query[paramName];
        
        if (!req.user.family_id) {
            return res.status(403).json({ error: 'Family membership required' });
        }
        
        if (targetFamilyId && parseInt(targetFamilyId) !== req.user.family_id) {
            return res.status(403).json({ error: 'Access denied: different family' });
        }
        
        next();
    };
};

// Hash password
const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

// Compare password
const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

module.exports = {
    generateToken,
    authenticateToken,
    requireAdmin,
    requireFamily,
    requireSameFamily,
    hashPassword,
    comparePassword
};