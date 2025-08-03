const express = require('express');
const router = express.Router();
const client = require('../db');

// routes/DriverCarpool.js

router.post('/offer', async (req, res) => {
  const {
    UserID,
    DriverID,
    pickup_location,
    dropoff_location,
    seats,
    date,
    pickup_time,
    dropoff_time,
    recurring_days
  } = req.body;

  try {
    const result = await client.query(
      `INSERT INTO "Driver_Carpool_Offers" (
        "UserID", "DriverID", pickup_location, dropoff_location, seats, date, pickup_time, dropoff_time, recurring_days
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;`,
      [
        UserID,
        DriverID,
        pickup_location,
        dropoff_location,
        seats,
        date,
        pickup_time,
        dropoff_time,
        recurring_days
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting carpool offer:', err);
    res.status(500).json({ error: 'Failed to create carpool offer' });
  }
});


// Export at the end
module.exports = router;
