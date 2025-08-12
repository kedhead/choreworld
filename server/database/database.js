const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Use persistent storage path for Railway or fallback to local
// Railway provides persistent storage at /app/data or we can use a custom path
const getDbPath = () => {
    if (process.env.DATABASE_PATH) {
        return process.env.DATABASE_PATH;
    }
    
    if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
        return path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'choreworld.db');
    }
    
    // Default fallback
    return path.join(__dirname, 'choreworld.db');
};

const DB_PATH = getDbPath();
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

console.log('🗄️  Database configuration:');
console.log('   - DATABASE_PATH env:', process.env.DATABASE_PATH);
console.log('   - RAILWAY_VOLUME_MOUNT_PATH env:', process.env.RAILWAY_VOLUME_MOUNT_PATH);
console.log('   - Final DB_PATH:', DB_PATH);
console.log('   - __dirname:', __dirname);

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        const dbExists = fs.existsSync(DB_PATH);
        console.log(`🗄️  Database file exists: ${dbExists}`);
        console.log(`🗄️  Database path: ${DB_PATH}`);
        
        this.db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('❌ Error opening database:', err);
                return;
            }
            console.log('✅ Connected to SQLite database');
        });

        // Create tables if database is new
        if (!dbExists) {
            console.log('🏗️  Creating new database schema...');
            this.createTables();
        } else {
            console.log('📊 Using existing database');
            // Still fix admin password in case it needs updating
            this.fixAdminPassword();
            
            // Check and run multi-family migration if needed
            this.checkAndRunMigration();
        }
    }

    createTables() {
        console.log('⚠️  WARNING: Database file missing! Creating fresh database...');
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        this.db.serialize(() => {
            statements.forEach(statement => {
                if (statement.trim()) {
                    this.db.run(statement, (err) => {
                        if (err) {
                            console.error('❌ Error creating table:', err);
                        }
                    });
                }
            });
            
            // Ensure admin user has correct password hash
            this.fixAdminPassword();
            
            // Auto-restore essential users when database resets
            this.restoreEssentialUsers();
            
            // Run multi-family migration for new databases
            setTimeout(() => {
                this.checkAndRunMigration();
            }, 1000);
        });
        
        console.log('✅ Database initialized with fresh schema');
    }

    // Restore essential users that should always exist
    restoreEssentialUsers() {
        console.log('🔄 Auto-restoring essential users due to database reset...');
        
        // Essential users to restore (using default passwords)
        const essentialUsers = [
            { username: 'aubrey', password: 'kid123', display_name: 'Aubrey', role: 'kid' },
            { username: 'mackenzie', password: 'kid123', display_name: 'Mackenzie', role: 'kid' },
            { username: 'zoey', password: 'kid123', display_name: 'Zoey', role: 'kid' }
        ];

        const bcrypt = require('bcryptjs');
        
        essentialUsers.forEach(async (userData) => {
            try {
                // Check if user already exists
                const existingUser = await this.get('SELECT id FROM users WHERE username = ?', [userData.username]);
                if (!existingUser) {
                    const hashedPassword = await bcrypt.hash(userData.password, 10);
                    await this.run(
                        'INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)',
                        [userData.username, hashedPassword, userData.role, userData.display_name]
                    );
                    console.log(`✅ Restored user: ${userData.display_name}`);
                }
            } catch (error) {
                console.error(`❌ Failed to restore user ${userData.display_name}:`, error);
            }
        });
    }
    
    fixAdminPassword() {
        // Only fix admin password if it doesn't exist (for fresh database creation)
        this.db.get('SELECT password_hash FROM users WHERE username = ? AND role = ?', ['admin', 'admin'], (err, row) => {
            if (err) {
                console.error('Error checking admin password:', err);
                return;
            }
            
            // Only set default password if admin user doesn't exist or has no password
            if (!row || !row.password_hash) {
                const correctHash = '$2a$10$4GoOEU8v2MDFSw0NN9aGRuaXDosuMBmr4hPS0w8r350Y5URf5XEHC';
                this.db.run(
                    'UPDATE users SET password_hash = ? WHERE username = ? AND role = ?',
                    [correctHash, 'admin', 'admin'],
                    (err) => {
                        if (err) {
                            console.error('Error updating admin password:', err);
                        } else {
                            console.log('🔧 Admin password initialized to default (admin123)');
                        }
                    }
                );
            } else {
                console.log('✅ Admin password exists - keeping current password');
            }
        });
    }

    // Helper method to run queries with promises
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // Check and run multi-family migration if needed
    async checkAndRunMigration() {
        try {
            // Run multi-family migration
            const { checkMigrationStatus, runMultiFamilyMigration } = require('./migrate-multi-family');
            const status = await checkMigrationStatus(this);
            
            if (!status.migrated) {
                console.log('🚀 Running multi-family migration...');
                await runMultiFamilyMigration(this);
                console.log('✅ Multi-family migration completed');
            } else {
                console.log('✅ Multi-family migration already completed');
            }

            // Run payment tracking migration
            const { checkPaymentTrackingMigrationStatus, runPaymentTrackingMigration } = require('./migrate-payment-tracking');
            const paymentStatus = await checkPaymentTrackingMigrationStatus(this);
            
            if (!paymentStatus.migrated) {
                console.log('🚀 Running payment tracking migration...');
                await runPaymentTrackingMigration(this);
                console.log('✅ Payment tracking migration completed');
            } else {
                console.log('✅ Payment tracking migration already completed');
            }

            // Fix any assignments missing family_id (one-time fix)
            console.log('🔧 Checking for assignments missing family_id...');
            const fixResult = await this.run(`
                UPDATE daily_assignments 
                SET family_id = (SELECT family_id FROM users WHERE users.id = daily_assignments.user_id)
                WHERE family_id IS NULL AND user_id IN (SELECT id FROM users WHERE family_id IS NOT NULL)
            `);
            if (fixResult.changes > 0) {
                console.log(`✅ Fixed ${fixResult.changes} assignments with missing family_id`);
            } else {
                console.log('✅ All assignments have proper family_id');
            }
        } catch (error) {
            console.error('❌ Migration check/run failed:', error.message);
            console.error('❌ Migration stack trace:', error.stack);
            // Don't throw error to prevent server from crashing
            // Migration failure shouldn't prevent server from starting
        }
    }

    // Family-scoped query helpers
    async getFamilyScoped(sql, params = [], familyId = null) {
        if (familyId && sql.includes('WHERE')) {
            sql = sql.replace('WHERE', `WHERE family_id = ${familyId} AND`);
        } else if (familyId) {
            sql += ` WHERE family_id = ${familyId}`;
        }
        return this.get(sql, params);
    }

    async getAllFamilyScoped(sql, params = [], familyId = null) {
        if (familyId && sql.includes('WHERE')) {
            sql = sql.replace('WHERE', `WHERE family_id = ${familyId} AND`);
        } else if (familyId) {
            sql += ` WHERE family_id = ${familyId}`;
        }
        return this.all(sql, params);
    }

    async runFamilyScoped(sql, params = [], familyId = null) {
        // For INSERT statements, add family_id to the values
        if (familyId && sql.toUpperCase().startsWith('INSERT')) {
            // This is a simplified approach - in practice, you'd want more sophisticated parsing
            const insertMatch = sql.match(/INSERT INTO (\w+) \(([^)]+)\) VALUES \(([^)]+)\)/);
            if (insertMatch) {
                const [, table, columns, values] = insertMatch;
                if (!columns.includes('family_id')) {
                    const newColumns = columns + ', family_id';
                    const newValues = values + ', ?';
                    sql = `INSERT INTO ${table} (${newColumns}) VALUES (${newValues})`;
                    params.push(familyId);
                }
            }
        }
        return this.run(sql, params);
    }

    // Debug method to check database stats
    async getStats() {
        try {
            const users = await this.all('SELECT COUNT(*) as count FROM users');
            const chores = await this.all('SELECT COUNT(*) as count FROM chores');
            const assignments = await this.all('SELECT COUNT(*) as count FROM daily_assignments');
            const dishDuty = await this.all('SELECT COUNT(*) as count FROM dish_duty');
            const families = await this.all('SELECT COUNT(*) as count FROM families').catch(() => [{ count: 0 }]);
            
            return {
                users: users[0].count,
                chores: chores[0].count,
                daily_assignments: assignments[0].count,
                dish_duty: dishDuty[0].count,
                families: families[0].count,
                db_path: DB_PATH,
                db_exists: fs.existsSync(DB_PATH)
            };
        } catch (error) {
            console.error('Error getting database stats:', error);
            return { error: error.message };
        }
    }
}

module.exports = new Database();