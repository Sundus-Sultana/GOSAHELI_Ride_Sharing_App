// backend/routes/ProfileUpdation.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.put('/update-profile', async (req, res) => {
  const { userId, username, email, photoUrl } = req.body;

  console.log('🚨 Incoming PUT /update-profile:', {
    userId, username, email, photoUrl
  });

  try {
    const query = `
      UPDATE "User"
      SET username = $1,
          email = $2,
          photo_url = $3
      WHERE "UserID" = $4
      RETURNING *;
    `;

    const values = [username, email, photoUrl, userId];
    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('❌ Error updating user:', err.stack); // <-- full error stack
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
});


module.exports = router;
