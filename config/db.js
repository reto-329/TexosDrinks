const { Pool } = require('pg');
require('dotenv').config();

// Validate environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  },
  connectionTimeoutMillis: 5000, // 5 second connection timeout
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  max: 20 // Maximum number of clients in the pool
});

// Connection test with retries
async function testConnection() {
  let attempts = 3;
  while (attempts > 0) {
    try {
      const client = await pool.connect();
      const res = await client.query('SELECT NOW()');
      client.release();
      console.log('Database connected at:', res.rows[0].now);
      return true;
    } catch (err) {
      attempts--;
      console.error(`Connection failed (${attempts} attempts left):`, err.message);
      if (attempts === 0) throw err;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Test connection on startup
testConnection()
  .catch(err => {
    console.error('Fatal database connection error:', err);
    process.exit(1); // Exit if we can't connect to database
  });

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
