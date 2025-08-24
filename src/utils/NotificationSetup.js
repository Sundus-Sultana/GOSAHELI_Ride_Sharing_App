// utils/NotificationSetup.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const registerForPushNotificationsAsync = async (userId) => {
  // If no userId provided, try to get from AsyncStorage
  if (!userId) {
    userId = await AsyncStorage.getItem('UserID');
    if (!userId) {
      console.log('⚠️ No userId available yet for push notifications');
      return null;
    }
  }

  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
   {/*   Alert.alert('Permission Denied', 'Failed to get push token for notifications!');*/}
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('🚀 Expo Push Token:', token);

    // Save to backend and storage
    await Promise.all([
      sendTokenToBackend(userId, token),
      AsyncStorage.setItem('expoPushToken', token)
    ]);
    
    // Android-specific settings
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  } else {
    Alert.alert('Error', 'Must use a physical device for Push Notifications');
  }

  return token;
};

const sendTokenToBackend = async (userId, expoPushToken) => {
  try {
    const response = await axios.post(`${API_URL}/api/notification/save-push-token`, {
      userId,
      token: expoPushToken
    });

    if (response.data.success) {
      console.log('✅ Push token saved to backend');
    } else {
      console.warn('⚠️ Failed to save push token:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error sending token to backend:', error);
  }
};