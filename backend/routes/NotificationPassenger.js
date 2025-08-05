const express = require('express');
const router = express.Router();
const db = require('../db'); 
const axios = require('axios');

// ✅ Save push token using userId (for Passenger or Driver)
router.post('/save-push-token', async (req, res) => {
  const { userId, token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ success: false, message: 'Missing userId or token' });
  }

  try {
    // Step 1: Try to find Passenger
    const passengerRes = await db.query(
      'SELECT "PassengerID" FROM "Passenger" WHERE "UserID" = $1',
      [userId]
    );

    if (passengerRes.rows.length > 0) {
      const passengerId = passengerRes.rows[0].PassengerID;

      await db.query(
        'UPDATE "Passenger" SET push_token = $1 WHERE "PassengerID" = $2',
        [token, passengerId]
      );

      return res.json({ success: true, message: 'Push token saved for passenger', passengerId });
    }

    // Step 2: Try to find Driver
    const driverRes = await db.query(
      'SELECT "DriverID" FROM "Driver" WHERE "UserID" = $1',
      [userId]
    );

    if (driverRes.rows.length > 0) {
      const driverId = driverRes.rows[0].DriverID;

      await db.query(
        'UPDATE "Driver" SET push_token = $1 WHERE "DriverID" = $2',
        [token, driverId]
      );

      return res.json({ success: true, message: 'Push token saved for driver', driverId });
    }

    // Step 3: Not found
    return res.status(404).json({ success: false, message: 'User not found as passenger or driver' });

  } catch (error) {
    console.error('❌ Error saving push token:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// ✅ Send notification to Passenger
// In your notification route
router.post('/send-to-passenger', async (req, res) => {
  const { requestId } = req.body;

  try {
    // Get request details including passenger info
    const request = await client.query(
      `SELECT cr.*, p.push_token 
       FROM "Carpool_Request_Status" cr
       JOIN "Passenger" p ON cr."PassengerID" = p."PassengerID"
       WHERE cr."RequestID" = $1`,
      [requestId]
    );

    if (request.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const { push_token } = request.rows[0];
    
    if (!push_token) {
      return res.status(400).json({ error: 'No push token for passenger' });
    }

    // Send more detailed notification
    await axios.post('https://exp.host/--/api/v2/push/send', {
      to: push_token,
      sound: 'default',
      title: 'Request Accepted 🎉',
      body: 'Your carpool request has been accepted!',
      data: { 
        requestId,
        type: 'request_accepted'
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Notification error:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});
module.exports = router;
