import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Camera } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CameraCapture({ navigation }) {
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [detectionActive, setDetectionActive] = useState(false);

  // Ask for camera permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Start auto-detection when camera is ready
  useEffect(() => {
    if (hasPermission && !detectionActive) {
      const timer = setTimeout(() => {
        setDetectionActive(true);
        takePicture();
      }, 1000); // Wait 1 second for camera to initialize

      return () => clearTimeout(timer);
    }
  }, [hasPermission, detectionActive]);

  const takePicture = async () => {
    if (!cameraRef.current || loading) return;

    setLoading(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });

      if (!photo.base64) {
        handleError('Failed to capture image.');
        return;
      }

      await checkGender(photo.base64);
    } catch (error) {
      console.error('Camera Error:', error);
      handleError('Failed to take picture.');
    }
  };

  const handleError = (message) => {
    setLoading(false);
    setAttemptCount(prev => prev + 1);

    if (attemptCount >= 2) {
      Alert.alert('Verification Failed', 'Maximum attempts reached. Only female users are allowed.', [
        { text: 'OK', onPress: () => navigation.replace('Login') }
      ]);
    } else {
      Alert.alert('Error', message, [
        { 
          text: 'Try Again', 
          onPress: () => {
            setDetectionActive(true);
            takePicture();
          }
        }
      ]);
    }
  };

  const checkGender = async (base64) => {
    const formData = new FormData();
    formData.append('api_key', 'Pu8E95qZxx5k-FENZFArK4AqxKsuQ5Un');
    formData.append('api_secret', 'ERQP089xe3qvDRmg7csqqWy0Ew7G-qBr');
    formData.append('image_base64', base64);
    formData.append('return_attributes', 'gender');

    try {
      const response = await fetch('https://api-us.faceplusplus.com/facepp/v3/detect', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.faces || result.faces.length === 0) {
        handleError('No face detected. Try again.');
        return;
      }

      const gender = result.faces[0].attributes.gender.value;

      if (gender === 'Female') {
        setLoading(false);
        navigation.replace('Home');
      } else {
        handleError('Only female users are allowed.');
      }
    } catch (error) {
      console.error('Face++ Error:', error);
      handleError('Gender verification failed.');
    }
  };

  if (hasPermission === null) {
    return <View style={styles.centered}><Text>Requesting Camera Permission...</Text></View>;
  }

  if (hasPermission === false) {
    return <View style={styles.centered}><Text>No access to camera</Text></View>;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Camera 
        ref={cameraRef} 
        style={styles.camera} 
      />

      {loading && <ActivityIndicator style={styles.loading} size="large" color="#D64584" />}
      
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Position your face in the frame</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 10,
  },
  overlayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});