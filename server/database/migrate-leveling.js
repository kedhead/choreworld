const db = require('./database');

const runMigration = async () => {
  try {
    console.log('🔄 Starting leveling system migration...');
    
    // Check if leveling columns exist
    const tableInfo = await db.all("PRAGMA table_info(users)");
    const hasLevelColumn = tableInfo.some(col => col.name === 'level');
    const hasXPColumn = tableInfo.some(col => col.name === 'total_experience');
    
    if (hasLevelColumn && hasXPColumn) {
      console.log('✅ Leveling columns already exist');
    } else {
      console.log('📊 Adding leveling columns to users table...');
      
      if (!hasLevelColumn) {
        await db.run('ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1');
        console.log('✅ Added level column');
      }
      
      if (!hasXPColumn) {
        await db.run('ALTER TABLE users ADD COLUMN total_experience INTEGER DEFAULT 0');
        console.log('✅ Added total_experience column');
      }
      
      // Also add experience_points if not exists (though we mainly use total_experience)
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
    } else {
      console.log('✅ bonus_chores table already exists');
    }
    
    // Check if chores table has is_bonus_available column
    const choreTableInfo = await db.all("PRAGMA table_info(chores)");
    const hasBonusColumn = choreTableInfo.some(col => col.name === 'is_bonus_available');
    
    if (!hasBonusColumn) {
      console.log('📊 Adding is_bonus_available column to chores table...');
      await db.run('ALTER TABLE chores ADD COLUMN is_bonus_available BOOLEAN DEFAULT 0');
      
      // Update existing chores to mark some as bonus available
      await db.run(`
        UPDATE chores SET is_bonus_available = 1 
        WHERE name IN (
          'Deep clean room', 'Wash car', 'Weed garden', 'Clean garage',
          'Wash windows', 'Organize basement', 'Rake leaves', 'Clean out car',
          'Scrub bathtub', 'Mop all floors'
        )
      `);
      console.log('✅ Added is_bonus_available column and updated bonus chores');
    } else {
      console.log('✅ is_bonus_available column already exists');
    }
    
    console.log('🎉 Leveling system migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigration().then(() => {
  process.exit(0);
});