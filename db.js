require('dotenv').config();
const { Pool } = require('pg');

console.log(`🔍 Connecting to: ${process.env.DATABASE_URL}`);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // RDS doesn't require full cert validation by default
  },
});

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch(err => console.error("❌ Error connecting to PostgreSQL:", err));

module.exports = pool;
