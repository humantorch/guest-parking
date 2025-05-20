const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim());


app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

const bookingsRouter = require('./routes/bookings');
app.use('/api/bookings', bookingsRouter);
// app.use('/api/bookings', require('./routes/bookings'));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
