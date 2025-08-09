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
    console.log('🔍 user-by-request route HIT with ID:', req.params.requestId);

  try {
    // First get PassengerID from Carpool_Request_Status
    const passengerIdResult = await client.query(
      `SELECT "PassengerID" FROM "Carpool_Request_Status" 
       WHERE "RequestID" = $1`,
      [requestId]
    );

    if (passengerIdResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or no passenger assigned' });
    }

    const passengerId = passengerIdResult.rows[0].PassengerID;

    // Then get UserID from Passenger table
    const userIdResult = await client.query(
      `SELECT "UserID" FROM "Passenger" 
       WHERE "PassengerID" = $1`,
      [passengerId]
    );

    if (userIdResult.rows.length === 0) {
      return res.status(404).json({ error: 'Passenger not found' });
    }

    const userId = userIdResult.rows[0].UserID;

    // Finally get username from User table
    const userResult = await client.query(
      `SELECT "username","photo_url" FROM "User" 
       WHERE "UserID" = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      userId: userId,
      username: userResult.rows[0].username,
       photo_url: userResult.rows[0].photo_url 
    });

  } catch (error) {
    console.error('Error fetching passenger userId:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// Add this to your backend routes
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
