const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Pool maintains multiple DB connections ready to use
// Much more efficient than creating a new connection per request
// Same concept as a thread pool you learned in OS
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test the connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Database connected successfully');
    release();
  }
});

// We export pool so any file can import it and run queries
module.exports = pool;