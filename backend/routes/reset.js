// backend/routes/reset.js
const express = require('express');
const router = express.Router();
const client = require('../db'); // PostgreSQL client

// Check if user email exists
router.get("/check-email", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await client.query(
      `SELECT "UserID" FROM "User" WHERE "email" = $1 LIMIT 1`,
      [email]
    );

    if (result.rows.length > 0) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;
