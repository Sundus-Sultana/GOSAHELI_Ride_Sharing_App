const express = require('express');
const router = express.Router();
const client = require('../db');

// Create a new carpool offer
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

// Get all matched requests for a driver
router.get('/matched-requests-all/:driverId', async (req, res) => {
  const { driverId } = req.params;

  try {
    const offers = await client.query(
      `SELECT * FROM "Driver_Carpool_Offers" WHERE "DriverID" = $1`,
      [driverId]
    );

    if (!offers.rows.length) {
      return res.json({ matched: [] });
    }

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
      SELECT *
      FROM "Carpool_Request_Status"
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
  try {
    const result = await client.query(`
      SELECT *
      FROM "Carpool_Request_Status"
      WHERE status = 'pending'
      ORDER BY "RequestID" DESC
    `);

    res.json({ allPending: result.rows });
  } catch (err) {
    console.error('All-pending-requests ERROR:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch pending requests' });
  }
});

// Accept a carpool request
router.post('/accept-request', async (req, res) => {
  const { requestId, driverId } = req.body;
  
  try {
    const result = await client.query(
      `UPDATE "Carpool_Request_Status" 
       SET status = 'accepted',
           "DriverID" = $1,
           accepted_time = NOW()
       WHERE "RequestID" = $2
       RETURNING *`,
      [driverId, requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ success: true, request: result.rows[0] });
  } catch (err) {
    console.error('Error accepting request:', err);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// Reject a carpool request
router.post('/reject-request', async (req, res) => {
  const { requestId, driverId } = req.body;
  
  try {
    const result = await client.query(
      `UPDATE "Carpool_Request_Status" 
       SET status = 'rejected',
           "DriverID" = $1,
           rejected_time = NOW()
       WHERE "RequestID" = $2
       RETURNING *`,
      [driverId, requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ success: true, request: result.rows[0] });
  } catch (err) {
    console.error('Error rejecting request:', err);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// End a carpool (mark as completed)
router.post('/end-carpool', async (req, res) => {
  const { requestId, driverId } = req.body;
  
  try {
    const result = await client.query(
      `UPDATE "Carpool_Request_Status" 
       SET status = 'completed',
           completed_time = NOW()
       WHERE "RequestID" = $1 AND "DriverID" = $2
       RETURNING *`,
      [requestId, driverId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or not authorized' });
    }

    res.json({ success: true, request: result.rows[0] });
  } catch (err) {
    console.error('Error ending carpool:', err);
    res.status(500).json({ error: 'Failed to end carpool' });
  }
});

// Get all accepted requests for a driver
router.get('/accepted-requests/:driverId', async (req, res) => {
  const { driverId } = req.params;

  try {
    const result = await client.query(
      `SELECT * FROM "Carpool_Request_Status"
       WHERE  "status" = 'accepted' AND "DriverID" = $1
       ORDER BY "accepted_time" DESC`,
      [driverId]
    );

    res.json({ accepted: result.rows });
  } catch (err) {
    console.error('Error fetching accepted requests:', err);
    res.status(500).json({ error: 'Failed to fetch accepted requests' });
  }
});

// Get all upcoming (joined) requests for a driver
router.get('/upcoming-requests/:driverId', async (req, res) => {
  const { driverId } = req.params;
  
  try {
    console.log(`Fetching upcoming rides for driver ${driverId}`); // Add this
    
   const result = await client.query(
  `SELECT * FROM "Carpool_Request_Status"
   WHERE TRIM("status") = 'joined'
   AND "DriverID" = $1
   AND date >= (CURRENT_DATE AT TIME ZONE 'UTC')::date
   ORDER BY date ASC`,
  [driverId]
);
    
    console.log(`Found ${result.rows.length} upcoming rides`); // Add this
    console.log('Sample record:', result.rows[0]); // Add this

    res.json({ upcoming: result.rows });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      error: 'Failed to fetch upcoming requests',
      details: err.message 
    });
  }
});

// Get all rejected requests for a driver
router.get('/rejected-requests/:driverId', async (req, res) => {
  const { driverId } = req.params;

  try {
    const result = await client.query(
      `SELECT * FROM "Carpool_Request_Status"
       WHERE "status" = 'rejected' AND "DriverID" = $1
       ORDER BY "rejected_time" DESC`,
      [driverId]
    );

    res.json({ rejected: result.rows });
  } catch (err) {
    console.error('Error fetching rejected requests:', err);
    res.status(500).json({ error: 'Failed to fetch rejected requests' });
  }
});

// Get all completed requests for a driver
router.get('/completed-requests/:driverId', async (req, res) => {
  const { driverId } = req.params;

  try {
    const result = await client.query(
      `SELECT * FROM "Carpool_Request_Status"
       WHERE "status" = 'completed' AND "DriverID" = $1
       ORDER BY "completed_time" DESC`,
      [driverId]
    );

    res.json({ completed: result.rows });
  } catch (err) {
    console.error('Error fetching completed requests:', err);
    res.status(500).json({ error: 'Failed to fetch completed requests' });
  }
});

module.exports = router;