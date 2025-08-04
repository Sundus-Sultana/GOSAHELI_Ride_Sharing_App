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


// GET /matched-requests-all/:driverId
router.get('/matched-requests-all/:driverId', async (req, res) => {
  const { driverId } = req.params;

  try {
    const offers = await client.query(
      `SELECT * FROM "Driver_Carpool_Offers" WHERE "DriverID" = $1`,
      [driverId]
    );

    if (!offers.rows.length) return res.json({ matched: [] });

    const conditions = offers.rows.map((o, idx) => `
      (
        LOWER(pickup_location) LIKE LOWER($${idx * 4 + 1})
        AND LOWER(dropoff_location) LIKE LOWER($${idx * 4 + 2})
        AND pickup_time::time BETWEEN $${idx * 4 + 3}::time - INTERVAL '30 minutes'
            AND $${idx * 4 + 3}::time + INTERVAL '30 minutes'
        AND (
          recurring_days IS NULL OR
          string_to_array(recurring_days, ',') && string_to_array($${idx * 4 + 4}, ',')
        )
      )
    `).join(' OR ');

    const queryText = `
      SELECT * FROM "Carpool_Request_Status"
      WHERE status = 'pending'
        AND (${conditions})
    `;

    const params = offers.rows.flatMap(o => [
      `%${o.pickup_location}%`,
      `%${o.dropoff_location}%`,
      o.pickup_time,
      o.recurring_days || ''
    ]);

    const result = await client.query(queryText, params);
    res.json({ matched: result.rows });

  } catch (err) {
    console.error('Matched-requests-all ERROR:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});


// Get all pending requests
router.get('/all-pending-requests', async (_req, res) => {
  const result = await client.query(
    `SELECT * FROM "Carpool_Request_Status" WHERE status = 'pending' ORDER BY "RequestID" DESC`
  );
  res.json({ allPending: result.rows });
});




// Export at the end
module.exports = router;
