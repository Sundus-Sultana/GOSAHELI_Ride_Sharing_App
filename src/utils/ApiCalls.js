import axios from 'axios';
import { API_URL } from '../../api';

export const getUserById = async (userId) => {
  try {
    if (!userId) {
      console.warn('getUserById: userId is empty');
      return { name: 'Unknown', photo: null };
    }
    
    const res = await axios.get(`${API_URL}/user-by-id/${userId}`);
    return res.data;
  } catch (error) {
    console.error('Error fetching user by ID:', error.response?.data || error.message);
    return { name: 'Unknown', photo: null };
  }
};

export const getPassengerUserIdFromRequest = async (requestId) => {
  try {
    const res = await axios.get(`${API_URL}/api/become-passenger/user-by-request/${requestId}`);
    return {
      userId: res.data.userId,
      username: res.data.username
    };
  } catch (error) {
    console.error('Error getting passenger userId:', error.response?.data || error.message);
    return { userId: null, username: 'Unknown' };
  }
};

export const getAcceptedRequestsForPassenger = async (passengerId) => {
  const response = await fetch(`${API_URL}/passenger/accepted-requests/${passengerId}`);
  const data = await response.json();
  return data;
};

export const getDriverUserInfo = async (driverId) => {
  const response = await fetch(`${API_URL}/driver-info/${driverId}`);
  const data = await response.json();
  return data;
};

export const getVehicleInfo = async (driverId) => {
  const response = await fetch(`${API_URL}/vehicle-info/${driverId}`);
  const data = await response.json();
  return data;
};
