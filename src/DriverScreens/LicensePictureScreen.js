import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Alert, SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../api'; // Your shared API config

const LicensePictureScreen  = ({ route }) => {
  const navigation = useNavigation();
  const { userId, driverId } = route.params || {};
  const [frontImageUri, setFrontImageUri] = useState(null);
  const [backImageUri, setBackImageUri] = useState(null);
  const [frontImageUrl, setFrontImageUrl] = useState('');
  const [backImageUrl, setBackImageUrl] = useState('');

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

  try {
    const res = await fetch(`${API_URL}/upload-license`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
      body: formData,
    });

    const text = await res.text(); // get raw response
    try {
      const data = JSON.parse(text); // try parsing as JSON
      if (data?.imageUrl) {
        const fullUrl = `${API_URL}${data.imageUrl}`;
        if (side === 'front') {
          setFrontImageUri(uri);
          setFrontImageUrl(fullUrl);
        } else {
          setBackImageUri(uri);
          setBackImageUrl(fullUrl);
        }
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


const handleSave = async () => {
  console.log('Front Image URL:', frontImageUrl);
  console.log('Back Image URL:', backImageUrl);
  // Go back to SetupVehicleScreen and pass the flag
  await AsyncStorage.setItem('licenseUploaded', 'true');
  navigation.navigate('VehicleSetupScreen', { licenseUploaded: true });
};


  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Upload License Photos</Text>

      <TouchableOpacity style={styles.imagePlaceholder} onPress={() => pickImage('front')}>
        {frontImageUri ? (
          <Image source={{ uri: frontImageUri }} style={styles.image} />
        ) : (
          <>
            <MaterialIcons name="add-a-photo" size={40} color="#888" />
            <Text style={styles.label}>Front Side</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.imagePlaceholder} onPress={() => pickImage('back')}>
        {backImageUri ? (
          <Image source={{ uri: backImageUri }} style={styles.image} />
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
  );
}

const styles = StyleSheet.create({
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
});
export default LicensePictureScreen;

