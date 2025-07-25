const express = require('express');
const router = express.Router();
const client = require('../db');



// Get a specific carpool profile by ID to use that profile
router.get('/get-carpool-profile/:profileId', async (req, res) => {
   const { profileId } = req.params;
  console.log("Fetching profile for ID:", profileId);

  try {
    const result = await client.query(
      'SELECT * FROM carpool_profile WHERE carpool_profile_id = $1',
      [profileId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching carpool profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch carpool profile' });
  }
});


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



// ✅ Delete carpool profile
router.delete('/delete-carpool-profile/:profileId', async (req, res) => {
  const { profileId } = req.params;

  try {
    const result = await client.query(
      'DELETE FROM carpool_profile WHERE carpool_profile_id = $1',
      [profileId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.status(200).json({ success: true, message: 'Carpool profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete carpool profile',
      error: error.message
    });
  }
});



// ✅ save carpool request
router.post('/create-status-request', async (req, res) => {
  const {
    PassengerID,
    DriverID = null,
    status = 'pending',
    accepted_time = null,
    completed_time = null,
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

  try {
    const result = await client.query(
      `
      INSERT INTO "Carpool_Request_Status" (
        "PassengerID",
        "DriverID",
        status,
        accepted_time,
        completed_time,
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
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19
      )
      RETURNING *;
      `,
      [
        PassengerID,
        DriverID,
        status,
        accepted_time,
        completed_time,
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
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Carpool request (unsaved profile) created successfully'
    });
  } catch (error) {
    console.error('Error creating carpool request status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create request status',
      error: error.message
    });
  }
});


module.exports = router;