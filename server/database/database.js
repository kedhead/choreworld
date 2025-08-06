const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Use persistent storage path for Render or fallback to local
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'choreworld.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

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
        const correctHash = '$2a$10$4GoOEU8v2MDFSw0NN9aGRuaXDosuMBmr4hPS0w8r350Y5URf5XEHC';
        this.db.run(
            'UPDATE users SET password_hash = ? WHERE username = ? AND role = ?',
            [correctHash, 'admin', 'admin'],
            (err) => {
                if (err) {
                    console.error('Error updating admin password:', err);
                } else {
                    console.log('Admin password hash updated');
                }
            }
        );
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

    // Debug method to check database stats
    async getStats() {
        try {
            const users = await this.all('SELECT COUNT(*) as count FROM users');
            const chores = await this.all('SELECT COUNT(*) as count FROM chores');
            const assignments = await this.all('SELECT COUNT(*) as count FROM daily_assignments');
            const dishDuty = await this.all('SELECT COUNT(*) as count FROM dish_duty');
            
            return {
                users: users[0].count,
                chores: chores[0].count,
                daily_assignments: assignments[0].count,
                dish_duty: dishDuty[0].count,
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