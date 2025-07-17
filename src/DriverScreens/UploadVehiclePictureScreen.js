import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_URL, getVehicleByDriverId, deleteVehicleImage } from '../../api';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UploadVehiclePictureScreen = ({ route }) => {
  const navigation = useNavigation();
  const { userId, driverId } = route.params || {};

  const [imageUri, setImageUri] = useState(null);
  const [initialImageUri, setInitialImageUri] = useState(null);
  const [isEditMode, setIsEditMode] = useState(true); // allow pick when no image

  useEffect(() => {
    const loadImage = async () => {
      if (!driverId) return;
      const vehicleData = await getVehicleByDriverId(driverId);
      if (vehicleData?.vehicle_url) {
        const fullUrl = `${API_URL}${vehicleData.vehicle_url}?t=${Date.now()}`;
        setImageUri(fullUrl);
        setInitialImageUri(fullUrl);
        setIsEditMode(false); // disable picker unless user taps edit
      }
    };
    loadImage();
  }, [driverId]);

  const handleImagePick = async () => {
    if (!isEditMode) return;

    Alert.alert('Select Image Source', '', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
          if (!result.canceled) setImageUri(result.assets[0].uri);
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 });
          if (!result.canceled) setImageUri(result.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDeleteImage = async () => {
    Alert.alert('Confirm Deletion', 'Are you sure you want to delete this image?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await deleteVehicleImage(driverId);
            if (result.success) {
              setImageUri(null);
              setInitialImageUri(null);
              setIsEditMode(true); // enable picker
              Alert.alert('Deleted', 'Image deleted successfully');
            } else {
              Alert.alert('Error', 'Failed to delete image');
            }
          } catch (err) {
            console.error('Delete Error:', err);
            Alert.alert('Error', 'Something went wrong');
          }
        },
      },
    ]);
  };

  const uploadImage = async () => {
    if (!imageUri || imageUri === initialImageUri) return;

    Alert.alert('Confirm Upload', 'Do you want to update this vehicle image?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Upload',
        onPress: async () => {
          const uriParts = imageUri.split('.');
          const fileType = uriParts[uriParts.length - 1];

          const formData = new FormData();
          formData.append('vehicleImage', {
            uri: imageUri,
            name: `vehicle.${fileType}`,
            type: `image/${fileType}`,
          });
          formData.append('driverId', driverId);

          try {
            const response = await fetch(`${API_URL}/upload-vehicle-image`, {
              method: 'POST',
              headers: { 'Content-Type': 'multipart/form-data' },
              body: formData,
            });

            const raw = await response.text();
            const data = JSON.parse(raw);

            if (data.imageUrl) {
              await AsyncStorage.setItem('vehiclePhotoUploaded', 'true');
              Alert.alert('Success', 'Vehicle photo updated successfully');
              navigation.goBack();
            } else {
              Alert.alert('Error', 'Failed to upload image');
            }
          } catch (error) {
            console.error('Upload Error:', error);
            Alert.alert('Error', 'Upload failed');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Upload Vehicle Picture</Text>
      <Text style={styles.note}>Your front side & number plate should be clearly visible</Text>

      <View style={styles.imageContainer}>
        {imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
            <TouchableOpacity style={styles.editIcon} onPress={() => setIsEditMode(true)}>
              <MaterialIcons name="edit" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteIcon} onPress={handleDeleteImage}>
              <MaterialIcons name="delete" size={24} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.emptyImageTouchable}
            onPress={handleImagePick}
          >
            <MaterialIcons name="add-a-photo" size={40} color="#888" />
            <Text style={styles.uploadText}>Take or Select Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.saveButton,
          (!imageUri || imageUri === initialImageUri) && { backgroundColor: '#ccc' },
        ]}
        onPress={uploadImage}
        disabled={!imageUri || imageUri === initialImageUri}
      >
        <Text style={styles.saveButtonText}>UPDATE</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  note: { fontSize: 15, marginBottom: 20, color: '#444' },
  imageContainer: {
    height: 200,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D64584',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
    position: 'relative',
  },
  uploadedImage: { width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 10 },
  emptyImageTouchable: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  uploadText: { color: '#888', fontSize: 16, marginTop: 10 },
  editIcon: {
    position: 'absolute',
    bottom: 10,
    right: 50,
    backgroundColor: '#D64584',
    borderRadius: 20,
    padding: 4,
    zIndex: 10,
  },
  deleteIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#D64584',
    borderRadius: 20,
    padding: 4,
    zIndex: 10,
  },
  saveButton: {
    backgroundColor: '#D64584',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default UploadVehiclePictureScreen;
