import React, { useState } from 'react';
import { View, Button, TextInput, Alert } from 'react-native';
import useWebSocket from '../hooks/useWebSocket';
import { API_URL } from '../api';

const TestWSScreen = () => {
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('');

  // Handle incoming messages
  useWebSocket(userId, (msg) => {
    Alert.alert(msg.title, msg.body);
  });

  const sendTest = async () => {
    try {
      const res = await fetch(`${API_URL}/api/test/test-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message }),
      });
      console.log('Test sent:', await res.json());
    } catch (err) {
      console.error('Test failed:', err);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Enter User ID"
        value={userId}
        onChangeText={setUserId}
      />
      <TextInput
        placeholder="Custom message"
        value={message}
        onChangeText={setMessage}
      />
      <Button title="Send Test" onPress={sendTest} />
    </View>
  );
};

export default TestWSScreen;