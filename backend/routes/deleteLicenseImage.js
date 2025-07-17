// backend/routes/deleteLicenseImage.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const client = require('../db');

const router = express.Router();

router.delete('/delete-license-image', async (req, res) => {
  const { driverId, side } = req.body;

  if (!driverId || !side) {
    return res.status(400).json({ error: 'Missing driverId or side' });
  }

  try {
    const field = side === 'front' ? 'license_front_url' : 'license_back_url';
    const result = await client.query(`SELECT "${field}" FROM "Vehicle" WHERE "DriverID" = $1`, [driverId]);

    const imageUrl = result.rows[0]?.[field];
    if (!imageUrl) return res.status(404).json({ error: 'No image found to delete' });

    const filePath = path.join(__dirname, `../${imageUrl}`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // ✅ Delete file from disk
    }

    await client.query(`UPDATE "Vehicle" SET "${field}" = NULL WHERE "DriverID" = $1`, [driverId]); // ✅ Clear field

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (err) {
    console.error('Error deleting license image:', err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;
