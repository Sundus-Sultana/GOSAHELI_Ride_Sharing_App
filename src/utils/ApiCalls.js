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
    console.log("id,name,photo",res.data.UserID,res.data.photo_url)
    return {
      userId: res.data.userId,
      username: res.data.username,
      photo_url: res.data.photo_url
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


// ✅ Fetch carpool requests by PassengerID
export const getCarpoolRequestsByPassenger = async (passengerId) => {
  try {
    const res = await axios.get(`${API_URL}/api/carpool/get-status-by-passenger/${passengerId}`);
    return res.data;
  } catch (err) {
    console.error('Error fetching ride requests:', err);
    throw err;
  }
};


export const deleteCarpoolRequest = async (requestId) => {
  try {
    const res = await axios.delete(`${API_URL}/api/carpool/delete-status-request/${requestId}`);
    return res.data;
  } catch (error) {
    console.error('Error deleting carpool request:', error);
    throw error;
  }
};


export const updateCarpoolStatus = async (requestId, status) => {
  try {
    const res = await axios.patch(`${API_URL}/api/carpool/update-status/${requestId}`, { status });
    return res.data;
  } catch (error) {
    console.error('Error updating carpool status:', error);
    throw error;
  }
};


export const submitFeedback = async (feedbackData) => {
  const res = await fetch(`${API_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedbackData)
  });
  return res.json();
};
export const getFeedbackByRequestId = async (requestId) => {
  try {
    const res = await fetch(`${API_URL}/api/feedback/${requestId}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return { success: false };
  }
};

export const addFavourite = async (passengerId, driverId) => {
  try {
    const res = await axios.post(`${API_URL}/api/favourites`, {
      PassengerID: passengerId,
      DriverID: driverId,
      CreatedAt: new Date().toISOString()
    });
    return res.data;
  } catch (error) {
    console.error("Error adding favourite:", error);
    return { success: false, message: "Failed to add favourite" };
  }
};

export const removeFavourite = async (passengerId, driverId) => {
  try {
    const res = await axios.delete(`${API_URL}/api/favourites`, {
      data: { PassengerID: passengerId, DriverID: driverId }
    });
    return res.data;
  } catch (error) {
    console.error("Error removing favourite:", error);
    return { success: false, message: "Failed to remove favourite" };
  }
  };
 
  
export const fetchFavourites = async (passengerId) => {
  try {
    if (!passengerId) {
      console.error("fetchFavourites: passengerId is required");
      return { 
        success: false, 
        message: "passengerId is required",
        exists: false,
        favourites: [] 
      };
    }

    const res = await axios.get(`${API_URL}/api/favourites/${passengerId}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching favourites:", err);
    return { 
      success: false, 
      message: "Failed to fetch favourites",
      exists: false,
      favourites: [] 
    };
  }
};