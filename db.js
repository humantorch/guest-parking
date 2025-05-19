const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the connection and log the result
pool.connect()
  .then(client => {
    console.log('✅ Successfully connected to PostgreSQL');
    client.release(); // release the client back to the pool
  })
  .catch(err => {
    console.error('❌ Error connecting to PostgreSQL:', err.message || err);
  });

module.exports = pool;