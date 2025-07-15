import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../../api';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';



const UploadVehiclePictureScreen = ({ route }) => {
  const navigation = useNavigation();
  const { userId, driverId } = route.params || {};
  const [imageUri, setImageUri] = useState(null);


  // Pick image from camera or gallery
  const handleImagePick = async () => {
    Alert.alert('Select Image Source', '', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
          if (!result.cancelled) setImageUri(result.assets[0].uri);
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 });
          if (!result.cancelled) setImageUri(result.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Upload image to backend
  const uploadImage = async () => {
    if (!imageUri) {
      Alert.alert('No Image', 'Please select an image first.');
      return;
    }

    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];

    const formData = new FormData();
    formData.append('vehicleImage', {
      uri: imageUri,
      name: `vehicle.${fileType}`,
      type: `image/${fileType}`,
    });

    try {
      const response = await fetch(`${API_URL}/upload-vehicle-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      if (data.imageUrl) {
        Alert.alert('Success', 'Image uploaded successfully');
        console.log('Uploaded image URL:', `${API_URL}${data.imageUrl}`);
        await AsyncStorage.setItem('vehiclePhotoUploaded', 'true');
        navigation.navigate('VehicleSetupScreen', { vehiclePhotoUploaded: true });

      } else {
        Alert.alert('Error', 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Error', 'Upload failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Upload Vehicle Picture</Text>
      <Text style={styles.note}>Please note: Your front side & number plate should be clearly visible</Text>

      <TouchableOpacity style={styles.imagePlaceholder} onPress={handleImagePick}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
        ) : (
          <>
            <MaterialIcons name="add-a-photo" size={40} color="#888" />
            <Text style={styles.uploadText}>Take or Select Photo</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
  style={[styles.saveButton, !imageUri && { backgroundColor: '#ccc' }]}
  onPress={uploadImage}
  disabled={!imageUri}
>
  <Text style={styles.saveButtonText}>SAVE</Text>
</TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flex: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  note: {
    fontSize: 15,
    marginBottom: 20,
    color: '#444',
  },
  imagePlaceholder: {
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderColor:'#D64584',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  uploadText: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 10,
  },
  saveButton: {
    backgroundColor: '#D64584',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default UploadVehiclePictureScreen;
