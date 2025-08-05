-- ChoreWorld Database Schema

-- Users table (parents and kids)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'kid')),
    display_name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chores table (master list of available chores)
CREATE TABLE chores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dish duty assignments (weekly rotation)
CREATE TABLE dish_duty (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    week_start DATE NOT NULL, -- Monday of the week
    week_end DATE NOT NULL,   -- Sunday of the week
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(week_start, week_end)
);

-- Daily chore assignments
CREATE TABLE daily_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    chore_id INTEGER NOT NULL,
    assigned_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT 0,
    completed_at DATETIME NULL,
    points_earned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (chore_id) REFERENCES chores(id),
    UNIQUE(user_id, assigned_date, chore_id)
);

-- Completion history for tracking progress
CREATE TABLE completion_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    chore_id INTEGER NOT NULL,
    assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('daily', 'dish_duty')),
    assignment_id INTEGER NOT NULL, -- references daily_assignments.id or dish_duty.id
    completed_at DATETIME NOT NULL,
    points_earned INTEGER DEFAULT 0,
    week_start DATE NOT NULL, -- for grouping weekly summaries
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (chore_id) REFERENCES chores(id)
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password_hash, role, display_name) VALUES 
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Parent');

-- Insert default chores
INSERT INTO chores (name, description, points) VALUES 
('Take out trash', 'Empty all trash bins and take to curb', 2),
('Vacuum living room', 'Vacuum the main living area', 2),
('Clean bathroom', 'Wipe down sink, toilet, and mirror', 3),
('Make bed', 'Make your bed neatly', 1),
('Feed pets', 'Give food and water to pets', 1),
('Wipe kitchen counters', 'Clean and sanitize kitchen counters', 2),
('Organize toys', 'Put toys back in their proper places', 1),
('Water plants', 'Water indoor and outdoor plants', 1),
('Sweep porch', 'Sweep front and back porch areas', 2),
('Load dishwasher', 'Load dirty dishes into dishwasher', 2);