const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:driverId', async (req, res) => {
  const { driverId } = req.params;
  try {
    const result = await db.query('SELECT * FROM "Vehicle" WHERE "DriverID" = $1', [driverId]);
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'No vehicle found for this driver.' });
    }
  } catch (error) {
    console.error('GET /vehicleDetails error:', error);
    res.status(500).json({ message: 'Database error.' });
  }
});

router.post('/', async (req, res) => {
  const { VehicleModel, VehicleType, color, capacity, PlateNumber, DriverID } = req.body;
  try {
    const existing = await db.query('SELECT * FROM "Vehicle" WHERE "DriverID" = $1', [DriverID]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Vehicle already exists for this driver.' });
    }

    const result = await db.query(
      `INSERT INTO "Vehicle" ("VehicleModel", "VehicleType", color, capacity, "PlateNumber", "DriverID")
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [VehicleModel, VehicleType, color, capacity, PlateNumber, DriverID]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('POST /vehicleDetails error:', error);
    res.status(500).json({ message: 'Insert failed.' });
  }
});

router.put('/:driverId', async (req, res) => {
  const { driverId } = req.params;
  const { VehicleModel, VehicleType, color, capacity, PlateNumber } = req.body;
  try {
    const result = await db.query(
      `UPDATE "Vehicle"
       SET "VehicleModel" = $1, "VehicleType" = $2, color = $3, capacity = $4, "PlateNumber" = $5
       WHERE "DriverID" = $6 RETURNING *`,
      [VehicleModel, VehicleType, color, capacity, PlateNumber, driverId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found for update.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('PUT /vehicleDetails error:', error);
    res.status(500).json({ message: 'Update failed.' });
  }
});

module.exports = router;
