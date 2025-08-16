import React, { useState, useEffect,useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadProfilePhoto, getUserPhoto, getVehicleByDriverId, API_URL } from '../../api';

export default function OfferCarpool({ navigation, route }) {
  const userId = route?.params?.userId;
  const driverId = route?.params?.driverId;

  const [showAlert, setShowAlert] = useState(true);
  const [userName, setUserName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_URL}/user-by-id/${userId}`);
      const data = await response.json();
      setUserName(data.username || '');
      setPhotoURL(data.photo_url || '');
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const loadUserPhoto = async () => {
    try {
      const response = await getUserPhoto(userId);
      if (response?.photo_url) {
        setPhotoURL(response.photo_url);
      }
    } catch (error) {
      console.error('Error loading user photo:', error);
      setPhotoURL('');
    }
  };

// Fetch user data immediately when component mounts
  useEffect(() => {
    fetchUserData();
    loadUserPhoto();
  }, [userId]);

  useFocusEffect(
      React.useCallback(() => {
        const onBackPress = () => {
          navigation.navigate('DriverHome', { userId, driverId });
          return true;
        };
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
      }, [])
    );


  useFocusEffect(
  useCallback(() => {
    const checkVehicleData = async () => {
      try {
        const data = await getVehicleByDriverId(driverId);

        if (!data || Object.keys(data).length === 0) {
          console.warn('🚨 No vehicle record found.');
          setShowAlert(true); // No vehicle row
          return;
        }

        // Explicitly check if any required field is missing or null
        const fieldsMissing =
          !data.VehicleID ||
          !data.VehicleModel ||
          !data.VehicleType ||
          !data.capacity ||
          !data.color ||
          !data.PlateNumber ||
          !data.vehicle_url ||
          !data.license_front_url ||
          !data.license_back_url;

        setShowAlert(fieldsMissing);
      } catch (error) {
        console.error('🚨 Error fetching vehicle data:', error);
        setShowAlert(true); // On error, assume missing
      }

      await fetchUserData();
      await loadUserPhoto();
    };

    checkVehicleData();
  }, [])
);


  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo library access.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        await saveProfilePhoto(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const saveProfilePhoto = async (base64Image) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return newProgress;
        });
      }, 200);

      const response = await uploadProfilePhoto(userId, base64Image);
      clearInterval(interval);
      setUploadProgress(100);

      if (response?.success && response.photo_url) {
        setPhotoURL(response.photo_url);
        Alert.alert('Success', 'Profile photo updated!');
      } else {
        Alert.alert('Error', 'Failed to update profile photo.');
      }
    } catch (error) {
      console.error('Error saving profile photo:', error);
      Alert.alert('Error', 'Failed to upload profile photo.');
    } finally {
      setUploading(false);
    }
  };

const handleRegisterRoute = async () => {
  // 1. Check profile photo
  if (!photoURL) {
    Alert.alert(
      'Profile Photo Required',
      'Please upload your profile photo before registering your route.'
    );
    return;
  }

  try {
    // 2. Check vehicle information
    const vehicleData = await getVehicleByDriverId(driverId);
    
    if (!vehicleData || Object.keys(vehicleData).length === 0) {
      Alert.alert(
        'Vehicle Information Required',
        'Please complete your vehicle registration before creating a route.'
      );
      return;
    }

    // Define required fields with user-friendly names
    const requiredFields = {
      'VehicleID': 'Vehicle ID',
      'VehicleModel': 'Vehicle Model',
      'VehicleType': 'Vehicle Type',
      'capacity': 'Passengers Capacity',
      'color': 'Vehicle Color',
      'PlateNumber': 'License Plate Number',
      'vehicle_url': 'Vehicle Image (Your front side and number plate should be clearly visible)',
      'license_front_url': 'License Front Image',
      'license_back_url': 'License Back Image'
    };

    // Check for missing fields
    const missingFields = Object.entries(requiredFields)
      .filter(([field]) => !vehicleData[field])
      .map(([_, friendlyName]) => friendlyName);
    
    if (missingFields.length > 0) {
      Alert.alert(
        'Incomplete Vehicle Information',
        `Please complete the following vehicle details:\n\n• ${missingFields.join('\n• ')}`
      );
      return;
    }

    // 3. Check driver approval status
    const driverData = await getDriverById(userId);
    
    if (!driverData) {
      Alert.alert(
        'Driver Registration Incomplete',
        'We could not find your driver registration.\n\nPlease complete your driver profile first.'
      );
      return;
    }

    // Handle driver status
    switch(driverData.status.toLowerCase()) {
      case 'pending':
        Alert.alert(
          'Approval Pending',
          'Your driver application is under review.\n\nWe typically complete reviews within 2-3 business days.\n\nYou will receive a notification when approved.'
        );
        return;
      
      case 'rejected':
        Alert.alert(
          'Application Not Approved',
          `Your driver application was not approved at this time.\n\nReason: ${driverData.rejection_reason || 'Not specified'}\n\nPlease contact support if you have questions.`
        );
        return;
      
      case 'accepted':
        // All checks passed - navigate to route registration
        navigation.navigate('DriverCarpoolMap', { 
          userId, 
          driverId,
          vehicleData // Pass vehicle data to the next screen
        });
        return;
      
      default:
        Alert.alert(
          'Verification Status Unknown',
          'We couldn\'t determine your approval status.\n\nPlease contact support for assistance.'
        );
        return;
    }

  } catch (error) {
    console.error('Error during verification:', error);
    Alert.alert(
      'Verification Error',
      'Failed to verify your information. Please try again.'
    );
  }
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Row */}
      <View style={styles.profileRow}>
        <TouchableOpacity onPress={pickImage} disabled={uploading}>
          {uploading ? (
            <View style={styles.profileImageLoading}>
              <ActivityIndicator size="large" color="#D64584" />
              <Text style={styles.uploadProgressText}>
                {Math.round(uploadProgress)}%
              </Text>
            </View>
          ) : photoURL ? (
            <Image
              source={{
                uri: photoURL.startsWith('/') ? `${API_URL}${photoURL}` : photoURL,
              }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.initialCircle}>
              <Text style={styles.initialLetter}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.profileName}>{userName}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.buttonBox} onPress={handleRegisterRoute}>
          <FontAwesome5 name="route" size={28} color="white" />
          <Text style={styles.buttonText}>Register{"\n"}Your Route</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonBox, { position: 'relative' }]}
          onPress={() => navigation.navigate('VehicleSetupScreen', { userId, driverId })}
        >
          <MaterialIcons name="directions-car" size={28} color="white" />
          <Text style={styles.buttonText}>Register{"\n"}Your Vehicle</Text>
          {showAlert && (
            <View style={styles.alertDot}>
              <Text style={styles.alertText}>!</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    flexGrow: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#D64584',
    marginRight: 15,
  },
  profileImageLoading: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginRight: 15,
  },
  uploadProgressText: {
    marginTop: 8,
    color: '#D64584',
    fontSize: 14,
  },
  initialCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#D64584',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  initialLetter: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#D64584',
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  buttonBox: {
    backgroundColor: '#D64584',
    padding: 15,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  alertDot: {
    position: 'absolute',
    top: 6,
    right: 10,
    backgroundColor: 'red',
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
