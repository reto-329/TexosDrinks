// db.js (ES Modules)
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const sql = postgres(connectionString, {
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  },
  idle_timeout: 20,
  max_lifetime: 60 * 30
});

// Test connection
async function testConnection() {
  try {
    const result = await sql`SELECT NOW()`;
    console.log('Database connected at:', result[0].now);
  } catch (err) {
    console.error('Connection test failed:', err);
  }
}

testConnection();

export default sql;