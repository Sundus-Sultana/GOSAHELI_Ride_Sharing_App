// backend/routes/feedback.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/feedback
router.post('/', async (req, res) => {
  const { RateValue, UserID } = req.body;

  if (!RateValue || !UserID) {
    return res.status(400).json({ error: 'Missing RateValue or UserID' });
  }

  try {
    // 🔍 Step 1: Get PassengerID using UserID
    const result = await db.query(
      `SELECT "PassengerID" FROM "Passenger" WHERE "UserID" = $1`,
      [UserID]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Passenger not found for this user' });
    }

    const passengerId = result.rows[0].PassengerID;

    // ✅ Step 2: Insert Feedback
    const insertResult = await db.query(
      `INSERT INTO "Feedback" ("RateValue", "PassengerID")
       VALUES ($1, $2)
       RETURNING *`,
      [RateValue, passengerId]
    );

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: insertResult.rows[0],
    });
  } catch (err) {
    console.error('❌ Feedback insert error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
