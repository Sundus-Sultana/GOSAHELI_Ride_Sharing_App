// backend/routes/becomeDriver.js
const express = require('express');
const router = express.Router();
const client = require('../db');

router.post('/', async (req, res) => {
  const { userId } = req.body;

  try {
    // Check if user is already a driver
    const check = await client.query('SELECT * FROM "Driver" WHERE "UserID" = $1', [userId]);

    if (check.rows.length > 0) {
      // ✅ Still update the last_role if not set
      await client.query(
        'UPDATE "User" SET "last_role" = $1 WHERE "UserID" = $2',
        ['driver', userId]
      );
      return res.status(200).json({ message: 'User is already a driver', driverId: check.rows[0].DriverID });
    }

    // Insert new driver
    const result = await client.query(
      'INSERT INTO "Driver" ("UserID") VALUES ($1) RETURNING "DriverID"',
      [userId]
    );

    // ✅ Update last_role to 'driver'
   const update = await client.query(
  'UPDATE "User" SET "last_role" = $1 WHERE "UserID" = $2',
  ['driver', userId]
);
console.log('Update result:', update.rowCount);
    res.status(201).json({ message: 'Driver created', driverId: result.rows[0].DriverID });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ message: 'Failed to become a driver' });
  }
});

module.exports = router;
