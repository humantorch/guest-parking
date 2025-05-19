const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const bookingsRouter = require('./routes/bookings');
app.use('/api/bookings', bookingsRouter);
// app.use('/api/bookings', require('./routes/bookings'));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
