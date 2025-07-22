const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/save-notification', async (req, res) => {
  const { userId, type, message } = req.body;

  if (!userId || !type || !message) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO "Notification" ("UserID", type, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, type, message]
    );

    res.json({ success: true, data: result.rows[0] });

  } catch (err) {
    console.error('Error saving notification:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
