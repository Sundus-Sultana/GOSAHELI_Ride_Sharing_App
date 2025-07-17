const express = require('express');
const router = express.Router();
const client = require('../db');

// GET vehicle by DriverID
router.get('/:driverId', async (req, res) => {
  const driverId = parseInt(req.params.driverId, 10);

  console.log('📥 Received GET request for driverId:', driverId); // ✅ Add this

  if (isNaN(driverId)) {
    return res.status(400).json({ message: 'Invalid Driver ID' });
  }

  try {
    const result = await client.query(
      'SELECT * FROM "Vehicle" WHERE "DriverID" = $1',
      [driverId]
    );
console.log('🚗 Query executed with driverId =', driverId);

    console.log('🚗 Vehicle query result:', result.rows); // ✅ Add this

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error fetching vehicle:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST vehicle (insert and update Driver table)
router.post('/', async (req, res) => {
  const { VehicleModel, VehicleType, capacity, color, PlateNumber, DriverID } = req.body;

  try {
    const insertResult = await client.query(
      `INSERT INTO "Vehicle" ("VehicleModel", "VehicleType", capacity, color, "PlateNumber", "DriverID")
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING "VehicleID"`,
      [VehicleModel, VehicleType, capacity, color, PlateNumber, DriverID]
    );

    const vehicleId = insertResult.rows[0].VehicleID;

    // Update Driver table
    await client.query(
      `UPDATE "Driver" SET "VehicleID" = $1 WHERE "DriverID" = $2`,
      [vehicleId, DriverID]
    );

    res.status(201).json({ message: 'Vehicle saved and driver updated', VehicleID: vehicleId });
  } catch (err) {
    console.error('Error saving vehicle:', err);
    res.status(500).json({ message: 'Save failed' });
  }
});

// PUT update vehicle by DriverID
router.put('/:driverId', async (req, res) => {
  const { driverId } = req.params;
  const { VehicleModel, VehicleType, capacity, color, PlateNumber } = req.body;

  try {
    const result = await client.query(
      `UPDATE "Vehicle"
       SET "VehicleModel" = $1, "VehicleType" = $2, "capacity" = $3, "color" = $4, "PlateNumber" = $5
       WHERE "DriverID" = $6`,
      [VehicleModel, VehicleType, capacity, color, PlateNumber, driverId]
    );

    res.json({ message: 'Vehicle updated successfully' });
  } catch (err) {
    console.error('Error updating vehicle:', err);
    res.status(500).json({ message: 'Update failed' });
  }
});

module.exports = router;
