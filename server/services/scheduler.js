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

        // Shuffle chores and assign unique chores to each kid
        const shuffledChores = [...chores].sort(() => Math.random() - 0.5);
        const assignedChores = [];
        
        for (let i = 0; i < kids.length; i++) {
            const kid = kids[i];
            
            // If we have more kids than chores, cycle through chores
            const choreIndex = i % shuffledChores.length;
            let assignedChore = shuffledChores[choreIndex];
            
            // If we're cycling and this chore was already assigned today, try to find an unassigned one
            if (assignedChores.includes(assignedChore.id) && shuffledChores.length > assignedChores.length) {
                assignedChore = shuffledChores.find(chore => !assignedChores.includes(chore.id)) || assignedChore;
            }
            
            // Assign the chore
            await db.run(
                'INSERT INTO daily_assignments (user_id, chore_id, assigned_date, points_earned) VALUES (?, ?, ?, ?)',
                [kid.id, assignedChore.id, today, assignedChore.points]
            );
            
            assignedChores.push(assignedChore.id);
            console.log(`Assigned "${assignedChore.name}" to ${kid.display_name} for ${today}`);
        }

        console.log(`Daily chores assigned successfully for ${today}`);
    } catch (error) {
        console.error('Error in assignDailyChores:', error);
        throw error;
    }
};

// Manual dish duty order - configured by admin
const DISH_DUTY_ORDER = ['Aubrey', 'Mackenzie', 'Zoey'];

// Rotate dish duty weekly
const rotateDishDuty = async () => {
    try {
        const weekStart = getWeekStart();
        const weekEnd = getWeekEnd();
        const weekStartStr = formatDate(weekStart);
        const weekEndStr = formatDate(weekEnd);

        // Get all kids
        const allKids = await db.all('SELECT * FROM users WHERE role = ?', ['kid']);
        
        if (allKids.length === 0) {
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

        // Order kids according to the manual rotation order
        const orderedKids = [];
        
        // First, add kids in the specified order
        for (const name of DISH_DUTY_ORDER) {
            const kid = allKids.find(k => k.display_name === name);
            if (kid) {
                orderedKids.push(kid);
            }
        }
        
        // Add any remaining kids not in the specified order (fallback)
        for (const kid of allKids) {
            if (!orderedKids.find(k => k.id === kid.id)) {
                orderedKids.push(kid);
            }
        }

        if (orderedKids.length === 0) {
            console.log('No kids found matching the dish duty order configuration');
            return;
        }

        // Get the last assigned user to determine next in rotation
        const lastAssignment = await db.get(
            'SELECT * FROM dish_duty ORDER BY created_at DESC LIMIT 1'
        );

        let nextKidIndex = 0;
        
        if (lastAssignment) {
            // Find the index of the last assigned kid in our ordered list
            const lastKidIndex = orderedKids.findIndex(kid => kid.id === lastAssignment.user_id);
            if (lastKidIndex !== -1) {
                nextKidIndex = (lastKidIndex + 1) % orderedKids.length;
            }
        }

        const assignedKid = orderedKids[nextKidIndex];

        // Deactivate all previous assignments
        await db.run('UPDATE dish_duty SET is_active = 0');

        // Create new dish duty assignment
        await db.run(
            'INSERT INTO dish_duty (user_id, week_start, week_end, is_active) VALUES (?, ?, ?, ?)',
            [assignedKid.id, weekStartStr, weekEndStr, 1]
        );

        console.log(`Dish duty assigned to ${assignedKid.display_name} for week ${weekStartStr} - ${weekEndStr} (order: ${DISH_DUTY_ORDER.join(' → ')})`);
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

// Get dish duty order configuration
const getDishDutyOrder = () => {
    return DISH_DUTY_ORDER;
};

// Update dish duty order (admin only)
const updateDishDutyOrder = (newOrder) => {
    if (!Array.isArray(newOrder) || newOrder.length === 0) {
        throw new Error('Invalid order - must be a non-empty array');
    }
    
    // Update the order (in a real app, this would be stored in database)
    DISH_DUTY_ORDER.length = 0;
    DISH_DUTY_ORDER.push(...newOrder);
    
    console.log(`Dish duty order updated to: ${DISH_DUTY_ORDER.join(' → ')}`);
    return DISH_DUTY_ORDER;
};

module.exports = {
    assignDailyChores,
    rotateDishDuty,
    getCurrentDishDuty,
    getDailyAssignments,
    completeAssignment,
    getWeekStart,
    getWeekEnd,
    formatDate,
    getDishDutyOrder,
    updateDishDutyOrder
};