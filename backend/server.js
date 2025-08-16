const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const client = require('./db');


const carpoolRoutes = require('./routes/carpool');
const uploadVehicleImage = require('./routes/uploadVehicleImage');
const uploadLicense = require('./routes/uploadLicense');

// ========== MIDDLEWARE ==========
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== Multer Config ==========
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });



// ========== ✅Routes ==========

//  Notify Passenger
const notificationPassengerRoutes = require('./routes/NotificationPassenger');
app.use('/api/notification', notificationPassengerRoutes);


//  ProfileUpdation
const profileUpdationRoutes = require('./routes/ProfileUpdation');
app.use(profileUpdationRoutes);

// password update
const changePasswordRoute = require('./routes/ChangeThePassword');
app.use('/api', changePasswordRoute);

//  feedback
const feedbackRoute = require('./routes/feedback'); // Adjust path if needed
app.use('/api/feedback', feedbackRoute);

//  notification
const notificationRoutes = require('./routes/notifications'); // adjust path if needed
app.use('/api', notificationRoutes);
const notificationsRouter = require('./routes/notifications');
app.use('/api/notifications', notificationsRouter);

//  complaints
app.use('/api/complaints', require('./routes/complaints'));

//  Favourites
app.use("/api/favourites", require("./routes/favourites"));
const favouriteDetailsRouter = require('./routes/favouriteDetails');

app.use('/favourites', favouriteDetailsRouter); 




//  Become Passenger
const becomePassengerRoute = require('./routes/becomePassenger');
app.use('/api/become-passenger', becomePassengerRoute);


const getPassengerByUserId = require('./routes/getPassengerByUserId');
app.use('/api/get-passenger', getPassengerByUserId);


//  Become Driver
const becomeDriverRoute = require('./routes/becomeDriver');
app.use('/become-driver', becomeDriverRoute);

const driverCarpoolRoutes = require('./routes/DriverCarpool');
app.use('/api/driver/carpool', driverCarpoolRoutes);

//  Pssenger's Accepted Carpools
const acceptedPassengerRoutes = require('./routes/AcceptedPassengerCarpools');
app.use('/api', acceptedPassengerRoutes);

const acceptedPassengerCarpools = require('./routes/AcceptedPassengerCarpools');
app.use('/api/carpool', acceptedPassengerCarpools);

//  Vehicle img url to uploads
app.use('/api/carpool', carpoolRoutes);
app.use('/Vehicle_Images', express.static(path.join(__dirname, 'Vehicle_Images')));
app.use('/', uploadVehicleImage);
app.use('/', require('./routes/uploadVehicleImage'));
const uploadVehicleRoutes = require('./routes/uploadVehicleImage');
app.use(uploadVehicleRoutes);



//  License imges url to uploads
app.use('/License_Images', express.static(path.join(__dirname, 'License_Images')));
app.use(uploadLicense);

const deleteLicenseImage = require('./routes/deleteLicenseImage');
app.use('/', deleteLicenseImage);


// vehicle details in table
const vehicleDetailsRoutes = require('./routes/vehicleDetails');
app.use('/vehicleDetails', vehicleDetailsRoutes);







//  Check if user exists
app.post('/user/check-exists', async (req, res) => {
  const { email, phoneNo } = req.body;
  try {
    const emailResult = await client.query('SELECT 1 FROM "User" WHERE email = $1 LIMIT 1', [email]);
    const phoneResult = await client.query('SELECT 1 FROM "User" WHERE phoneno = $1 LIMIT 1', [phoneNo]);

    res.json({
      emailExists: emailResult.rows.length > 0,
      phoneExists: phoneResult.rows.length > 0
    });
  } catch (err) {
    console.error('Error checking user existence:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Register User
app.post('/user', async (req, res) => {
  const { email, username, password, phoneNo } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await client.query(
      'INSERT INTO "User" (email, username, password, phoneNo) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, username, hashedPassword, phoneNo]
    );
    res.status(201).json({ message: 'User registered', user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ message: 'Email or Phone number already exists' });
    } else {
      res.status(500).json({ message: 'Registration failed' });
    }
  }
});

// ✅ Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Get user by email
    const result = await client.query('SELECT * FROM "User" WHERE email = $1', [email]);

    // Debug: Show result
    console.log('User fetch result:', result.rows);

    // Check if user exists
    if (!result.rows.length) {
      console.warn('❌ No user found for email:', email);
      return res.status(401).json({ message: 'Invalid credentials (user not found)' });
    }

    const user = result.rows[0];

    // Ensure password exists in DB
    if (!user.password) {
      console.error('❌ Password missing for user:', user);
      return res.status(500).json({ message: 'Password missing in DB' });
    }

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.warn('❌ Incorrect password for:', email);
      return res.status(401).json({ message: 'Invalid credentials (wrong password)' });
    }

    // Respond with success and user info
    res.json({
      success: true,
      user: {
        UserID: user.UserID,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('🔥 Unexpected Login Error:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});


// ✅ Get user by email
app.get('/user', async (req, res) => {
  const { email } = req.query;
  try {
    const result = await client.query('SELECT * FROM "User" WHERE email = $1', [email]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Fetch error' });
  }
});

// ✅ Get user by UserID
app.get('/user-by-id/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await client.query(
      `SELECT "UserID", "username", "email", "photo_url", "last_role" 
       FROM "User" WHERE "UserID" = $1`,
      [userId]
    );

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// ✅ Get Driver by UserID
app.get('/driver-by-user-id/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await client.query('SELECT "DriverID","status" FROM "Driver" WHERE "UserID" = $1', [userId]);

    if (result.rows.length > 0) {
      const { DriverID, status } = result.rows[0];
      res.json({ DriverID, status });
    } else {
      res.status(404).json({ message: 'Driver not found' });
    }
  } catch (error) {
    console.error('Error fetching driver ID:', error);
    res.status(500).json({ error: 'Server error' });
  }
});




// ✅ Forgot password
app.put('/update-password', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await client.query('UPDATE "User" SET password = $1 WHERE email = $2', [hashedPassword, email]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Update error' });
  }
});

// ✅ Upload user profile photo
app.post('/upload-profile-photo', upload.single('photo'), async (req, res) => {
  const { userId } = req.body; // 👈 Changed from email to userId
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  const photoUrl = `/uploads/${file.filename}`;
  try {
    await client.query('UPDATE "User" SET photo_url = $1 WHERE "UserID" = $2', [photoUrl, userId]);
    res.json({ success: true, photo_url: photoUrl });
  } catch (error) {
    console.error('Error saving profile photo:', error);
    res.status(500).json({ message: 'Upload error' });
  }
});


// ✅ Get user photo
app.get('/get-user-photo/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await client.query('SELECT photo_url FROM "User" WHERE "UserID" = $1', [userId]);
    res.json({ photo_url: result.rows[0]?.photo_url || null });
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ message: 'Fetch error' });
  }
});


// ✅ Ride history
app.get('/ride-history/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await client.query('SELECT * FROM ride_History WHERE "UserID" = $1 ORDER BY ride_date DESC', [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ride history:', error);
    res.status(500).json({ message: 'Failed to fetch ride history' });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
