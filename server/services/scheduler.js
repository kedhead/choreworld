const db = require('../database/database');

// Get Monday of current week
const getWeekStart = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
};

// Get Sunday of current week
const getWeekEnd = (date = new Date()) => {
    const monday = getWeekStart(date);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return sunday;
};

// Format date for SQL
const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};

// Assign daily chores to all kids
const assignDailyChores = async () => {
    try {
        const today = formatDate(new Date());
        
        // Get all kids
        const kids = await db.all('SELECT * FROM users WHERE role = ?', ['kid']);
        
        if (kids.length === 0) {
            console.log('No kids found for daily chore assignment');
            return;
        }

        // Get all active chores
        const chores = await db.all('SELECT * FROM chores WHERE is_active = 1');
        
        if (chores.length === 0) {
            console.log('No active chores found for assignment');
            return;
        }

        // Check if assignments already exist for today
        const existingAssignments = await db.all(
            'SELECT COUNT(*) as count FROM daily_assignments WHERE assigned_date = ?',
            [today]
        );

        if (existingAssignments[0].count > 0) {
            console.log(`Daily assignments already exist for ${today}`);
            return;
        }

        // Assign random chores to each kid
        for (const kid of kids) {
            // Get a random chore
            const randomChore = chores[Math.floor(Math.random() * chores.length)];
            
            // Assign the chore
            await db.run(
                'INSERT INTO daily_assignments (user_id, chore_id, assigned_date, points_earned) VALUES (?, ?, ?, ?)',
                [kid.id, randomChore.id, today, randomChore.points]
            );
            
            console.log(`Assigned "${randomChore.name}" to ${kid.display_name} for ${today}`);
        }

        console.log(`Daily chores assigned successfully for ${today}`);
    } catch (error) {
        console.error('Error in assignDailyChores:', error);
        throw error;
    }
};

// Rotate dish duty weekly
const rotateDishDuty = async () => {
    try {
        const weekStart = getWeekStart();
        const weekEnd = getWeekEnd();
        const weekStartStr = formatDate(weekStart);
        const weekEndStr = formatDate(weekEnd);

        // Get all kids
        const kids = await db.all('SELECT * FROM users WHERE role = ? ORDER BY id', ['kid']);
        
        if (kids.length === 0) {
            console.log('No kids found for dish duty rotation');
            return;
        }

        // Check if dish duty already assigned for this week
        const existingDuty = await db.get(
            'SELECT * FROM dish_duty WHERE week_start = ? AND week_end = ?',
            [weekStartStr, weekEndStr]
        );

        if (existingDuty) {
            console.log(`Dish duty already assigned for week ${weekStartStr} - ${weekEndStr}`);
            return;
        }

        // Get the last assigned user to determine next in rotation
        const lastAssignment = await db.get(
            'SELECT * FROM dish_duty ORDER BY created_at DESC LIMIT 1'
        );

        let nextKidIndex = 0;
        
        if (lastAssignment) {
            // Find the index of the last assigned kid
            const lastKidIndex = kids.findIndex(kid => kid.id === lastAssignment.user_id);
            if (lastKidIndex !== -1) {
                nextKidIndex = (lastKidIndex + 1) % kids.length;
            }
        }

        const assignedKid = kids[nextKidIndex];

        // Deactivate all previous assignments
        await db.run('UPDATE dish_duty SET is_active = 0');

        // Create new dish duty assignment
        await db.run(
            'INSERT INTO dish_duty (user_id, week_start, week_end, is_active) VALUES (?, ?, ?, ?)',
            [assignedKid.id, weekStartStr, weekEndStr, 1]
        );

        console.log(`Dish duty assigned to ${assignedKid.display_name} for week ${weekStartStr} - ${weekEndStr}`);
    } catch (error) {
        console.error('Error in rotateDishDuty:', error);
        throw error;
    }
};

// Get current dish duty assignment
const getCurrentDishDuty = async () => {
    try {
        const weekStart = formatDate(getWeekStart());
        const weekEnd = formatDate(getWeekEnd());

        const duty = await db.get(`
            SELECT dd.*, u.display_name, u.username 
            FROM dish_duty dd
            JOIN users u ON dd.user_id = u.id
            WHERE dd.week_start = ? AND dd.week_end = ? AND dd.is_active = 1
        `, [weekStart, weekEnd]);

        return duty;
    } catch (error) {
        console.error('Error getting current dish duty:', error);
        throw error;
    }
};

// Get daily assignments for a specific date and user
const getDailyAssignments = async (userId = null, date = null) => {
    try {
        const targetDate = date || formatDate(new Date());
        let query = `
            SELECT da.*, c.name as chore_name, c.description as chore_description, u.display_name
            FROM daily_assignments da
            JOIN chores c ON da.chore_id = c.id
            JOIN users u ON da.user_id = u.id
            WHERE da.assigned_date = ?
        `;
        const params = [targetDate];

        if (userId) {
            query += ' AND da.user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY u.display_name';

        const assignments = await db.all(query, params);
        return assignments;
    } catch (error) {
        console.error('Error getting daily assignments:', error);
        throw error;
    }
};

// Mark assignment as completed
const completeAssignment = async (assignmentId, userId) => {
    try {
        // Verify the assignment belongs to the user or user is admin
        const user = await db.get('SELECT role FROM users WHERE id = ?', [userId]);
        
        let assignment;
        if (user.role === 'admin') {
            assignment = await db.get('SELECT * FROM daily_assignments WHERE id = ?', [assignmentId]);
        } else {
            assignment = await db.get('SELECT * FROM daily_assignments WHERE id = ? AND user_id = ?', [assignmentId, userId]);
        }

        if (!assignment) {
            throw new Error('Assignment not found or access denied');
        }

        if (assignment.is_completed) {
            throw new Error('Assignment already completed');
        }

        const completedAt = new Date().toISOString();
        const weekStart = formatDate(getWeekStart(new Date(assignment.assigned_date)));

        // Update assignment
        await db.run(
            'UPDATE daily_assignments SET is_completed = 1, completed_at = ? WHERE id = ?',
            [completedAt, assignmentId]
        );

        // Add to completion history
        await db.run(`
            INSERT INTO completion_history (user_id, chore_id, assignment_type, assignment_id, completed_at, points_earned, week_start)
            VALUES (?, ?, 'daily', ?, ?, ?, ?)
        `, [assignment.user_id, assignment.chore_id, assignmentId, completedAt, assignment.points_earned, weekStart]);

        console.log(`Assignment ${assignmentId} marked as completed`);
        return true;
    } catch (error) {
        console.error('Error completing assignment:', error);
        throw error;
    }
};

module.exports = {
    assignDailyChores,
    rotateDishDuty,
    getCurrentDishDuty,
    getDailyAssignments,
    completeAssignment,
    getWeekStart,
    getWeekEnd,
    formatDate
};