const fs = require('fs');
const path = require('path');
// Note: db will be passed as parameter to avoid circular dependency

/**
 * Migration script to add multi-family support
 * This safely migrates existing data to work with families
 */

async function runMultiFamilyMigration(db) {
    console.log('🚀 Starting multi-family migration...');
    
    if (!db) {
        throw new Error('Database instance is required');
    }
    
    try {
        // Step 1: Run the SQL migration
        console.log('📝 Step 1: Running SQL schema migration...');
        const migrationSQL = fs.readFileSync(path.join(__dirname, 'migrate-multi-family.sql'), 'utf8');
        const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await db.run(statement);
            }
        }
        console.log('✅ Schema migration completed');

        // Step 2: Create default family for existing data
        console.log('📝 Step 2: Creating default family...');
        
        // Find the first admin user to be the owner of the default family
        const adminUser = await db.get('SELECT * FROM users WHERE role = ? LIMIT 1', ['admin']);
        
        if (!adminUser) {
            throw new Error('No admin user found. Cannot create default family.');
        }

        // Generate a unique family code
        const defaultFamilyCode = 'FAMILY001';
        
        // Create the default family
        const familyResult = await db.run(
            'INSERT INTO families (name, family_code, created_by) VALUES (?, ?, ?)',
            ['Default Family', defaultFamilyCode, adminUser.id]
        );
        
        const defaultFamilyId = familyResult.id;
        console.log(`✅ Created default family with ID: ${defaultFamilyId}`);

        // Step 3: Assign all existing users to default family
        console.log('📝 Step 3: Migrating existing users...');
        const userResult = await db.run('UPDATE users SET family_id = ? WHERE family_id IS NULL', [defaultFamilyId]);
        console.log(`✅ Assigned ${userResult.changes} users to default family`);

        // Step 4: Assign all existing chores to default family
        console.log('📝 Step 4: Migrating existing chores...');
        const choreResult = await db.run('UPDATE chores SET family_id = ? WHERE family_id IS NULL', [defaultFamilyId]);
        console.log(`✅ Assigned ${choreResult.changes} chores to default family`);

        // Step 5: Assign all existing assignments to default family
        console.log('📝 Step 5: Migrating existing assignments...');
        const assignmentResult = await db.run('UPDATE daily_assignments SET family_id = ? WHERE family_id IS NULL', [defaultFamilyId]);
        console.log(`✅ Assigned ${assignmentResult.changes} daily assignments to default family`);
        
        // Step 5b: Fix any assignments that might have been created without family_id after initial migration
        console.log('📝 Step 5b: Fixing assignments with missing family_id...');
        const fixAssignmentsResult = await db.run(`
            UPDATE daily_assignments 
            SET family_id = (SELECT family_id FROM users WHERE users.id = daily_assignments.user_id)
            WHERE family_id IS NULL AND user_id IN (SELECT id FROM users WHERE family_id IS NOT NULL)
        `);
        console.log(`✅ Fixed ${fixAssignmentsResult.changes} assignments with missing family_id`);

        // Step 6: Assign all existing dish duties to default family
        console.log('📝 Step 6: Migrating existing dish duties...');
        const dishDutyResult = await db.run('UPDATE dish_duty SET family_id = ? WHERE family_id IS NULL', [defaultFamilyId]);
        console.log(`✅ Assigned ${dishDutyResult.changes} dish duties to default family`);

        // Step 7: Assign all existing completion history to default family
        console.log('📝 Step 7: Migrating existing completion history...');
        const historyResult = await db.run('UPDATE completion_history SET family_id = ? WHERE family_id IS NULL', [defaultFamilyId]);
        console.log(`✅ Assigned ${historyResult.changes} completion history records to default family`);

        // Step 8: Assign all existing bonus chores to default family
        console.log('📝 Step 8: Migrating existing bonus chores...');
        const bonusResult = await db.run('UPDATE bonus_chores SET family_id = ? WHERE family_id IS NULL', [defaultFamilyId]);
        console.log(`✅ Assigned ${bonusResult.changes} bonus chores to default family`);

        // Step 9: Verify migration
        console.log('📝 Step 9: Verifying migration...');
        const stats = await getMigrationStats(db);
        console.log('📊 Migration Statistics:');
        console.log(`   - Families created: 1`);
        console.log(`   - Users migrated: ${stats.users}`);
        console.log(`   - Chores migrated: ${stats.chores}`);
        console.log(`   - Assignments migrated: ${stats.assignments}`);
        console.log(`   - Dish duties migrated: ${stats.dishDuties}`);
        console.log(`   - History records migrated: ${stats.history}`);
        console.log(`   - Bonus chores migrated: ${stats.bonusChores}`);

        console.log('🎉 Multi-family migration completed successfully!');
        console.log(`🔑 Default family code: ${defaultFamilyCode}`);
        
        return {
            success: true,
            defaultFamilyId,
            defaultFamilyCode,
            stats
        };

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

async function getMigrationStats(db) {
    const [users, chores, assignments, dishDuties, history, bonusChores] = await Promise.all([
        db.get('SELECT COUNT(*) as count FROM users WHERE family_id IS NOT NULL'),
        db.get('SELECT COUNT(*) as count FROM chores WHERE family_id IS NOT NULL'),
        db.get('SELECT COUNT(*) as count FROM daily_assignments WHERE family_id IS NOT NULL'),
        db.get('SELECT COUNT(*) as count FROM dish_duty WHERE family_id IS NOT NULL'),
        db.get('SELECT COUNT(*) as count FROM completion_history WHERE family_id IS NOT NULL'),
        db.get('SELECT COUNT(*) as count FROM bonus_chores WHERE family_id IS NOT NULL')
    ]);

    return {
        users: users.count,
        chores: chores.count,
        assignments: assignments.count,
        dishDuties: dishDuties.count,
        history: history.count,
        bonusChores: bonusChores.count
    };
}

// Check if migration has already been run
async function checkMigrationStatus(db) {
    try {
        if (!db) {
            return { migrated: false, error: 'Database instance is required' };
        }
        
        // Check if families table exists
        const familiesTable = await db.get(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='families'
        `);
        
        if (!familiesTable) {
            return { migrated: false, reason: 'families table does not exist' };
        }

        // Check if family_id column exists in users table
        const userColumns = await db.all('PRAGMA table_info(users)');
        const hasFamilyId = userColumns.some(col => col.name === 'family_id');
        
        if (!hasFamilyId) {
            return { migrated: false, reason: 'family_id column missing in users table' };
        }

        // Check if there are any families
        const familyCount = await db.get('SELECT COUNT(*) as count FROM families');
        
        return { 
            migrated: familyCount.count > 0, 
            familyCount: familyCount.count 
        };
    } catch (error) {
        return { migrated: false, error: error.message };
    }
}

module.exports = {
    runMultiFamilyMigration,
    checkMigrationStatus,
    getMigrationStats
};