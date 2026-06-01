require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
  return client.query('UPDATE "Profile" SET is_verified = true');
}).then((res) => {
  console.log('Updated', res.rowCount, 'users');
  client.end();
}).catch(console.error);
