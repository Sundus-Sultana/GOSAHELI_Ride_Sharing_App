import { io } from 'socket.io-client';
import { API_URL } from '../../api'; // make sure this points to your backend

export const socket = io(API_URL, {
  transports: ['websocket'], // optional but good for Expo
});
