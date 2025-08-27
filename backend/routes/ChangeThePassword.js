const express = require('express');
const router = express.Router();
const pool = require('../db'); // PostgreSQL connection pool
const bcrypt = require('bcryptjs');

// Route: POST /change-password
router.post('/change-password', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  try {
    // 1. Fetch the user from the database
    const userResult = await pool.query('SELECT * FROM "User" WHERE "UserID" = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 2. Check if current password matches
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // 3. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // 4. Update password in DB
    await pool.query(
      'UPDATE "User" SET password = $1 WHERE "UserID" = $2',
      [hashedNewPassword, userId]
    );

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post("/update-password", async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash new password with salt
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query(
      `UPDATE "User" SET "password" = $1 WHERE "email" = $2`,
      [hashedPassword, email]
    );

    res.json({ message: "Password updated in PostgreSQL" });
  } catch (err) {
    console.error("Update password error:", err);
    res.status(500).json({ error: "Failed to update password" });
  }
});



module.exports = router;
