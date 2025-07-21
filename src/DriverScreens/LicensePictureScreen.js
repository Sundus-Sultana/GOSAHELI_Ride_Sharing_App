import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL, getVehicleByDriverId } from '../../api';

const LicensePictureScreen = ({ route }) => {
  const navigation = useNavigation();
  const { userId, driverId, refreshKey } = route.params || {};
  const [frontImageUri, setFrontImageUri] = useState(null);
  const [backImageUri, setBackImageUri] = useState(null);
  const [frontImageUrl, setFrontImageUrl] = useState('');
  const [backImageUrl, setBackImageUrl] = useState('');
  const [deletingSide, setDeletingSide] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('VehicleSetupScreen', { driverId: driverId, userId: userId, });
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove(); // Clean up on unmount
    }, [])
  );

  const fetchImages = async () => {
    console.log('🔁 LicensePictureScreen focused. Fetching vehicle data...');
    if (!driverId) {
      console.warn('⚠️ No driverId provided');
      return;
    }

    try {
      const vehicle = await getVehicleByDriverId(driverId);
      console.log('✅ Vehicle data received:', vehicle);

      if (!vehicle) {
        console.warn('⚠️ No vehicle found for this driverId:', driverId);
        return;
      }

      const timestamp = Date.now();
      const fullFront = vehicle.license_front_url
        ? `${API_URL}${vehicle.license_front_url}?t=${timestamp}`
        : null;
      const fullBack = vehicle.license_back_url
        ? `${API_URL}${vehicle.license_back_url}?t=${timestamp}`
        : null;

      setFrontImageUri(fullFront);
      setFrontImageUrl(fullFront || '');
      setBackImageUri(fullBack);
      setBackImageUrl(fullBack || '');
    } catch (err) {
      console.error('❌ Error fetching vehicle data:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('📌 Navigation focus triggered. Fetching images...');
      fetchImages();
    });

    return unsubscribe;
  }, [navigation]);

  const pickImage = async (side) => {
    const { granted: cameraGranted } = await ImagePicker.requestCameraPermissionsAsync();
    const { granted: mediaGranted } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!cameraGranted || !mediaGranted) {
      Alert.alert('Permission Denied', 'Camera and media library access is required.');
      return;
    }

    Alert.alert('Select Image Source', '', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
          });
          if (!result.canceled && result.assets?.length > 0) {
            handleUpload(result.assets[0].uri, side);
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
          });
          if (!result.canceled && result.assets?.length > 0) {
            handleUpload(result.assets[0].uri, side);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleUpload = async (uri, side) => {
    const fileType = uri.split('.').pop();
    const formData = new FormData();
    formData.append('licenseImage', {
      uri,
      name: `license_${Date.now()}.${fileType}`,
      type: `image/${fileType}`,
    });
    formData.append('driverId', driverId);
    formData.append('side', side);

    try {
      const res = await fetch(`${API_URL}/upload-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });

      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data?.imageUrl) {
          await fetchImages();
        } else {
          Alert.alert('Upload Failed', 'No image URL returned');
        }
      } catch (jsonErr) {
        console.error('Unexpected non-JSON response:', text);
        Alert.alert('Upload Failed', 'Server returned invalid response');
      }

    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Upload Failed', 'Something went wrong during upload.');
    }
  };

  const deleteLicenseImage = (side) => {
    Alert.alert(
      'Are you sure?',
      `Do you want to delete the ${side} side image?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingSide(side);
              const res = await axios.delete(`${API_URL}/delete-license-image`, {
                data: { driverId, side },
              });

              if (res.data.success) {
                await fetchImages();
                Alert.alert('Success', 'Image deleted successfully');
              } else {
                Alert.alert('Failed', 'Image deletion failed');
              }
            } catch (err) {
              console.error('Delete image error:', err);
              Alert.alert('Error', 'Failed to delete image from server');
            } finally {
              setDeletingSide(null);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!frontImageUrl || !backImageUrl) {
      Alert.alert('Missing', 'Please upload both front and back license images.');
      return;
    }

    await AsyncStorage.setItem('licenseUploaded', 'true');
    Alert.alert('Success', 'License images saved successfully.');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#d63384" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Upload License Photos</Text>

        <TouchableOpacity style={styles.imagePlaceholder} onPress={() => pickImage('front')}>
          {frontImageUri ? (
            <>
              <Image source={{ uri: frontImageUri }} style={styles.image} />
              <TouchableOpacity
                style={styles.deleteIcon}
                onPress={() => deleteLicenseImage('front')}
                disabled={deletingSide === 'front'}
              >
                {deletingSide === 'front' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name="delete" size={24} color="#D64584" />
                )}
              </TouchableOpacity>
              <MaterialIcons name="edit" size={28} color="#D64584" style={styles.editIcon} />
            </>
          ) : (
            <>
              <MaterialIcons name="add-a-photo" size={40} color="#888" />
              <Text style={styles.label}>Front Side</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.imagePlaceholder} onPress={() => pickImage('back')}>
          {backImageUri ? (
            <>
              <Image source={{ uri: backImageUri }} style={styles.image} />
              <TouchableOpacity
                style={styles.deleteIcon}
                onPress={() => deleteLicenseImage('back')}
                disabled={deletingSide === 'back'}
              >
                {deletingSide === 'back' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name="delete" size={24} color="#D64584" />
                )}
              </TouchableOpacity>
              <MaterialIcons name="edit" size={28} color="#D64584" style={styles.editIcon} />
            </>
          ) : (
            <>
              <MaterialIcons name="add-a-photo" size={40} color="#888" />
              <Text style={styles.label}>Back Side</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, !(frontImageUri && backImageUri) && { backgroundColor: '#ccc' }]}
          onPress={handleSave}
          disabled={!(frontImageUri && backImageUri)}
        >
          <Text style={styles.saveText}>SAVE</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({

  safeArea: { flex: 1, backgroundColor: "#fff", },
  container: { flex: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 25, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  imagePlaceholder: {
    width: 350, height: 250, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed',
    borderColor: '#D64584', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f8f8f8', margin: 10
  },
  image: { width: '100%', height: '100%', borderRadius: 10 },
  label: { marginTop: 8, color: '#666', fontSize: 16 },
  saveButton: { backgroundColor: '#D64584', padding: 16, borderRadius: 10, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 18 },
  deleteIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 5,
    borderRadius: 20,
    zIndex: 10,
  },
  editIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 5,
    borderRadius: 20,
    zIndex: 10,
  },
});

export default LicensePictureScreen;
