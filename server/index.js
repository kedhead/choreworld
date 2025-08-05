require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Import routes
const authRoutes = require('./routes/auth');
const choreRoutes = require('./routes/chores');
const assignmentRoutes = require('./routes/assignments');

// Import services
const { assignDailyChores, rotateDishDuty } = require('./services/scheduler');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chores', choreRoutes);
app.use('/api/assignments', assignmentRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'ChoreWorld server is running!' 
    });
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

// Schedule dish duty rotation every Monday at 12:01 AM
cron.schedule('1 0 * * 1', async () => {
    console.log('Running weekly dish duty rotation...');
    try {
        await rotateDishDuty();
        console.log('Dish duty rotated successfully');
    } catch (error) {
        console.error('Error rotating dish duty:', error);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🎉 ChoreWorld server running on port ${PORT}`);
    console.log(`📅 Daily chore scheduler active (runs at 1:00 AM)`);
    console.log(`🍽️  Dish duty rotation active (runs Mondays at 12:01 AM)`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down ChoreWorld server...');
    process.exit(0);
});