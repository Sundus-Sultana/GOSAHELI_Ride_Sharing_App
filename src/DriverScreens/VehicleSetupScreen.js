import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getVehicleByDriverId } from '../../api'; // ✅ Adjust path if needed
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SetupVehicleScreen({ navigation, route }) {
  const { userId, driverId } = route.params || {};
  const [vehicleDetailsUploaded, setVehicleDetailsUploaded] = useState(false);
  const [vehiclePhotoUploaded, setVehiclePhotoUploaded] = useState(false);
  const [licenseUploaded, setLicenseUploaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  // Handle back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('OfferCarpool', { userId, driverId });
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  // Fetch from backend and check fields independently
  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true);
      if (!driverId) return;

      const data = await getVehicleByDriverId(driverId);
      if (!data) {
        setLoading(false);
        return;
      }

      // ✅ Independent field checks
      const detailsValid =
        !!data.VehicleModel &&
        !!data.VehicleType &&
        !!data.color &&
        !!data.capacity &&
        !!data.PlateNumber;

      const photoValid = !!data.vehicle_url;
      const licenseValid = !!data.license_front_url && !!data.license_back_url;

      setVehicleDetailsUploaded(detailsValid);
      setVehiclePhotoUploaded(photoValid);
      setLicenseUploaded(licenseValid);

      setLoading(false);
    };

    if (isFocused) {
      fetchStatus();
    }
  }, [isFocused, driverId]);

  // Optionally store completion status
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
        <TouchableOpacity onPress={() => navigation.navigate('OfferCarpool', { userId, driverId })}>
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Setup Your Vehicle</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Loading spinner */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#D64584" />
        </View>
      ) : (
        <>
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

          {/* Photo of Vehicle */}
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
            onPress={() => navigation.navigate('LicensePictureScreen', {
              userId,
              driverId,
              refreshKey: Date.now(),
            })}
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

          
        </>
      )}
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
