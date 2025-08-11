-- Multi-Family Support Migration
-- This migration adds family support while preserving all existing data

-- Create families table
CREATE TABLE IF NOT EXISTS families (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    family_code VARCHAR(20) UNIQUE NOT NULL,
    created_by INTEGER NOT NULL, -- admin user who created the family
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create family_invites table for joining families
CREATE TABLE IF NOT EXISTS family_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    invite_code VARCHAR(50) UNIQUE NOT NULL,
    created_by INTEGER NOT NULL, -- admin who created invite
    expires_at DATETIME NOT NULL,
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Add family_id column to users table (nullable initially for migration)
ALTER TABLE users ADD COLUMN family_id INTEGER REFERENCES families(id);

-- Add family_id column to chores table (nullable initially for migration)
ALTER TABLE chores ADD COLUMN family_id INTEGER REFERENCES families(id);

-- Add family_id column to daily_assignments table
ALTER TABLE daily_assignments ADD COLUMN family_id INTEGER REFERENCES families(id);

-- Add family_id column to dish_duty table
ALTER TABLE dish_duty ADD COLUMN family_id INTEGER REFERENCES families(id);

-- Add family_id column to completion_history table
ALTER TABLE completion_history ADD COLUMN family_id INTEGER REFERENCES families(id);

-- Add family_id column to bonus_chores table
ALTER TABLE bonus_chores ADD COLUMN family_id INTEGER REFERENCES families(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);
CREATE INDEX IF NOT EXISTS idx_chores_family_id ON chores(family_id);
CREATE INDEX IF NOT EXISTS idx_daily_assignments_family_id ON daily_assignments(family_id);
CREATE INDEX IF NOT EXISTS idx_dish_duty_family_id ON dish_duty(family_id);
CREATE INDEX IF NOT EXISTS idx_completion_history_family_id ON completion_history(family_id);
CREATE INDEX IF NOT EXISTS idx_bonus_chores_family_id ON bonus_chores(family_id);
CREATE INDEX IF NOT EXISTS idx_family_invites_family_id ON family_invites(family_id);
CREATE INDEX IF NOT EXISTS idx_family_invites_invite_code ON family_invites(invite_code);