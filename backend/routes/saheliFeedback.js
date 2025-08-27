const express = require('express');
const router = express.Router();
const db = require('../db'); // PostgreSQL pool or client

// POST feedback
router.post('/saheli-feedback', async (req, res) => {
  try {
    const { UserID, RateValue } = req.body;

    if (!UserID || !RateValue) {
      return res.status(400).json({ error: 'UserID and RateValue are required' });
    }

    const result = await db.query(
      `INSERT INTO "SaheliFeedback" ("UserID", "RateValue") 
       VALUES ($1, $2) RETURNING *`,
      [UserID, RateValue]
    );

    res.json({ success: true, feedback: result.rows[0] });
  } catch (err) {
    console.error('❌ Error inserting feedback:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 📊 GET: Fetch all feedback
router.get('/saheli-feedback', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT f."FeedbackID", f."UserID", u."Name", f."RateValue", f."CreatedAt"
       FROM "SaheliFeedback" f
       JOIN "User" u ON f."UserID" = u."UserID"
       ORDER BY f."CreatedAt" DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

module.exports = router;
