import axios from 'axios';

// Instead of localhost, use your laptop IP address and backend port
const API_URL ='http://192.168.100.28:5000' 


export const fetchUsers = async () => {
    try {
        const response = await axios.get(`${API_URL}/rider`);
        return response.data;
    } catch (error) {
        console.error('Error fetching rider:', error);
        return [];
    }
};

export const loginUser = async (email) => {
    try {
        const response = await axios.post(`${API_URL}/login`, { email });
        return response.data;
    } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
        throw error.response?.data || { message: 'Login failed' };
    }
};

// Get user photo from backend
export const getUserPhoto = async (email) => {
    try {
        const response = await axios.get(`${API_URL}/get-user-photo?email=${email}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user photo:', error);
        return null;
    }
};

// Upload profile photo (new with file)
export const uploadProfilePhoto = async (email, base64Image) => {
    try {
        const formData = new FormData();
        formData.append('email', email);
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


// Function to get ride history data
export const getRideHistory = async (email) => {
    try {
      const response = await axios.get(`${API_URL}/api/rideHistory`, {
        params: { email }
      });
      return response.data;
    } catch (error) {
      console.error("Full error details:", {
        message: error.message,
        config: error.config,
        response: error.response?.data
      });
      throw error;
    }
};