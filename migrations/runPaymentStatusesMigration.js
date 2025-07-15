// Run the payment statuses migration
const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');

async function runMigration() {
  try {
    console.log('Running payment statuses migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add_payment_statuses.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await query(sql);
    
    console.log('Payment statuses migration completed successfully');
  } catch (error) {
    console.error('Error running payment statuses migration:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });