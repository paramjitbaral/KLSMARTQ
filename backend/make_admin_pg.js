const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    await client.connect();
    
    // Check if exists
    const res = await client.query('SELECT * FROM "Profile" WHERE email = $1', ['paramjitbaral@gmail.com']);
    
    if (res.rowCount > 0) {
      await client.query('UPDATE "Profile" SET role = $1 WHERE email = $2', ['ADMIN', 'paramjitbaral@gmail.com']);
      console.log('Successfully updated existing user to ADMIN.');
    } else {
      // We need to generate a UUID for the ID manually if using raw SQL, or use pgcrypto. 
      // But we can just use gen_random_uuid()
      await client.query(`
        INSERT INTO "Profile" (id, full_name, email, role) 
        VALUES (gen_random_uuid(), 'Paramjit Baral', 'paramjitbaral@gmail.com', 'ADMIN')
      `);
      console.log('Successfully created new ADMIN user!');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
main();
