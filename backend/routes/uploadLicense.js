// ✅ FULL FIXED VERSION of uploadLicense.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const client = require('../db');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../License_Images');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `license_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

router.post('/upload-license', upload.single('licenseImage'), async (req, res) => {
  const { driverId, side } = req.body;
  const file = req.file;

  if (!file || !driverId || !side) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const imageUrl = `/License_Images/${file.filename}`;

  try {
    const vehicleCheck = await client.query('SELECT * FROM "Vehicle" WHERE "DriverID" = $1', [driverId]);

    if (vehicleCheck.rows.length > 0) {
      // ✅ Update only the relevant field
      if (side === 'front') {
        await client.query('UPDATE "Vehicle" SET "license_front_url" = $1 WHERE "DriverID" = $2', [imageUrl, driverId]);
      } else {
        await client.query('UPDATE "Vehicle" SET "license_back_url" = $1 WHERE "DriverID" = $2', [imageUrl, driverId]);
      }
    } else {
      // ✅ Insert new row with proper field
      if (side === 'front') {
        await client.query('INSERT INTO "Vehicle" ("DriverID", "license_front_url") VALUES ($1, $2)', [driverId, imageUrl]);
      } else {
        await client.query('INSERT INTO "Vehicle" ("DriverID", "license_back_url") VALUES ($1, $2)', [driverId, imageUrl]);
      }
    }

    res.json({ imageUrl });
  } catch (err) {
    console.error('❌ DB Error uploading license image:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
