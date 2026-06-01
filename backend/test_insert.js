const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const password_hash = await bcrypt.hash("password123", 10);
    const newUser = await prisma.profile.create({
      data: {
        full_name: "Test User 2",
        email: "test2@example.com",
        password_hash,
        role: "STAFF",
        assigned_office_ids: [],
        is_verified: false,
      }
    });
    console.log("Success:", newUser);
  } catch (e) {
    console.error("Prisma Error:", e);
  } finally {
    await prisma.profile.delete({ where: { email: "test2@example.com" } }).catch(() => {});
    await prisma.$disconnect();
  }
}
main();
