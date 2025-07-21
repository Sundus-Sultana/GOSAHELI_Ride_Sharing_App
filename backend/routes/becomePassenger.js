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

module.exports = router;
