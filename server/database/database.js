const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'choreworld.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        const dbExists = fs.existsSync(DB_PATH);
        
        this.db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                return;
            }
            console.log('Connected to SQLite database');
        });

        // Create tables if database is new
        if (!dbExists) {
            this.createTables();
        }
    }

    createTables() {
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        this.db.serialize(() => {
            statements.forEach(statement => {
                if (statement.trim()) {
                    this.db.run(statement, (err) => {
                        if (err) {
                            console.error('Error creating table:', err);
                        }
                    });
                }
            });
        });
        
        console.log('Database initialized with schema');
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
}

module.exports = new Database();