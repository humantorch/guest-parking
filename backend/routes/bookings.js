const express = require('express');
const getPool = require('../db');
const pool = getPool();
const router = express.Router();
const { Resend } = require('resend');

async function safeQuery(query, values = [], retries = 2) {
  try {
    return await pool.query(query, values);
  } catch (err) {
    if (err.code === 'XX000' && retries > 0) {
      console.warn('⚠️ Retrying query after error:', err.message);
      await new Promise(resolve => setTimeout(resolve, 500));
      return safeQuery(query, values, retries - 1);
    }
    throw err;
  }
}

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
    console.log('✅ Email sent:', response);
    return res.send('Email sent!');
  } catch (error) {
    console.error('❌ Email error:', error);
    return res.status(500).send('Failed to send email');
  }
});

// Get available spots for a weekend
router.get('/availability', async (req, res) => {
  const { date } = req.query;
  try {
    const result = await safeQuery(
      'SELECT spot_number FROM bookings WHERE date = $1',
      [date]
    );
    const bookedSpots = result.rows.map(r => r.spot_number);
    const allSpots = [1, 2, 3, 4, 5, 6, 7];
    const availableSpots = allSpots.filter(s => !bookedSpots.includes(s));
    return res.json({ availableSpots });
  } catch (err) {
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get all bookings (for admin)
router.get('/', async (req, res) => {
  try {
    const result = await safeQuery(
      `SELECT * FROM bookings ORDER BY date DESC, spot_number ASC`
    );
    return res.json({ bookings: result.rows });
  } catch (err) {
    console.error('Error fetching all bookings:', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// DELETE /api/bookings/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await safeQuery('DELETE FROM bookings WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    return res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('Error deleting booking:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Book a spot
router.post('/', async (req, res) => {
  const {
    date, spot_number, first_name, last_name,
    unit_number, email, guest_name, vehicle_type, license_plate
  } = req.body;

  // ✅ Basic validation
  if (!date || !spot_number || !first_name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const floor = spot_number <= 4 ? " (P1)" : " (P2)";

  try {
    // Insert
    await safeQuery(
      `INSERT INTO bookings (
        date, spot_number, first_name, last_name,
        unit_number, email, guest_name, vehicle_type, license_plate
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        date, spot_number, first_name, last_name,
        unit_number, email, guest_name, vehicle_type, license_plate
      ]
    );

    try {
      const result = await resend.emails.send({
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Guest Parking Booking Confirmation',
        html: `
          <p>Hi ${first_name},</p>
          <p>Your guest parking booking has been confirmed for the weekend starting <strong>${date}</strong>.</p>
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
      console.log('✅ Email success!', JSON.stringify(result));
    } catch (emailErr) {
      console.error('❌ Failed to send email confirmation:', emailErr);
    }

    return res.status(201).json({ message: 'Booking confirmed' });

  } catch (err) {
    console.error('❌ Booking error:', err);

    if (err.code === '23505') {
      return res.status(409).json({ error: 'Spot already booked' });
    }

    return res.status(500).json({ error: 'Database error' });
  }
});

router.get('/ping', async (req, res) => {
  try {
    await safeQuery('SELECT 1');
    return res.json({ message: '✅ DB connection is healthy - 001' });
  } catch (err) {
    console.error('DB Ping Error:', err);
    return res.status(500).json({ error: 'DB connection failed - 001' });
  }
});


module.exports = router;