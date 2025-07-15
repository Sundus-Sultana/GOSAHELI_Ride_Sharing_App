// backend/routes/uploadLicense.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

router.post('/upload-license', upload.single('licenseImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const imageUrl = `/License_Images/${req.file.filename}`;
  res.json({ imageUrl }); // ✅ MUST return valid JSON
});

module.exports = router;
