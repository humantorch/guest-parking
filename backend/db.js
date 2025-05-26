require('dotenv').config();
const { Pool } = require('pg');

console.log(`🔍 Connecting to: ${process.env.DATABASE_URL}`);


let _pool;

function getPool() {
  if (!_pool) {
    console.log(`🔍 Connecting to: ${process.env.DATABASE_URL}`);
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    _pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle PostgreSQL client', err);
    });
  }
  return _pool;
}

module.exports = getPool;
