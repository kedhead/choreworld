-- Migration: Flexible Weekly Chore Assignment System
-- Replaces hardcoded dish duty with configurable weekly chores

-- Table for family-specific weekly chore types (dish duty, trash, pet care, etc.)
CREATE TABLE IF NOT EXISTS weekly_chore_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL, -- e.g., "Dish Duty", "Trash Duty", "Pet Care"
    description TEXT,
    icon VARCHAR(50) DEFAULT '🏠', -- emoji or icon identifier
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id),
    UNIQUE(family_id, name)
);

-- Table for weekly chore assignments (replaces dish_duty)
CREATE TABLE IF NOT EXISTS weekly_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weekly_chore_type_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    family_id INTEGER NOT NULL,
    week_start DATE NOT NULL, -- Monday of the week
    week_end DATE NOT NULL,   -- Sunday of the week
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (weekly_chore_type_id) REFERENCES weekly_chore_types(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (family_id) REFERENCES families(id),
    UNIQUE(weekly_chore_type_id, week_start, week_end)
);

-- Table for rotation order management per chore type per family
CREATE TABLE IF NOT EXISTS weekly_rotation_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weekly_chore_type_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    family_id INTEGER NOT NULL,
    rotation_order INTEGER NOT NULL, -- 0, 1, 2, etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (weekly_chore_type_id) REFERENCES weekly_chore_types(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (family_id) REFERENCES families(id),
    UNIQUE(weekly_chore_type_id, user_id),
    UNIQUE(weekly_chore_type_id, rotation_order)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_weekly_chore_types_family_id ON weekly_chore_types(family_id);
CREATE INDEX IF NOT EXISTS idx_weekly_assignments_family_week ON weekly_assignments(family_id, week_start, week_end);
CREATE INDEX IF NOT EXISTS idx_weekly_assignments_user ON weekly_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_rotation_orders_chore_type ON weekly_rotation_orders(weekly_chore_type_id);
CREATE INDEX IF NOT EXISTS idx_weekly_rotation_orders_family ON weekly_rotation_orders(family_id);