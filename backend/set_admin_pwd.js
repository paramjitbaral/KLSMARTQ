const bcrypt = require('bcryptjs');
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    await client.connect();
    
    // Hash a default password
    const hash = await bcrypt.hash('Admin@123', 10);
    
    // Update the admin user with the password hash
    const res = await client.query('UPDATE "Profile" SET password_hash = $1 WHERE email = $2', [hash, 'paramjitbaral@gmail.com']);
    
    console.log('Successfully set password for paramjitbaral@gmail.com');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
main();
