const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const client = require('../db');

const router = express.Router();

const uploadDir = path.join(__dirname, '../Vehicle_Images');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });



router.post('/upload-vehicle-image', upload.single('vehicleImage'), async (req, res) => {
  const { driverId } = req.body;
  const driverIdNum = parseInt(driverId);
  const file = req.file;

  if (!file || isNaN(driverIdNum)) {
    return res.status(400).json({ error: 'Missing valid image or driverId' });
  }

  const imageUrl = `/Vehicle_Images/${file.filename}`;

  try {
    const result = await client.query('SELECT * FROM "Vehicle" WHERE "DriverID" = $1', [driverIdNum]);

    if (result.rows.length > 0) {
      // 🚮 Delete old file from disk
      const oldImagePath = result.rows[0].vehicle_url;
      if (oldImagePath) {
        const fullOldPath = path.join(__dirname, '..', oldImagePath);
        if (fs.existsSync(fullOldPath)) {
          fs.unlinkSync(fullOldPath);
          console.log('🗑️ Deleted old image:', fullOldPath);
        }
      }

      // 📝 Update new image
      await client.query('UPDATE "Vehicle" SET vehicle_url = $1 WHERE "DriverID" = $2', [imageUrl, driverIdNum]);
      console.log('✅ Vehicle image updated');
    } else {
      await client.query(
        'INSERT INTO "Vehicle" ("DriverID", vehicle_url) VALUES ($1, $2)',
        [driverIdNum, imageUrl]
      );
      console.log('✅ New vehicle inserted');
    }

    res.status(200).json({ imageUrl });
  } catch (err) {
    console.error('❌ DB update failed:', err);
    res.status(500).json({ message: 'DB update failed' });
  }
});


// ✅ DELETE route to delete vehicle image
router.delete('/delete-vehicle-image/:driverId', async (req, res) => {
  const driverId = parseInt(req.params.driverId);
  if (isNaN(driverId)) {
    return res.status(400).json({ success: false, message: 'Invalid driverId' });
  }

  try {
    // Get current vehicle image path
    const result = await client.query('SELECT vehicle_url FROM "Vehicle" WHERE "DriverID" = $1', [driverId]);

    if (result.rows.length === 0 || !result.rows[0].vehicle_url) {
      return res.status(404).json({ success: false, message: 'Vehicle image not found' });
    }

    const imagePath = path.join(__dirname, '..', result.rows[0].vehicle_url);

    // Delete the file if exists
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log('🗑️ Deleted file:', imagePath);
    }

    // Remove image URL from DB
    await client.query('UPDATE "Vehicle" SET vehicle_url = NULL WHERE "DriverID" = $1', [driverId]);

    res.status(200).json({ success: true, message: 'Vehicle image deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting vehicle image:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



module.exports = router;