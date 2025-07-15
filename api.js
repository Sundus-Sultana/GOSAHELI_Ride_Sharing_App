import axios from 'axios';

// Use your local IP and backend port
export const API_URL = 'http://192.168.100.4:5000';



// ✅ Get user details by userId
export const getUserById = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/user-by-id/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
};






// ✅ Fetch all users (GET /user?email=...)
export const loginUser = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/login`, { email, password });
        return response.data;
    } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
        throw error.response?.data || { message: 'Login failed' };
    }
};

export const getUser = async (email) => {
    try {
        const response = await axios.get(`${API_URL}/user?email=${email}`);
        return response.data[0]; // Return first user found
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error.response?.data || { message: 'Error fetching user' };
    }
};


// ✅ Upload profile photo by UserID
export const uploadProfilePhoto = async (userId, base64Image) => {
  try {
    const formData = new FormData();
    formData.append('userId', userId); // 👈 change from 'email' to 'userId'
    formData.append('photo', {
      uri: `data:image/jpeg;base64,${base64Image}`,
      name: `profile_${Date.now()}.jpg`,
      type: 'image/jpeg'
    });

    const response = await axios.post(`${API_URL}/upload-profile-photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Upload photo error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Upload photo failed' };
  }
};

// ✅ Get user photo by UserID
export const getUserPhoto = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/get-user-photo/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user photo:', error);
    return null;
  }
};


// ✅ Get ride history by UserID 
// api.js
export const getRideHistory = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/ride-history/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching ride history:', error);
    return [];
  }
};

// ✅ Save carpool profile 
export const saveCarpoolProfile = async (profileData) => {
  try {
    const response = await axios.post(`${API_URL}/api/carpool/save-profile`, profileData);
    return response.data;
  } catch (error) {
    console.error('Error saving carpool profile:', error);
    throw error;
  }
};



// ✅ Fetch vehicle info by DriverID
export const getVehicleByDriverId = async (driverId) => {
  try {
    const res = await axios.get(`${API_URL}/vehicleDetails/${driverId}`);
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

export const saveVehicleDetails = async (data) => {
  try {
    const res = await axios.post(`${API_URL}/vehicleDetails`, data);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const updateVehicleDetails = async (driverId, data) => {
  try {
    const res = await axios.put(`${API_URL}/vehicleDetails/${driverId}`, data);
    return res.data;
  } catch (err) {
    throw err;
  }
};



