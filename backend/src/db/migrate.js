const fs = require('fs');
const path = require('path');
const pool = require('./index');

const runMigrations = async () => {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  // Read all .sql files and sort them numerically (001, 002, 003...)
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
      console.error(`✗ Failed migration: ${file}`);
      console.error(err.message);
      process.exit(1);
    }
  }

  console.log('All migrations completed successfully!');
  process.exit(0);
};

runMigrations();