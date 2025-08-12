// backend/routes/complaints.js
const express = require('express');
const router = express.Router();
const client = require('../db');

// Submit a general complaint
router.post('/', async (req, res) => {
  const { driverId, passengerId, description } = req.body;

  // Validation: Only one ID allowed for general complaints
  if ((driverId && passengerId) || (!driverId && !passengerId)) {
    return res.status(400).json({
      error: 'Provide only one ID (Driver or Passenger) for general complaints.'
    });
  }

  // Description required
  if (!description || description.trim() === '') {
    return res.status(400).json({ error: 'Description is required.' });
  }

  try {
    const result = await client.query(
      `INSERT INTO "Complaint" 
      ("DriverID", "PassengerID", "description", "status")
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [driverId || null, passengerId || null, description, 'pending']
    );

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint: result.rows[0]
    });
  } catch (err) {
    console.error('Error submitting complaint:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
