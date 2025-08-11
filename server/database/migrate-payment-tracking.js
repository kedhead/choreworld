const fs = require('fs');
const path = require('path');

async function checkPaymentTrackingMigrationStatus(db) {
    try {
        // Check if weekly_payments table exists
        const tableExists = await db.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='weekly_payments'"
        );
        
        return {
            migrated: !!tableExists,
            message: tableExists ? 'Payment tracking table already exists' : 'Payment tracking table needs to be created'
        };
    } catch (error) {
        console.error('Error checking payment tracking migration status:', error);
        return { migrated: false, message: 'Error checking migration status' };
    }
}

async function runPaymentTrackingMigration(db) {
    try {
        console.log('🔄 Starting payment tracking migration...');
        
        // Read the migration SQL
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'add-payment-tracking.sql'), 
            'utf8'
        );
        
        // Split into individual statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        
        // Execute each statement
        for (const statement of statements) {
            if (statement.trim()) {
                console.log('🔧 Executing:', statement.substring(0, 50) + '...');
                await db.run(statement);
            }
        }
        
        console.log('✅ Payment tracking migration completed successfully');
        return { success: true, message: 'Payment tracking migration completed' };
        
    } catch (error) {
        console.error('❌ Payment tracking migration failed:', error);
        throw error;
    }
}

module.exports = {
    checkPaymentTrackingMigrationStatus,
    runPaymentTrackingMigration
};