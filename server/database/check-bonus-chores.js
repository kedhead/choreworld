const db = require('./database');

const checkAndInsertBonusChores = async () => {
  try {
    console.log('🔍 Checking bonus chores...');
    
    // Check existing bonus chores
    const bonusChores = await db.all('SELECT * FROM chores WHERE is_bonus_available = 1');
    console.log(`Found ${bonusChores.length} bonus chores:`);
    bonusChores.forEach(chore => {
      console.log(`- ${chore.name} (${chore.points} pts)`);
    });
    
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
        // Check if chore already exists
        const existing = await db.get('SELECT * FROM chores WHERE name = ?', [chore.name]);
        
        if (existing) {
          // Update existing chore to be bonus available
          await db.run('UPDATE chores SET is_bonus_available = 1 WHERE name = ?', [chore.name]);
          console.log(`✅ Updated "${chore.name}" to be bonus available`);
        } else {
          // Insert new bonus chore
          await db.run(
            'INSERT INTO chores (name, description, points, is_active, is_bonus_available) VALUES (?, ?, ?, 1, 1)',
            [chore.name, chore.description, chore.points]
          );
          console.log(`✅ Inserted new bonus chore "${chore.name}"`);
        }
      }
    }
    
    // Final check
    const finalBonusChores = await db.all('SELECT * FROM chores WHERE is_bonus_available = 1');
    console.log(`🎉 Total bonus chores available: ${finalBonusChores.length}`);
    
  } catch (error) {
    console.error('❌ Error checking bonus chores:', error);
  }
};

checkAndInsertBonusChores().then(() => {
  process.exit(0);
});