import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Image, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { auth } from '../firebase/setup';
import * as ImagePicker from 'expo-image-picker';
import { API_URL, uploadProfilePhoto, getUserPhoto,getUserById ,getDriverById} from '../../api.js';
import axios from 'axios';

const Profile = ({ navigation, route }) => {
  const { userId } = route.params || {};
  const [user, setUser] = useState({
    name: '',
    email: '',
    photoUrl: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_URL}/user-by-id/${userId}`);
        const userData = response.data;

        const photoResponse = await getUserPhoto(userId);

        setUser({
          name: userData?.username || '',
          email: userData?.email || '',
          photoUrl: photoResponse?.photo_url || null
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);


 useFocusEffect(
  React.useCallback(() => {
    const onBackPress = async () => {
      try {
        const res = await getUserById(userId);
        const role = res?.last_role;
        const userName = res?.username;

        if (role === 'driver') {
          // ✅ fetch driver ID from your backend API
          const driverRes = await getDriverById(userId);
          const driverId = driverRes?.data?.DriverID;

          navigation.navigate('DriverHome', { userId, driverId });
        } else {
          navigation.navigate('Home', { userId, userName });
        }
      } catch (error) {
        console.error('Error on hardware back press:', error);
        navigation.navigate('Home', { userId }); // fallback
      }

      return true; // prevent default back
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [userId])
);

const handleLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await auth.signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'LandingActivity' }],
            });
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Could not sign out. Please try again.');
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

 const handleUpdate = async () => {
  try {
    setUploading(true);
    await axios.put(`${API_URL}/update-profile`, {
      userId: userId,
      username: user.name,
      email: user.email,
      photoUrl: user.photoUrl
    });

    // ✅ Re-fetch updated user info
    const updatedUser = await getUserById(userId);

    if (updatedUser) {
      setUser((prev) => ({
        ...prev,
        name: updatedUser.username,
        email: updatedUser.email,
      }));
    }

    Alert.alert('Success', 'Profile updated successfully');
    setIsEditing(false);
  } catch (error) {
    console.error('Error updating profile:', error);
    Alert.alert('Error', 'Failed to update profile');
  } finally {
    setUploading(false);
  }
};


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

      if (!result.canceled && result.assets?.[0]?.base64) {
        setUploading(true);
        setUploadProgress(0);

        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            const next = prev + 10;
            if (next >= 100) {
              clearInterval(interval);
              return 100;
            }
            return next;
          });
        }, 200);

        const response = await uploadProfilePhoto(userId, result.assets[0].base64);

        clearInterval(interval);
        setUploadProgress(100);

        if (response?.success && response.photo_url) {
          setUser((prev) => ({ ...prev, photoUrl: response.photo_url }));
          Alert.alert('Success', 'Profile photo updated!');
        } else {
          Alert.alert('Error', 'Failed to update profile photo.');
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#d63384" barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
         <TouchableOpacity onPress={async () => {
  try {
    const res = await getUserById(userId);
    const role = res?.last_role;
    const userName = res?.username;

    if (role === 'driver') {
      const driverRes = await getDriverById(userId);
      const driverId = driverRes?.data?.DriverID;

      navigation.navigate('DriverHome', { userId, driverId });
    } else {
      navigation.navigate('Home', { userId, userName });
    }
  } catch (error) {
    console.error('Error on header back press:', error);
    navigation.navigate('Home', { userId }); // fallback
  }
}}>
  <Ionicons name="arrow-back" size={24} color="#fff" />
</TouchableOpacity>


          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity onPress={isEditing ? handleUpdate : handleEdit}>
            <Text style={styles.editText}>
              {isEditing ? (uploading ? 'Saving...' : 'Save') : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Profile Picture */}
          <View style={styles.profileSection}>
            <TouchableOpacity
              onPress={isEditing ? pickImage : null}
              disabled={!isEditing || uploading}
              activeOpacity={0.7}
            >
              {uploading ? (
                <View style={styles.profileImageLoading}>
                  <ActivityIndicator size="large" color="#d63384" />
                  <Text style={styles.uploadProgressText}>{Math.round(uploadProgress)}%</Text>
                </View>
              ) : user.photoUrl ? (
                <Image
                  source={{ uri: `${API_URL}${user.photoUrl}` }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileInitial}>
                    {user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {isEditing && !uploading && (
                <View style={styles.cameraIcon}>
                  <MaterialIcons name="camera-alt" size={24} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.profileName}>{user.name}</Text>
          </View>

          {/* Profile Info */}
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <MaterialIcons name="person" size={24} color="#d63384" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Full Name</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={user.name}
                    onChangeText={(text) => setUser({ ...user, name: text })}
                  />
                ) : (
                  <Text style={styles.infoValue}>{user.name}</Text>
                )}
              </View>
            </View>

            <View style={styles.infoItem}>
              <MaterialIcons name="email" size={24} color="#d63384" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Email</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={user.email}
                    onChangeText={(text) => setUser({ ...user, email: text })}
                  />
                ) : (
                  <Text style={styles.infoValue}>{user.email}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Placeholder options */}
          <View style={styles.optionsContainer}>
            {[
             
              ['settings', 'Settings'],
              ['help', 'Help Center'],
            ].map(([icon, label]) => (
              <TouchableOpacity
  key={label}
  style={styles.optionItem}
  onPress={() => {
    if (label === 'Settings') {
      navigation.navigate('SettingsScreen', { userId });
    } 
     else if (label === 'Help Center') {
      navigation.navigate('Support', { userId });
    } else {
      Alert.alert('Coming Soon', `${label} screen is not implemented yet.`);
    }
  }}
>
  <MaterialIcons name={icon} size={24} color="#d63384" />
  <Text style={styles.optionText}>{label}</Text>
  <MaterialIcons name="chevron-right" size={24} color="#888" />
</TouchableOpacity>

            ))}
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
           onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#d63384',
    padding: 15,
    paddingTop: 15,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  editText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    paddingBottom: 30,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#d63384',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#d63384',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageLoading: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  uploadProgressText: {
    marginTop: 8,
    color: '#d63384',
    fontSize: 14,
  },
  profileInitial: {
    color: 'white',
    fontSize: 42,
    fontWeight: 'bold',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#d63384',
    borderRadius: 15,
    padding: 5,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2B2B52',
    marginTop: 10,
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: '#2B2B52',
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    color: '#2B2B52',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#d63384',
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 20,
    marginHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#2B2B52',
    flex: 1,
    marginLeft: 15,
  },
  logoutButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutText: {
    color: '#d63384',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Profile;
