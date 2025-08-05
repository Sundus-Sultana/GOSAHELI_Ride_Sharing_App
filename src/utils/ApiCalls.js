import axios from 'axios';
import { API_URL } from '../../api';

export const getUserById = async (userId) => {
  try {
    const res = await axios.get(`${API_URL}/user-by-id/${userId}`);
    return res.data;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
};

export const getPassengerUserIdFromRequest = async (requestId) => {
  try {
    const res = await axios.get(`${API_URL}/api/become-passenger/user-by-request/${requestId}`);
    
    // Now returns both userId and username
    return {
      userId: res.data.userId,
      username: res.data.username
    };
    
  } catch (error) {
    console.error('Error getting passenger userId:', error);
    return null;
  }
};
