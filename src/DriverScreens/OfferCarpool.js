import React, { useState, useCallback } from 'react';
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
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfilePhoto, getUserPhoto, API_URL } from '../../api';

export default function OfferCarpool({ navigation, route }) {
  const userId = route?.params?.userId;
  const driverId = route?.params?.driverId;

  const [showAlert, setShowAlert] = useState(true);
  const [userName, setUserName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch full user info from your API endpoint
  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_URL}/user-by-id/${userId}`);
      const data = await response.json();
      setUserName(data.username || '');
      // Fallback to empty string if no photo URL is returned
      setPhotoURL(data.photo_url || '');
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  // Load the user's photo using your getUserPhoto API (for extra assurance)
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

  // Load data when this screen is focused
  useFocusEffect(
    useCallback(() => {
      const checkSetupStatus = async () => {
        const completed = await AsyncStorage.getItem('vehicleSetupComplete');
        setShowAlert(completed !== 'true');
        await fetchUserData();
        await loadUserPhoto();
      };
      checkSetupStatus();
    }, [])
  );

  // Launch image picker so the user may upload a profile photo
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

  // Upload the selected image to your backend
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

  // Prevent navigation to Register Your Route if no profile photo has been uploaded
  const handleRegisterRoute = () => {
    if (!photoURL) {
      Alert.alert(
        'Profile Photo Required',
        'Please upload your profile photo before registering your route.'
      );
      return;
    }
    navigation.navigate('DriverCarpoolMap', { userId });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Section in a row */}
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
                uri: photoURL.startsWith('/')
                  ? `${API_URL}${photoURL}`
                  : photoURL,
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
          onPress={() => navigation.navigate('VehicleSetupScreen', { userId,driverId })}
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
    fontStyle:'italic'
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
