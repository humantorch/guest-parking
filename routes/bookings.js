const express = require('express');
const pool = require('../db');
const router = express.Router();
const { Resend } = require('resend');


// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// temp email test
router.get('/test-email', async (req, res) => {
  try {
    const response = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: 'kosman.scott@gmail.com',
      subject: 'Test email',
      html: '<p>This is a test from your local environment</p>',
    });
    console.log('Email sent:', response);
    res.send('Email sent!');
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).send('Failed to send email');
  }
});

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

// DELETE /api/bookings/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('Error deleting booking:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Book a spot
router.post('/', async (req, res) => {
  const {
    weekend_start, spot_number, first_name, last_name,
    unit_number, email, guest_name, vehicle_type, license_plate
  } = req.body;

  const floor = spot_number <= 4 ? " (P1)" : " (P2)";

  try {
    await pool.query(
      `INSERT INTO bookings (
        weekend_start, spot_number, first_name, last_name,
        unit_number, email, guest_name, vehicle_type, license_plate
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [weekend_start, spot_number, first_name, last_name, unit_number, email, guest_name, vehicle_type, license_plate]
    );

    // Send confirmation email
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Guest Parking Booking Confirmation',
      html: `
        <p>Hi ${first_name},</p>
        <p>Your guest parking booking has been confirmed for the weekend starting <strong>${weekend_start}</strong>.</p>
        <ul>
          <li><strong>Spot:</strong> ${spot_number} ${floor}</li>
          <li><strong>Guest:</strong> ${guest_name}</li>
          <li><strong>Vehicle:</strong> ${vehicle_type}</li>
          <li><strong>License Plate:</strong> ${license_plate}</li>
        </ul>
        <p>Please call the superintendent if you need to cancel a booking.</p>
        <p>Thanks,<br><em>The Admiralty Place Parking Team</em></p>
      `
    });

    res.status(201).json({ message: 'Booking confirmed' });
  } catch (err) {
    console.error('Booking error:', err);
    if (err.code === '23505') {
      res.status(409).json({ error: 'Spot already booked' });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

module.exports = router;