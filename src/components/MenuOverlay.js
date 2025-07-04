import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  TouchableWithoutFeedback, 
  Image, 
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import { auth } from '../firebase/setup';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfilePhoto, getUserPhoto, getRideHistory } from '../../api.js';

const MenuOverlay = ({ visible, closeModal, navigation, user }) => {
  const [photoURL, setPhotoURL] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingRides, setLoadingRides] = useState(false);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  useEffect(() => {
    const loadUserPhoto = async () => {
      if (user?.email) {
        try {
          const response = await getUserPhoto(user.email);
          if (response?.photo_url) {
            setPhotoURL(response.photo_url);
          }
        } catch (error) {
          console.error('Error loading user photo:', error);
        }
      }
    };
    
    loadUserPhoto();
  }, [user]);

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
        aspect: [4, 3],
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

      const response = await uploadProfilePhoto(user.email, base64Image);
      
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

  const handleMyRidesPress = async () => {
    try {
      setLoadingRides(true);
      closeModal();
      
      const rideHistory = await getRideHistory(user.email);
      navigation.navigate('History', { rideHistory });
    } catch (error) {
      console.error('Error fetching ride history:', error);
      Alert.alert('Error', 'Failed to load ride history. Please try again.');
    } finally {
      setLoadingRides(false);
    }
  };

  const handleSupportPress = () => {
    closeModal();
    Linking.openURL('mailto:support@saheli.com?subject=Saheli App Support');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
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
      ]
    );
  };

  return (
    <Modal 
      transparent={true} 
      visible={visible} 
      animationType="fade"
      onRequestClose={closeModal}
    >
      <TouchableWithoutFeedback onPress={closeModal}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={closeModal}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>

              <View style={styles.profileSection}>
                <TouchableOpacity 
                  onPress={pickImage} 
                  disabled={uploading}
                  activeOpacity={0.7}
                >
                  {uploading ? (
                    <View style={styles.profileImageLoading}>
                      <ActivityIndicator size="large" color="#D64584" />
                      <Text style={styles.uploadProgressText}>
                        {Math.round(uploadProgress)}%
                      </Text>
                    </View>
                  ) : photoURL ? (
                    <Image 
                      source={{ uri: `http://192.168.100.28:5000${photoURL}` }} 
                      style={styles.profileImage}
                    />
                  ) : (
                    <View style={styles.profileImagePlaceholder}>
                      <Text style={styles.profileInitial}>
                        {displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                
                 <Text style={styles.profileHint}>
                  {photoURL ? 'Tap to change photo' : 'Tap to add photo'}
                </Text>
                <Text style={styles.profileName}>{displayName}</Text>
               
              </View>

              {loadingRides ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#D64584" />
                  <Text style={styles.loadingText}>Loading your rides...</Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => {
                      closeModal();
                      navigation.navigate('Wallet');
                    }}
                  >
                    <Text style={styles.menuText}>Wallet</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => {
                      closeModal();
                      navigation.navigate('Carpool');
                    }}
                  >
                    <Text style={styles.menuText}>Carpool</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={handleMyRidesPress}
                  >
                    <Text style={styles.menuText}>My Rides</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.menuItem}
                    /*onPress={handleSupportPress}*/
                      onPress={() => {
                      closeModal();
                      navigation.navigate('Support');
                    }}
                  >
                    <Text style={styles.menuText}>Support</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => {
                      closeModal();
                      navigation.navigate('about');
                    }}
                  >
                    <Text style={styles.menuText}>About</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity 
                style={styles.logoutButton} 
                onPress={handleLogout}
              >
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.driverButton}
                onPress={() => {
                  closeModal();
                  navigation.navigate('DriverApplication');
                }}
              >
                <Text style={styles.driverText}>Become a Driver</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 70,
    paddingRight: 10,
  },
  container: {
    width: 280,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#D64584',
    shadowOffset: { width: 1, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 17,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  closeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D64584',
  },
  profileSection: {
    marginBottom: 25,
    alignItems: 'center',
    paddingTop: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#D64584',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D64584',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageLoading: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  uploadProgressText: {
    marginTop: 8,
    color: '#D64584',
    fontSize: 14,
  },
  profileInitial: {
    color: 'white',
    fontSize: 42,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#333',
  },
  profileHint: {
    fontSize: 14,
    color: '#D64584',
    marginTop: 6,
    fontStyle: 'italic',
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuText: {
    fontSize: 17,
    color: '#444',
  },
  logoutButton: {
    padding: 12,
    marginTop: 25,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: '#D64584',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  driverButton: {
    backgroundColor: '#D64584',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  driverText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#D64584',
  },
});

export default MenuOverlay;