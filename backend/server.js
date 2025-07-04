const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// PostgreSQL connection
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'postgres',
  port: 5432,
});

client.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Connection error', err.stack));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files statically

// Multer setup for image uploading
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

// Register Passenger
app.post('/rider', async (req, res) => {
  const { email, username, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const result = await client.query(
      'INSERT INTO rider (email, username, password) VALUES ($1, $2, $3) RETURNING *',
      [email, username, hashedPassword]
    );
    res.status(201).json({
      message: 'Account created successfully!',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Error saving user to DB:', error);
    if (error.code === '23505') {
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Error saving user to database' });
    }
  }
});

// Passenger Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResult = await client.query(
      'SELECT * FROM rider WHERE email = $1',
      [email]
    );
    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    res.json({ success: true, name: user.username });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Fetch passenger
app.get('/rider', async (req, res) => {
  const { email } = req.query;
  try {
    const result = await client.query('SELECT * FROM rider WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json([]);
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rider:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Password
app.put('/update-password', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await client.query(
      'UPDATE rider SET password = $1 WHERE email = $2 RETURNING *',
      [password, email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error updating password' });
  }
});

// Get User Photo
app.get('/get-user-photo', async (req, res) => {
  const { email } = req.query;
  try {
    const result = await client.query('SELECT photo_url FROM rider WHERE email = $1', [email]);
    if (result.rows.length === 0 || !result.rows[0].photo_url) {
      return res.status(404).json({ photo_url: null });
    }
    res.json({ photo_url: result.rows[0].photo_url });
  } catch (error) {
    console.error('Error fetching user photo:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload profile photo
app.post('/upload-profile-photo', upload.single('photo'), async (req, res) => {
  const { email } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const photoUrl = `/uploads/${file.filename}`;

    const result = await client.query(
      'UPDATE rider SET photo_url = $1 WHERE email = $2 RETURNING *',
      [photoUrl, email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile photo updated successfully!',
      photo_url: photoUrl
    });

  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});






//API endpoint to fetch ride history
app.get('/api/rideHistory', async (req, res) => {
  console.log('Received request with query:', req.query);
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ error: "Email parameter required" });
  }

  try {
    const result = await client.query(
      'SELECT * FROM ride_history WHERE rider_email = $1 ORDER BY ride_date DESC',
      [email]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});