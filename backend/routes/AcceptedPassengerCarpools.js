const express = require('express');
const router = express.Router();
const client = require('../db');

// GET /api/passenger/accepted-requests/:passengerId
/// GET accepted carpool requests for a passenger (with driver & vehicle info)
router.get('/accepted-requests/:passengerId', async (req, res) => {
  const { passengerId } = req.params;

  try {
    const query = `
      SELECT
        crs."RequestID",
        crs.date,
        crs.pickup_location,
        crs.dropoff_location,
        crs.pickup_time,
        crs.dropoff_time,
        crs.seats,
        crs.status,
        crs.route_type,
        crs.recurring_days,
        crs.fare,
        crs.smoking_preference,
        crs.music_preference,
        crs.conversation_preference,
        crs.allows_luggage,

        -- Join with Driver table
        d."DriverID",
        d."UserID" AS driver_user_id,

        -- Join with User table to get driver's name and photo
        u.username AS driver_name,
        u.photo_url AS driver_photo,

        -- Join with Vehicle table
        v."VehicleModel",
        v."PlateNumber",
        v.color

      FROM "Carpool_Request_Status" crs
      INNER JOIN "Driver" d ON crs."DriverID" = d."DriverID"
      INNER JOIN "User" u ON d."UserID" = u."UserID"
      LEFT JOIN "Vehicle" v ON d."DriverID" = v."DriverID"

      WHERE crs."PassengerID" = $1 AND LOWER(crs.status) = 'accepted'
      ORDER BY crs.date ASC;
    `;

    const values = [passengerId];

    const { rows } = await client.query(query, values);

    res.status(200).json({
      success: true,
      data: rows
    });

  } catch (err) {
    console.error("Error fetching accepted rides:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching accepted rides."
    });
  }
});



// GET /api/vehicle-info/:driverId
router.get('/vehicle-info/:driverId', async (req, res) => {
  const { driverId } = req.params;

  try {
    const result = await client.query(
      `SELECT "VehicleModel", "PlateNumber", "color" 
       FROM "Vehicle" 
       WHERE "DriverID" = $1`,
      [driverId]
    );

    if (!result.rows.length) {
      return res.json({ 
        VehicleModel: 'Unknown', 
        PlateNumber: 'Unknown', 
        color: 'Unknown' 
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching vehicle info:', err);
    res.status(500).json({ 
      error: 'Failed to fetch vehicle info',
      VehicleModel: 'Unknown', 
      PlateNumber: 'Unknown', 
      color: 'Unknown' 
    });
  }
});

module.exports = router;