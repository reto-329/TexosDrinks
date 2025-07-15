require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  const client = await pool.connect();
  try {
    // Read the SQL file
    const sql = fs.readFileSync(
      path.join(__dirname, 'update_orders_table.sql'),
      'utf8'
    );
    
    // Execute the SQL
    await client.query(sql);
    console.log('Orders table migration completed successfully');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();