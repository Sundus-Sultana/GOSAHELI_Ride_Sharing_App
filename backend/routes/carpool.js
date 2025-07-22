const express = require('express');
const router = express.Router();
const client = require('../db');


//fetch the saved carpool profiles
router.get('/get-user-carpool-profiles/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const result = await client.query(
      `SELECT * FROM carpool_profile WHERE "UserID" = $1 ORDER BY carpool_profile_id DESC`,
      [userId]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ success: false, message: 'Failed to feetch profiles' });
  }
});


// Save carpool profile
router.post('/save-profile', async (req, res) => {
  console.log('Received request with body:', req.body); 
  try {
    const {
      UserID,
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
      special_requests,
      route_type
    } = req.body;

console.log("Final route_type going to DB:", route_type);

    const query = `
  INSERT INTO carpool_profile (
    "UserID",
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
    special_requests,
    route_type
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  RETURNING carpool_profile_id;
`;

    const values = [
      UserID,
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
      special_requests || null,
      route_type
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