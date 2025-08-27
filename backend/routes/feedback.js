// backend/routes/feedback.js
const express = require('express');
const router = express.Router();
const client = require('../db'); // PostgreSQL client

router.post('/', async (req, res) => {
  const { RateValue, DriverID, PassengerID, message,RequestID  } = req.body;

  // Validation: Required fields
  if (!RateValue || !DriverID || !PassengerID|| !RequestID) {
    return res.status(400).json({
      success: false,
      message: 'RateValue, DriverID, and PassengerID are required'
    });
  }

  try {
    const query = `
      INSERT INTO "Feedback" ("RateValue", "DriverID", "PassengerID", "Message","RequestID", "CreatedAt")
      VALUES ($1, $2, $3, $4,$5, NOW())
      RETURNING *;
    `;

    const values = [
      RateValue,
      DriverID,
      PassengerID,
      message || null ,// store null if no message
      RequestID
    ];

    const result = await client.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: result.rows[0]
    });

  } catch (err) {
    console.error('Error inserting feedback:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
});

// GET: Feedback by RequestID
router.get("/:requestId", async (req, res) => {
  const { requestId } = req.params;

  try {
    const result = await client.query(
      'SELECT "RateValue", "Message" FROM "Feedback" WHERE "RequestID" = $1',
      [requestId]
    );

    if (result.rows.length > 0) {
      res.json({
        success: true,
        data: result.rows[0],
      });
    } else {
      res.json({
        success: false,
        data: null,
        message: "No feedback found",
      });
    }
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


module.exports = router;
