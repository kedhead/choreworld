const fs = require('fs');
const path = require('path');

async function migrateWeeklyChores(db) {
    console.log('🚀 Starting weekly chores migration...');
    
    try {
        // Step 1: Run SQL schema migration
        console.log('📝 Step 1: Running SQL schema migration...');
        const sqlPath = path.join(__dirname, 'migrate-weekly-chores.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        const statements = sqlContent.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await db.exec(statement);
            }
        }
        console.log('✅ Schema migration completed');

        // Step 2: Convert existing dish duty to weekly chore types
        console.log('📝 Step 2: Converting existing dish duty data...');
        
        // Get all families
        const families = await db.all('SELECT * FROM families');
        
        for (const family of families) {
            console.log(`Processing family: ${family.name}`);
            
            // Create default "Dish Duty" weekly chore type for each family
            const dishDutyResult = await db.run(
                'INSERT OR IGNORE INTO weekly_chore_types (family_id, name, description, icon) VALUES (?, ?, ?, ?)',
                [family.id, 'Dish Duty', 'Responsible for washing dishes and kitchen cleanup for the week', '🍽️']
            );
            
            let weeklyChoreTypeId;
            if (dishDutyResult.lastID) {
                weeklyChoreTypeId = dishDutyResult.lastID;
            } else {
                // Already exists, get the ID
                const existing = await db.get(
                    'SELECT id FROM weekly_chore_types WHERE family_id = ? AND name = ?',
                    [family.id, 'Dish Duty']
                );
                weeklyChoreTypeId = existing?.id;
            }
            
            if (!weeklyChoreTypeId) {
                console.log(`Failed to create/find weekly chore type for family ${family.name}`);
                continue;
            }
            
            // Convert existing dish_duty records to weekly_assignments
            const existingDishDuties = await db.all(
                'SELECT * FROM dish_duty WHERE family_id = ?',
                [family.id]
            );
            
            for (const dishDuty of existingDishDuties) {
                await db.run(
                    'INSERT OR IGNORE INTO weekly_assignments (weekly_chore_type_id, user_id, family_id, week_start, week_end, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [weeklyChoreTypeId, dishDuty.user_id, family.id, dishDuty.week_start, dishDuty.week_end, dishDuty.is_active, dishDuty.created_at]
                );
            }
            
            // Set up default rotation order for dish duty
            const familyKids = await db.all(
                'SELECT * FROM users WHERE family_id = ? AND role = ? ORDER BY created_at',
                [family.id, 'kid']
            );
            
            for (let i = 0; i < familyKids.length; i++) {
                await db.run(
                    'INSERT OR IGNORE INTO weekly_rotation_orders (weekly_chore_type_id, user_id, family_id, rotation_order) VALUES (?, ?, ?, ?)',
                    [weeklyChoreTypeId, familyKids[i].id, family.id, i]
                );
            }
            
            console.log(`✅ Converted ${existingDishDuties.length} dish duty records for family ${family.name}`);
            console.log(`✅ Set up rotation order for ${familyKids.length} kids in family ${family.name}`);
        }

        // Step 3: Verify migration
        console.log('📝 Step 3: Verifying migration...');
        const weeklyChoreTypesCount = await db.get('SELECT COUNT(*) as count FROM weekly_chore_types');
        const weeklyAssignmentsCount = await db.get('SELECT COUNT(*) as count FROM weekly_assignments');
        const rotationOrdersCount = await db.get('SELECT COUNT(*) as count FROM weekly_rotation_orders');
        
        console.log('📊 Migration Statistics:');
        console.log(`   - Weekly chore types created: ${weeklyChoreTypesCount.count}`);
        console.log(`   - Weekly assignments migrated: ${weeklyAssignmentsCount.count}`);
        console.log(`   - Rotation orders created: ${rotationOrdersCount.count}`);
        
        console.log('🎉 Weekly chores migration completed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ Weekly chores migration failed:', error);
        throw error;
    }
}

module.exports = { migrateWeeklyChores };