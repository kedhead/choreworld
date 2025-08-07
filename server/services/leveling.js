const db = require('../database/database');

// XP required for each level (exponential growth)
const getXPRequiredForLevel = (level) => {
    return Math.floor(100 * Math.pow(1.5, level - 1));
};

// Calculate what level a user should be based on total XP
const calculateLevelFromXP = (totalXP) => {
    let level = 1;
    let xpNeeded = 0;
    
    while (xpNeeded <= totalXP) {
        xpNeeded += getXPRequiredForLevel(level);
        if (xpNeeded <= totalXP) {
            level++;
        }
    }
    
    return level;
};

// Get current XP progress towards next level
const getXPProgress = (totalXP, currentLevel) => {
    let xpUsedForCurrentLevel = 0;
    for (let i = 1; i < currentLevel; i++) {
        xpUsedForCurrentLevel += getXPRequiredForLevel(i);
    }
    
    const currentLevelXP = totalXP - xpUsedForCurrentLevel;
    const xpNeededForNext = getXPRequiredForLevel(currentLevel);
    
    return {
        currentXP: currentLevelXP,
        neededXP: xpNeededForNext,
        percentage: Math.floor((currentLevelXP / xpNeededForNext) * 100)
    };
};

// Add XP to a user and handle level ups
const addExperienceToUser = async (userId, xpGained) => {
    try {
        // Get current user stats
        const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user || user.role !== 'kid') {
            throw new Error('User not found or not a kid');
        }

        const newTotalXP = user.total_experience + xpGained;
        const newLevel = calculateLevelFromXP(newTotalXP);
        const leveledUp = newLevel > user.level;

        // Update user's XP and level
        await db.run(
            'UPDATE users SET total_experience = ?, level = ? WHERE id = ?',
            [newTotalXP, newLevel, userId]
        );

        const progress = getXPProgress(newTotalXP, newLevel);

        return {
            leveledUp,
            oldLevel: user.level,
            newLevel,
            xpGained,
            totalXP: newTotalXP,
            progress
        };
    } catch (error) {
        console.error('Error adding experience:', error);
        throw error;
    }
};

// Get user's leveling stats
const getUserLevelStats = async (userId) => {
    try {
        const user = await db.get('SELECT level, total_experience FROM users WHERE id = ?', [userId]);
        if (!user) {
            throw new Error('User not found');
        }

        const progress = getXPProgress(user.total_experience, user.level);
        
        return {
            level: user.level,
            totalXP: user.total_experience,
            progress,
            title: getLevelTitle(user.level)
        };
    } catch (error) {
        console.error('Error getting user level stats:', error);
        throw error;
    }
};

// Get fun title based on level
const getLevelTitle = (level) => {
    const titles = [
        'Chore Rookie',      // Level 1
        'Task Helper',       // Level 2  
        'Cleaning Cadet',    // Level 3
        'Chore Champion',    // Level 4
        'Tidiness Expert',   // Level 5
        'Organization Guru', // Level 6
        'Cleanliness Master',// Level 7
        'Chore Warrior',     // Level 8
        'Household Hero',    // Level 9
        'Supreme Organizer', // Level 10
        'Legendary Cleaner', // Level 11+
    ];
    
    if (level <= titles.length) {
        return titles[level - 1];
    }
    return `${titles[titles.length - 1]} (Level ${level})`;
};

// Get leaderboard of all kids
const getLeaderboard = async () => {
    try {
        const users = await db.all(
            'SELECT id, display_name, level, total_experience FROM users WHERE role = ? ORDER BY level DESC, total_experience DESC',
            ['kid']
        );

        return users.map((user, index) => ({
            rank: index + 1,
            ...user,
            title: getLevelTitle(user.level),
            progress: getXPProgress(user.total_experience, user.level)
        }));
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        throw error;
    }
};

module.exports = {
    addExperienceToUser,
    getUserLevelStats,
    getLevelTitle,
    getLeaderboard,
    getXPRequiredForLevel,
    calculateLevelFromXP,
    getXPProgress
};