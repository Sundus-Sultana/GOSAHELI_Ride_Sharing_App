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

// Add to notifications.js
router.get('/', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID required' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM "Notification" 
       WHERE "UserID" = $1 
       ORDER BY "createdAt" DESC`,
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// notifications.js - Update the mark-read route
router.post('/mark-read', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      message: 'User ID required' 
    });
  }

  try {
    const result = await pool.query(
      `UPDATE "Notification" 
       SET "isRead" = true 
       WHERE "UserID" = $1 AND "isRead" = false
       RETURNING *`, // Optional: return updated notifications
      [userId]
    );
    
    console.log(`Marked ${result.rowCount} notifications as read for user ${userId}`);
    
    res.json({ 
      success: true,
      count: result.rowCount 
    });
  } catch (err) {
    console.error('Error marking notifications as read:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: err.message 
    });
  }
});

module.exports = router;
