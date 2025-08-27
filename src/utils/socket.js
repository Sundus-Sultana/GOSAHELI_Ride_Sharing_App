const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const clients = new Map(); // userId -> WebSocket

wss.on('connection', (ws, req) => {
  // Extract userId from query params (e.g., ws://localhost:8080?userId=123)
  const userId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('userId');
  
  if (userId) {
    clients.set(userId, ws);
    console.log(`Client connected: ${userId}`);
  }

  ws.on('close', () => {
    clients.delete(userId);
    console.log(`Client disconnected: ${userId}`);
  });
});

// Function to send notification to specific user
function sendToUser(userId, message) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

module.exports = { wss, sendToUser };