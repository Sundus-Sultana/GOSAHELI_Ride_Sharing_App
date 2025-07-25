const express = require('express');
const router = express.Router();
const client = require('../db');

// Get Passenger by UserID
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId in request params' });
  }

  try {
    const result = await client.query(
      'SELECT * FROM "Passenger" WHERE "UserID" = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Passenger not found for this user' });
    }

    res.status(200).json({ passenger: result.rows[0] });
  } catch (error) {
    console.error('Error fetching passenger:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
