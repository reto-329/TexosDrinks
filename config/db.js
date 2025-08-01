const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Accept self-signed certs (safe for Render)
  },
  max: 10,
  idleTimeoutMillis: 30000
});

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

testConnection().catch(err => {
  console.error('Database connection failed:', err);
  process.exit(1);
});

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
