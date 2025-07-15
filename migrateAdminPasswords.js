// Script to hash all existing admin passwords in the database
const { query } = require('./config/db');
const bcrypt = require('bcrypt');

async function isHashed(password) {
  // bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 chars long
  return typeof password === 'string' && password.startsWith('$2') && password.length === 60;
}

async function migrateAdminPasswords() {
  try {
    const result = await query('SELECT id, password_hash FROM admins');
    for (const admin of result.rows) {
      if (!await isHashed(admin.password_hash)) {
        const hashed = await bcrypt.hash(admin.password_hash, 10);
        await query('UPDATE admins SET password_hash = $1 WHERE id = $2', [hashed, admin.id]);
        console.log(`Updated admin id ${admin.id} password to hashed.`);
      } else {
        console.log(`Admin id ${admin.id} password already hashed.`);
      }
    }
    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateAdminPasswords();
