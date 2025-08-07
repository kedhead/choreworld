const db = require('./database');

const initProductionDatabase = async () => {
  try {
    console.log('🚀 Initializing production database...');
    
    // First, run the leveling migration
    console.log('📊 Running leveling system migration...');
    
    // Check if leveling columns exist
    const tableInfo = await db.all("PRAGMA table_info(users)");
    const hasLevelColumn = tableInfo.some(col => col.name === 'level');
    const hasXPColumn = tableInfo.some(col => col.name === 'total_experience');
    
    if (!hasLevelColumn || !hasXPColumn) {
      if (!hasLevelColumn) {
        await db.run('ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1');
        console.log('✅ Added level column');
      }
      
      if (!hasXPColumn) {
        await db.run('ALTER TABLE users ADD COLUMN total_experience INTEGER DEFAULT 0');
        console.log('✅ Added total_experience column');
      }
      
      const hasCurrentXPColumn = tableInfo.some(col => col.name === 'experience_points');
      if (!hasCurrentXPColumn) {
        await db.run('ALTER TABLE users ADD COLUMN experience_points INTEGER DEFAULT 0');
        console.log('✅ Added experience_points column');
      }
    }
    
    // Check if bonus_chores table exists
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    const hasBonusChoresTable = tables.some(table => table.name === 'bonus_chores');
    
    if (!hasBonusChoresTable) {
      console.log('📊 Creating bonus_chores table...');
      await db.run(`
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
        )
      `);
      console.log('✅ Created bonus_chores table');
    }
    
    // Check if chores table has is_bonus_available column
    const choreTableInfo = await db.all("PRAGMA table_info(chores)");
    const hasBonusColumn = choreTableInfo.some(col => col.name === 'is_bonus_available');
    
    if (!hasBonusColumn) {
      console.log('📊 Adding is_bonus_available column to chores table...');
      await db.run('ALTER TABLE chores ADD COLUMN is_bonus_available BOOLEAN DEFAULT 0');
      console.log('✅ Added is_bonus_available column');
    }
    
    // Now insert bonus chores
    console.log('🎁 Setting up bonus chores...');
    const bonusChores = await db.all('SELECT * FROM chores WHERE is_bonus_available = 1');
    
    if (bonusChores.length === 0) {
      console.log('🔧 No bonus chores found, inserting them...');
      
      const bonusChoreList = [
        { name: 'Deep clean room', description: 'Organize closet, dust surfaces, vacuum thoroughly', points: 5 },
        { name: 'Wash car', description: 'Wash and dry the family car', points: 8 },
        { name: 'Weed garden', description: 'Pull weeds from flower beds and garden', points: 6 },
        { name: 'Clean garage', description: 'Sweep and organize garage space', points: 7 },
        { name: 'Wash windows', description: 'Clean all windows inside and outside', points: 6 },
        { name: 'Organize basement', description: 'Tidy and organize basement storage', points: 8 },
        { name: 'Rake leaves', description: 'Rake and bag yard leaves', points: 5 },
        { name: 'Clean out car', description: 'Vacuum and wipe down car interior', points: 4 },
        { name: 'Scrub bathtub', description: 'Deep clean and scrub bathroom tub/shower', points: 5 },
        { name: 'Mop all floors', description: 'Mop kitchen, bathroom, and hallway floors', points: 6 }
      ];
      
      for (const chore of bonusChoreList) {
        const existing = await db.get('SELECT * FROM chores WHERE name = ?', [chore.name]);
        
        if (existing) {
          await db.run('UPDATE chores SET is_bonus_available = 1 WHERE name = ?', [chore.name]);
          console.log(`✅ Updated "${chore.name}" to be bonus available`);
        } else {
          await db.run(
            'INSERT INTO chores (name, description, points, is_active, is_bonus_available) VALUES (?, ?, ?, 1, 1)',
            [chore.name, chore.description, chore.points]
          );
          console.log(`✅ Inserted new bonus chore "${chore.name}"`);
        }
      }
    } else {
      console.log(`✅ Found ${bonusChores.length} existing bonus chores`);
    }
    
    // Final verification
    const finalBonusChores = await db.all('SELECT * FROM chores WHERE is_bonus_available = 1');
    console.log(`🎉 Production database initialized! ${finalBonusChores.length} bonus chores available`);
    
  } catch (error) {
    console.error('❌ Production database initialization failed:', error);
    throw error;
  }
};

// Only run if this script is called directly
if (require.main === module) {
  initProductionDatabase().then(() => {
    console.log('🚀 Production database initialization completed!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Production database initialization failed:', error);
    process.exit(1);
  });
}

module.exports = { initProductionDatabase };