-- Add payment tracking table for parents to track weekly chore payments

CREATE TABLE weekly_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    family_id INTEGER NOT NULL,
    week_start DATE NOT NULL, -- Monday of the week
    week_end DATE NOT NULL,   -- Sunday of the week
    paid_by INTEGER NOT NULL, -- Parent who marked as paid
    paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(10,2) DEFAULT 0.00, -- Optional: amount paid
    notes TEXT, -- Optional: payment notes
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (paid_by) REFERENCES users(id),
    UNIQUE(user_id, week_start, week_end, family_id) -- One payment record per user per week per family
);

-- Index for efficient queries
CREATE INDEX idx_weekly_payments_user_week ON weekly_payments(user_id, week_start, family_id);
CREATE INDEX idx_weekly_payments_family_week ON weekly_payments(family_id, week_start);