import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SetupVehicleScreen({ navigation, route }) {
  const { userId, driverId } = route.params || {};
  const [vehicleDetailsUploaded, setVehicleDetailsUploaded] = useState(false);
  const [vehiclePhotoUploaded, setVehiclePhotoUploaded] = useState(false);
  const [licenseUploaded, setLicenseUploaded] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    const loadCompletionStatus = async () => {
      const [vehicleDetails, vehiclePhoto, license] = await Promise.all([
        AsyncStorage.getItem('vehicleDetailsUploaded'),
        AsyncStorage.getItem('vehiclePhotoUploaded'),
        AsyncStorage.getItem('licenseUploaded'),
      ]);

      setVehicleDetailsUploaded(vehicleDetails === 'true');
      setVehiclePhotoUploaded(vehiclePhoto === 'true');
      setLicenseUploaded(license === 'true');
    };

    if (isFocused) {
      loadCompletionStatus();
    }
  }, [isFocused]);

  useEffect(() => {
    const checkCompletion = async () => {
      if (vehicleDetailsUploaded && vehiclePhotoUploaded && licenseUploaded) {
        await AsyncStorage.setItem('vehicleSetupComplete', 'true');
      } else {
        await AsyncStorage.removeItem('vehicleSetupComplete');
      }
    };
    checkCompletion();
  }, [vehicleDetailsUploaded, vehiclePhotoUploaded, licenseUploaded]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Setup Your Vehicle</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Vehicle Details */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('VehicleDetailsScreen', { userId, driverId })}
      >
        <Text style={styles.itemText}>Vehicle details</Text>
        <View style={styles.rightIcons}>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={vehicleDetailsUploaded ? 'green' : 'gray'}
            style={{ marginRight: 4 }}
          />
          <Ionicons name="chevron-forward" size={20} color="gray" />
        </View>
      </TouchableOpacity>

      {/* Photo of vehicle */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('UploadVehiclePictureScreen', { userId, driverId })}
      >
        <Text style={styles.itemText}>Photo of vehicle</Text>
        <View style={styles.rightIcons}>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={vehiclePhotoUploaded ? 'green' : 'gray'}
            style={{ marginRight: 4 }}
          />
          <Ionicons name="chevron-forward" size={20} color="gray" />
        </View>
      </TouchableOpacity>

      {/* Driver License */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('LicensePictureScreen', { userId, driverId })}
      >
        <Text style={styles.itemText}>Driver License</Text>
        <View style={styles.rightIcons}>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={licenseUploaded ? 'green' : 'gray'}
            style={{ marginRight: 4 }}
          />
          <Ionicons name="chevron-forward" size={20} color="gray" />
        </View>
      </TouchableOpacity>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton}>
        <Text style={styles.saveButtonText}>SAVE INFORMATION</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f3f7',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  item: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 16,
    color: 'black',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#D64584',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 50,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
