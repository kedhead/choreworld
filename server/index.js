require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Import routes
const authRoutes = require('./routes/auth');
const choreRoutes = require('./routes/chores');
const assignmentRoutes = require('./routes/assignments');
const familyRoutes = require('./routes/families');
const paymentRoutes = require('./routes/payments');
const weeklyChoreRoutes = require('./routes/weekly-chores');

// Import services
const { assignDailyChores, rotateDishDuty, rotateWeeklyChores } = require('./services/scheduler');

// Middleware
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000', 
    'https://projectepoch.org',
    'https://web-production-e1fae.up.railway.app',
    'https://master--project-epoch.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200, // For legacy browser support
  maxAge: 86400 // 24 hours preflight cache
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chores', choreRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/weekly-chores', weeklyChoreRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'ChoreWorld server is running!',
        version: '2.0-leveling-system',
        endpoints: [
            '/api/auth/*',
            '/api/chores/*', 
            '/api/assignments/*',
            '/api/assignments/bonus/available',
            '/api/assignments/leaderboard',
            '/api/families/*',
            '/api/payments/*',
            '/api/weekly-chores/*'
        ]
    });
});

// Debug endpoint for database stats
app.get('/api/debug/db-stats', async (req, res) => {
    try {
        const db = require('./database/database');
        const stats = await db.getStats();
        res.json({
            timestamp: new Date().toISOString(),
            database_stats: stats,
            process_uptime: process.uptime(),
            process_pid: process.pid
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Emergency restore users endpoint (admin only)
app.post('/api/debug/restore-users', async (req, res) => {
    try {
        const db = require('./database/database');
        await db.restoreEssentialUsers();
        res.json({ 
            message: 'Essential users restored successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Schedule daily chore assignment at 1:00 AM
cron.schedule('0 1 * * *', async () => {
    console.log('Running daily chore assignment...');
    try {
        await assignDailyChores();
        console.log('Daily chores assigned successfully');
    } catch (error) {
        console.error('Error assigning daily chores:', error);
    }
});

// Schedule weekly chore rotation every Monday at 12:01 AM
cron.schedule('1 0 * * 1', async () => {
    console.log('Running weekly chore rotation...');
    try {
        await rotateWeeklyChores();
        console.log('Weekly chores rotated successfully');
    } catch (error) {
        console.error('Error rotating weekly chores:', error);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🎉 ChoreWorld server running on port ${PORT}`);
    console.log(`📅 Daily chore scheduler active (runs at 1:00 AM)`);
    console.log(`🏠 Weekly chore rotation active (runs Mondays at 12:01 AM)`);
    console.log(`🏠 Working directory: ${process.cwd()}`);
    console.log(`🗏️ Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Ensure essential users exist on startup
    const db = require('./database/database');
    
    // Always ensure essential users exist on startup
    setTimeout(async () => {
        try {
            await db.restoreEssentialUsers();
            
            // Initialize production database (leveling system and bonus chores)
            const { initProductionDatabase } = require('./database/init-production');
            await initProductionDatabase();
        } catch (error) {
            console.error('❌ Startup initialization failed:', error);
        }
    }, 2000); // Wait 2 seconds for database to be fully initialized
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down ChoreWorld server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Received SIGTERM, shutting down ChoreWorld server...');
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});