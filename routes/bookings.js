const express = require('express');
const pool = require('../db');
const router = express.Router();

// Get available spots for a weekend
router.get('/availability', async (req, res) => {
  const { weekend } = req.query;
  try {
    const result = await pool.query(
      'SELECT spot_number FROM bookings WHERE weekend_start = $1',
      [weekend]
    );
    const bookedSpots = result.rows.map(r => r.spot_number);
    const allSpots = [1, 2, 3, 4, 5, 6, 7];
    const availableSpots = allSpots.filter(s => !bookedSpots.includes(s));
    res.json({ availableSpots });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all bookings
// Get all bookings (for admin)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM bookings ORDER BY weekend_start DESC, spot_number ASC`
    );
    res.json({ bookings: result.rows });
  } catch (err) {
    console.error('Error fetching all bookings:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// Book a spot
router.post('/', async (req, res) => {
  const {
    weekend_start, spot_number, first_name, last_name,
    unit_number, email, guest_name, vehicle_type, license_plate
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO bookings (
        weekend_start, spot_number, first_name, last_name,
        unit_number, email, guest_name, vehicle_type, license_plate
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [weekend_start, spot_number, first_name, last_name, unit_number, email, guest_name, vehicle_type, license_plate]
    );

    res.status(201).json({ message: 'Booking confirmed' });
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Spot already booked' });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

module.exports = router;
