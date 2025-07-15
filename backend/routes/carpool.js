const express = require('express');
const router = express.Router();
const client = require('../db');

// Save carpool profile
router.post('/save-profile', async (req, res) => {
  console.log('Received request with body:', req.body); 
  try {
    const {
      rider_id,
      pickup_location,
      dropoff_location,
      seats,
      date,
      pickup_time,
      dropoff_time,
      smoking_preference,
      music_preference,
      conversation_preference,
      allows_luggage,
      is_recurring,
      recurring_days,
      special_requests
    } = req.body;


    const query = `
  INSERT INTO carpool_profile (
    rider_id,
    pickup_location,
    dropoff_location,
    seats,
    date,
    pickup_time,
    dropoff_time,
    smoking_preference,
    music_preference,
    conversation_preference,
    allows_luggage,
    is_recurring,
    recurring_days,
    special_requests
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING carpool_profile_id;
`;

    const values = [
      rider_id,
      pickup_location,
      dropoff_location,
      seats,
      date,
      pickup_time,
      dropoff_time,
      smoking_preference,
      music_preference,
      conversation_preference,
      allows_luggage,
      is_recurring,
      recurring_days,
      special_requests || null
    ];

    const result = await client.query(query, values);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Carpool profile saved successfully'
    });
  } catch (error) {
    console.error('Error saving carpool profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save carpool profile',
      error: error.message
    });
  }
});

module.exports = router;