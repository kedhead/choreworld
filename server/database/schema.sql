-- ChoreWorld Database Schema

-- Users table (parents and kids)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'kid')),
    display_name VARCHAR(100) NOT NULL,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    total_experience INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chores table (master list of available chores)
CREATE TABLE chores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    is_bonus_available BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bonus chores table (optional extra chores kids can choose)
CREATE TABLE bonus_chores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    chore_id INTEGER NOT NULL,
    completed_date DATE NOT NULL,
    points_earned INTEGER NOT NULL,
    experience_gained INTEGER NOT NULL,
    completed_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (chore_id) REFERENCES chores(id)
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
('admin', '$2a$10$4GoOEU8v2MDFSw0NN9aGRuaXDosuMBmr4hPS0w8r350Y5URf5XEHC', 'admin', 'Parent');

-- Insert default chores
INSERT INTO chores (name, description, points, is_bonus_available) VALUES 
-- Regular daily chores
('Take out trash', 'Empty all trash bins and take to curb', 2, 0),
('Vacuum living room', 'Vacuum the main living area', 2, 0),
('Clean bathroom', 'Wipe down sink, toilet, and mirror', 3, 0),
('Make bed', 'Make your bed neatly', 1, 0),
('Feed pets', 'Give food and water to pets', 1, 0),
('Wipe kitchen counters', 'Clean and sanitize kitchen counters', 2, 0),
('Organize toys', 'Put toys back in their proper places', 1, 0),
('Water plants', 'Water indoor and outdoor plants', 1, 0),
('Sweep porch', 'Sweep front and back porch areas', 2, 0),
('Load dishwasher', 'Load dirty dishes into dishwasher', 2, 0),

-- Bonus chores (worth extra XP!)
('Deep clean room', 'Organize closet, dust surfaces, vacuum thoroughly', 5, 1),
('Wash car', 'Wash and dry the family car', 8, 1),
('Weed garden', 'Pull weeds from flower beds and garden', 6, 1),
('Clean garage', 'Sweep and organize garage space', 7, 1),
('Wash windows', 'Clean all windows inside and outside', 6, 1),
('Organize basement', 'Tidy and organize basement storage', 8, 1),
('Rake leaves', 'Rake and bag yard leaves', 5, 1),
('Clean out car', 'Vacuum and wipe down car interior', 4, 1),
('Scrub bathtub', 'Deep clean and scrub bathroom tub/shower', 5, 1),
('Mop all floors', 'Mop kitchen, bathroom, and hallway floors', 6, 1);