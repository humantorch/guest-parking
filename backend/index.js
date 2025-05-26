const express = require('express');
require('dotenv').config();

const app = express();

// ✅ CORS middleware — MOVE THIS FIRST
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim());

  console.log('Request origin:', origin);
  console.log('Allowed origins:', allowedOrigins);

  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204); // 🔥 PREVENT DB from being hit
  }

  next();
});

// ✅ Log requests AFTER CORS
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

// ✅ Parse incoming JSON
app.use(express.json());

// ✅ Healthcheck route
app.get('/healthcheck', (req, res) => {
  console.log("✅ Healthcheck hit");
  return res.status(200).json({ status: "ok" });
});

// ✅ Booking routes
const bookingsRouter = require('./routes/bookings');
app.use('/api/bookings', bookingsRouter);

// ✅ Export app for Lambda
module.exports = app;

// ✅ Local dev server
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
