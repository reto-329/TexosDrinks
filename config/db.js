const { Pool } = require('pg');
require('dotenv').config();

// Basic configuration check
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Simplified pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true }, // Required for Render
  max: 10, // Reasonable connection limit
  idleTimeoutMillis: 30000 // Close idle connections after 30s
});

// Basic connection test
async function testConnection() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW()');
    console.log('Database connected at:', res.rows[0].now);
    return true;
  } finally {
    client.release();
  }
}

// Test connection on startup
testConnection().catch(err => {
  console.error('Database connection failed:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool
};
