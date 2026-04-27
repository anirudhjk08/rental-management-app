const fs = require('fs');
const path = require('path');
const pool = require('./index');

const runMigrations = async () => {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files...`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      await pool.query(sql);
      console.log(`✓ Ran migration: ${file}`);
    } catch (err) {
      // Skip if table already exists
      if (err.message.includes('already exists')) {
        console.log(`→ Skipped (already exists): ${file}`);
      } else {
        console.error(`✗ Failed migration: ${file}`);
        console.error(err.message);
        process.exit(1);
      }
    }
  }

  console.log('All migrations completed successfully!');
  process.exit(0);
};

runMigrations();