// Production startup script for ChoreWorld
console.log('🚀 Starting ChoreWorld server...');

// Change to server directory and start the application
process.chdir('./server');
require('./index.js');