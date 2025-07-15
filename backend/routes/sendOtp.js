// routes/otp.js
const express = require('express');
const router = express.Router();
const twilio = require('twilio');

// Replace with your actual Twilio SID and Auth Token
const accountSid = 'your_twilio_sid';
const authToken = 'your_twilio_token';
const fromPhone = 'your_twilio_phone_number'; // e.g., +12065551234

const client = twilio(accountSid, authToken);

const otpStore = {}; // Temporarily store OTPs in memory

// Send OTP
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await client.messages.create({
      body: `Your Saheli OTP is: ${otp}`,
      from: fromPhone,
      to: `+92${phone.slice(1)}`
    });

    otpStore[phone] = otp;
    setTimeout(() => delete otpStore[phone], 5 * 60 * 1000); // Auto-delete in 5 mins

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('OTP send error:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/verify-otp', (req, res) => {
  const { phone, enteredOtp } = req.body;
  if (otpStore[phone] === enteredOtp) {
    delete otpStore[phone];
    res.json({ verified: true });
  } else {
    res.status(400).json({ verified: false, message: 'Incorrect OTP' });
  }
});

module.exports = router;
