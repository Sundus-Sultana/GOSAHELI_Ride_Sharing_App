// backend/routes/becomePassenger.js
const express = require('express');
const router = express.Router();
const client = require('../db');

router.post('/', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId in request body' });
  }

  try {
    // Check if already passenger
    const checkResult = await client.query(
      'SELECT * FROM "Passenger" WHERE "UserID" = $1',
      [userId]
    );

    if (checkResult.rows.length > 0) {
      // ✅ Still update the last_role if needed
      await client.query(
        'UPDATE "User" SET "last_role" = $1 WHERE "UserID" = $2',
        ['passenger', userId]
      );
      return res.status(200).json({ message: 'Passenger already exists', exists: true });
    }

    // Insert passenger
    const insertResult = await client.query(
      'INSERT INTO "Passenger" ("UserID") VALUES ($1) RETURNING *',
      [userId]
    );

    // ✅ Update last_role to 'passenger'
    await client.query(
      'UPDATE "User" SET "last_role" = $1 WHERE "UserID" = $2',
      ['passenger', userId]
    );

    res.status(201).json({ message: 'Passenger inserted', passenger: insertResult.rows[0] });

  } catch (error) {
    console.error('Error inserting passenger:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



    // ✅ for chat

router.get('/user-by-request/:requestId', async (req, res) => {
  const { requestId } = req.params;
  console.log('🔍 Fetching data for request ID:', requestId);

  try {
    // 1. Get basic request info with DriverID and PassengerID
    const requestQuery = await client.query(
      `SELECT crs."PassengerID", crs."DriverID", d."UserID" as "DriverUserID"
       FROM "Carpool_Request_Status" crs
       LEFT JOIN "Driver" d ON crs."DriverID" = d."DriverID"
       WHERE crs."RequestID" = $1`,
      [requestId]
    );

    if (requestQuery.rows.length === 0) {
      console.log('❌ Request not found');
      return res.status(404).json({ 
        success: false,
        error: 'Request not found' 
      });
    }

    const { PassengerID, DriverID, DriverUserID } = requestQuery.rows[0];
    console.log('📌 Found PassengerID:', PassengerID, 'DriverID:', DriverID, 'DriverUserID:', DriverUserID);

    // 2. Prepare response
    const response = {
      success: true,
      username: null,
      driverusername: null,
      photo_url: null,
      driverphoto_url: null,
      userId: null,
      driverUserId: null
    };

    // 3. Fetch passenger data
    if (PassengerID) {
      const passengerQuery = await client.query(
        `SELECT u."UserID", u."username", u."photo_url" 
         FROM "Passenger" p
         JOIN "User" u ON p."UserID" = u."UserID"
         WHERE p."PassengerID" = $1`,
        [PassengerID]
      );

      if (passengerQuery.rows.length > 0) {
        response.userId = passengerQuery.rows[0].UserID;
        response.username = passengerQuery.rows[0].username;
        response.photo_url = passengerQuery.rows[0].photo_url;
      }
    }

    // 4. Fetch driver data - CRITICAL FIX
    if (DriverUserID) {  // Now using DriverUserID which we got from the first query
      const driverQuery = await client.query(
        `SELECT "username", "photo_url" 
         FROM "User"
         WHERE "UserID" = $1`,
        [DriverUserID]
      );

      if (driverQuery.rows.length > 0) {
        response.driverusername = driverQuery.rows[0].username;
        response.driverphoto_url = driverQuery.rows[0].photo_url;
        response.driverUserId = DriverUserID;
      }
    }

    console.log('Final API Response:', response);
    res.json(response);

  } catch (error) {
    console.error('🔥 Database error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});
    // ✅ Get user by userId
router.get('/user-by-id/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await client.query(
      'SELECT "UserID", "username","photo_url" FROM "User" WHERE "UserID" = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
