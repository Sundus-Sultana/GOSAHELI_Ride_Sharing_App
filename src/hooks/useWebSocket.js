import { useEffect } from 'react';
import { Alert } from 'react-native';
import { API_URL } from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function useWebSocket(onMessage) {
  useEffect(() => {
    let ws;
    let reconnectAttempts = 0;

    const connect = async () => {
      const userId = await AsyncStorage.getItem('UserID');
      if (!userId) return;

      ws = new WebSocket(`${API_URL.replace('http', 'ws')}?userId=${userId}`);

      ws.onopen = () => {
        console.log('[WS] Connected');
        reconnectAttempts = 0;
      };

      ws.onmessage = (e) => {
        try {
          const message = JSON.parse(e.data);
          onMessage(message);
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      };

      ws.onerror = (e) => {
        console.error('[WS] Error:', e.message);
      };

      ws.onclose = () => {
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
        reconnectAttempts++;
        setTimeout(connect, delay);
      };
    };

    connect();

    return () => ws?.close();
  }, [onMessage]);
}