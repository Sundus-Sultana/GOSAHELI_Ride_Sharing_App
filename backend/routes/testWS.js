const express = require('express');
const router = express.Router();

router.post('/test-notification', (req, res) => {
  const { userId, message } = req.body;
  
  // Send via WebSocket
  req.app.locals.sendToUser(userId, {
    type: 'test',
    title: 'Test Notification',
    body: message || 'Hello from WebSocket!',
    timestamp: new Date().toISOString()
  });

  res.json({ success: true });
});

module.exports = router;