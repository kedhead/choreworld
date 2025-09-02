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

// Assign daily chores to all kids (family-scoped)
const assignDailyChores = async (familyId = null) => {
    try {
        const today = formatDate(new Date());
        
        // Get all families or specific family
        let families = [];
        if (familyId) {
            const family = await db.get('SELECT * FROM families WHERE id = ?', [familyId]);
            if (family) families = [family];
        } else {
            families = await db.all('SELECT * FROM families').catch(() => []);
        }
        
        if (families.length === 0) {
            console.log('No families found for daily chore assignment');
            return;
        }
        
        for (const family of families) {
            console.log(`📋 Processing family: ${family.name}`);
            
            // Get kids in this family
            const kids = await db.all(
                'SELECT * FROM users WHERE role = ? AND family_id = ?',
                ['kid', family.id]
            );
            
            if (kids.length === 0) {
                console.log(`No kids found in family ${family.name}`);
                continue;
            }

            // Get active chores for this family
            const chores = await db.all(
                'SELECT * FROM chores WHERE is_active = 1 AND family_id = ?',
                [family.id]
            );
            
            if (chores.length === 0) {
                console.log(`No active chores found for family ${family.name}`);
                continue;
            }

            // Check if assignments already exist for today for this family
            const existingAssignments = await db.all(
                'SELECT COUNT(*) as count FROM daily_assignments WHERE assigned_date = ? AND family_id = ?',
                [today, family.id]
            );

            if (existingAssignments[0].count > 0) {
                console.log(`Daily assignments already exist for family ${family.name} on ${today}`);
                continue;
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
                    'INSERT INTO daily_assignments (user_id, chore_id, assigned_date, points_earned, family_id) VALUES (?, ?, ?, ?, ?)',
                    [kid.id, assignedChore.id, today, assignedChore.points, family.id]
                );
                
                assignedChores.push(assignedChore.id);
                console.log(`Assigned "${assignedChore.name}" to ${kid.display_name} in ${family.name}`);
            }

            console.log(`Daily chores assigned successfully for family ${family.name} on ${today}`);
        }
    } catch (error) {
        console.error('Error in assignDailyChores:', error);
        throw error;
    }
};

// Manual dish duty order - configured by admin
const DISH_DUTY_ORDER = ['Aubrey', 'Mackenzie', 'Zoey'];

// Rotate dish duty weekly (family-scoped)
const rotateDishDuty = async (familyId = null) => {
    try {
        const weekStart = getWeekStart();
        const weekEnd = getWeekEnd();
        const weekStartStr = formatDate(weekStart);
        const weekEndStr = formatDate(weekEnd);

        // Get all families or specific family
        let families = [];
        if (familyId) {
            const family = await db.get('SELECT * FROM families WHERE id = ?', [familyId]);
            if (family) families = [family];
        } else {
            families = await db.all('SELECT * FROM families').catch(() => []);
        }
        
        if (families.length === 0) {
            console.log('No families found for dish duty rotation');
            return;
        }
        
        for (const family of families) {
            console.log(`🍽️ Processing dish duty for family: ${family.name}`);
            
            // Get kids in this family
            const allKids = await db.all(
                'SELECT * FROM users WHERE role = ? AND family_id = ?',
                ['kid', family.id]
            );
            
            if (allKids.length === 0) {
                console.log(`No kids found in family ${family.name}`);
                continue;
            }

            // Check if dish duty already assigned for this week for this family
            const existingDuty = await db.get(
                'SELECT * FROM dish_duty WHERE week_start = ? AND week_end = ? AND family_id = ?',
                [weekStartStr, weekEndStr, family.id]
            );

            if (existingDuty) {
                console.log(`Dish duty already assigned for family ${family.name} for week ${weekStartStr} - ${weekEndStr}`);
                continue;
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

            // Get the last assigned user for this family to determine next in rotation
            const lastAssignment = await db.get(
                'SELECT * FROM dish_duty WHERE family_id = ? ORDER BY created_at DESC LIMIT 1',
                [family.id]
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

            // Deactivate previous assignments for this family only
            await db.run('UPDATE dish_duty SET is_active = 0 WHERE family_id = ?', [family.id]);

            // Create new dish duty assignment
            await db.run(
                'INSERT INTO dish_duty (user_id, week_start, week_end, is_active, family_id) VALUES (?, ?, ?, ?, ?)',
                [assignedKid.id, weekStartStr, weekEndStr, 1, family.id]
            );

            console.log(`Dish duty assigned to ${assignedKid.display_name} in ${family.name} for week ${weekStartStr} - ${weekEndStr}`);
        }
    } catch (error) {
        console.error('Error in rotateDishDuty:', error);
        throw error;
    }
};

// Get current dish duty assignment (family-scoped)
const getCurrentDishDuty = async (familyId = null) => {
    try {
        const weekStart = formatDate(getWeekStart());
        const weekEnd = formatDate(getWeekEnd());

        let query = `
            SELECT dd.*, u.display_name, u.username 
            FROM dish_duty dd
            JOIN users u ON dd.user_id = u.id
            WHERE dd.week_start = ? AND dd.week_end = ? AND dd.is_active = 1
        `;
        const params = [weekStart, weekEnd];
        
        if (familyId) {
            query += ' AND dd.family_id = ?';
            params.push(familyId);
        }

        const duty = await db.get(query, params);
        return duty;
    } catch (error) {
        console.error('Error getting current dish duty:', error);
        throw error;
    }
};

// Get daily assignments for a specific date and user (family-scoped)
const getDailyAssignments = async (userId = null, date = null, familyId = null) => {
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

        if (familyId) {
            query += ' AND da.family_id = ?';
            params.push(familyId);
        }

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

        // Get family_id for completion history
        const userFamily = await db.get('SELECT family_id FROM users WHERE id = ?', [assignment.user_id]);
        
        // Add to completion history
        await db.run(`
            INSERT INTO completion_history (user_id, chore_id, assignment_type, assignment_id, completed_at, points_earned, week_start, family_id)
            VALUES (?, ?, 'daily', ?, ?, ?, ?, ?)
        `, [assignment.user_id, assignment.chore_id, assignmentId, completedAt, assignment.points_earned, weekStart, userFamily?.family_id || null]);

        // Add XP for regular chores (if the user is a kid)
        if (user.role === 'kid' || assignment.user_id !== userId) {
            try {
                const { addExperienceToUser } = require('./leveling');
                const targetUserId = user.role === 'admin' ? assignment.user_id : userId;
                
                // Regular chores give 1x XP (same as points)
                await addExperienceToUser(targetUserId, assignment.points_earned);
            } catch (xpError) {
                console.error('Error adding XP for completed chore:', xpError);
                // Don't fail the whole operation if XP fails
            }
        }

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