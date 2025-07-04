import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Image,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { 
  MaterialIcons, 
  FontAwesome5,
  Ionicons 
} from '@expo/vector-icons';
import { auth } from '../firebase/setup';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfilePhoto, getUserPhoto } from '../../api.js';
import axios from 'axios';

const Profile = ({ navigation }) => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    photoUrl: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Fetch user data from PostgreSQL
          const response = await axios.get(`http://192.168.100.28:5000/rider?email=${currentUser.email}`);
          const userData = response.data[0];
          
          // Fetch user photo separately
          const photoResponse = await getUserPhoto(currentUser.email);
          
          setUser({
            name: userData?.username || '',
            email: currentUser.email,
            photoUrl: photoResponse?.photo_url || null
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleUpdate = async () => {
    try {
      setUploading(true);
      
      // Update username in PostgreSQL
      await axios.put('http://192.168.100.28:5000/update-profile', {
        email: user.email,
        username: user.name
      });

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

      if (!result.canceled && result.assets && result.assets[0].base64) {
        setUploading(true);
        setUploadProgress(0);
        
        // Simulate upload progress
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

        // Upload the photo
        const response = await uploadProfilePhoto(user.email, result.assets[0].base64);
        
        clearInterval(interval);
        setUploadProgress(100);
        
        if (response?.success && response.photo_url) {
          setUser({...user, photoUrl: response.photo_url});
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={isEditing ? handleUpdate : handleEdit}>
          <Text style={styles.editText}>
            {isEditing ? uploading ? 'Saving...' : 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            onPress={isEditing ? pickImage : null}
            disabled={!isEditing || uploading}
            activeOpacity={0.7}
          >
            {uploading ? (
              <View style={styles.profileImageLoading}>
                <ActivityIndicator size="large" color="#d63384" />
                <Text style={styles.uploadProgressText}>
                  {Math.round(uploadProgress)}%
                </Text>
              </View>
            ) : user.photoUrl ? (
              <Image
                source={{ uri: `http://192.168.100.28:5000${user.photoUrl}` }}
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

        {/* Profile Information */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <MaterialIcons name="person" size={24} color="#d63384" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Full Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={user.name}
                  onChangeText={(text) => setUser({...user, name: text})}
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
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>
        </View>

        {/* Additional Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionItem}>
            <MaterialIcons name="payment" size={24} color="#d63384" />
            <Text style={styles.optionText}>Payment Methods</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>


          <TouchableOpacity style={styles.optionItem}>
            <MaterialIcons name="settings" size={24} color="#d63384" />
            <Text style={styles.optionText}>Settings</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <MaterialIcons name="help" size={24} color="#d63384" />
            <Text style={styles.optionText}>Help Center</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => auth.signOut().then(() => navigation.replace('Login'))}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
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