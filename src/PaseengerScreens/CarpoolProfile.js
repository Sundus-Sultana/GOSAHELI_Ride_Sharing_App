import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  ScrollView, TouchableOpacity, KeyboardAvoidingView,
  Platform, Switch, Alert
} from 'react-native';
import Constants from 'expo-constants';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { CARPOOL_PRICE_PARAMS } from './Carpool';
import { useNavigation, useRoute } from '@react-navigation/native';
import { saveCarpoolProfile, API_URL, saveCarpoolRequest } from '../../api';
import axios from 'axios';

const primaryColor = '#D64584';
const lightGrey = '#E0E0E0';

const CarpoolProfile = () => {
  const navigation = useNavigation();
  const route = useRoute();
  let {
    userId,
    passengerId,
    profileId,
    pickupLocation,
    dropoffLocation,
    distanceKm
  } = route.params;

  // Ensure distance is a number (fix NaN issues)
  distanceKm = parseFloat(distanceKm) || 0;

  console.log("PassengerID on Carpool Profile:", passengerId);
  console.log("distance on Carpool Profile:", distanceKm);

  const [saveProfile, setSaveProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fareDetails, setFareDetails] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [request, setRequest] = useState({
    pickup: '',
    dropoff: '',
    seatsNeeded: '1',
    date: new Date(),
    time: new Date(),
    smoking: 'no-preference',
    music: 'no-preference',
    conversation: 'no-preference',
    luggage: false,
    recurring: false,
    daysOfWeek: [],
    specialRequests: '',
  });

  const [expandedPreferences, setExpandedPreferences] = useState(false);
  const [routeType, setRouteType] = useState('Two Way');
  const [pickupTime, setPickupTime] = useState(new Date());
  const [dropOffTime, setDropOffTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeTimePickerFor, setActiveTimePickerFor] = useState(null);
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  //initialize with saved profile
  useEffect(() => {
    const initializeForm = async () => {
      if (profileId) {
        try {
          const res = await axios.get(`${API_URL}/api/carpool/get-carpool-profile/${profileId}`);
          const profile = res.data.data;

          setRequest(prev => ({
            ...prev,
            pickup: profile.pickup_location,
            dropoff: profile.dropoff_location,
            seatsNeeded: profile.seats.toString(),
            date: new Date(profile.date),
            smoking: profile.smoking_preference,
            music: profile.music_preference,
            conversation: profile.conversation_preference,
            luggage: profile.allows_luggage,
            recurring: profile.is_recurring,
            daysOfWeek: profile.recurring_days?.split(',') || [],
            specialRequests: profile.special_requests || '',
            fare: profile.fare|| '',
              distance_km: distanceKm  // Add distance

          }));

          setRouteType(profile.route_type || 'One Way');
          setPickupTime(new Date(`1970-01-01T${profile.pickup_time}`));
          if (profile.route_type === 'Two Way' && profile.dropoff_time) {
            setDropOffTime(new Date(`1970-01-01T${profile.dropoff_time}`));
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          Alert.alert("Error", "Failed to load profile data");
        }
      } else {
        // Initialize with default values first
        const defaultFormState = {
          pickup: '',
          dropoff: '',
          seatsNeeded: '1',
          date: new Date(),
          time: new Date(),
          smoking: 'no-preference',
          music: 'no-preference',
          conversation: 'no-preference',
          luggage: false,
          recurring: false,
          daysOfWeek: [],
          specialRequests: ''
        };

        // Merge with any incoming form state
        const incomingState = route.params?.formState || {};

        setRequest(prev => ({
          ...defaultFormState,
          ...prev,
          ...incomingState,
          // Always override pickup and dropoff from params if they exist
          pickup: pickupLocation || incomingState.pickup || prev.pickup,
          dropoff: dropoffLocation || incomingState.dropoff || prev.dropoff,
          // Ensure date is a Date object
          date: incomingState.date ? new Date(incomingState.date) : prev.date
        }));
      }

      setIsInitialized(true);
    };

    if (!isInitialized) {
      initializeForm();
    }
  }, [pickupLocation, dropoffLocation, profileId, isInitialized, route.params?.formState]);


  // Calculate fare whenever seats or time changes
  useEffect(() => {
    calculateFare();
  }, [request.seatsNeeded, pickupTime, dropOffTime, routeType]);

  const calculateFare = () => {
    setIsCalculating(true);

    const dist = Number(distanceKm);
    if (isNaN(dist) || dist <= 0) {
      Alert.alert('Error', 'Invalid distance');
      setIsCalculating(false);
      return;
    }

    const seats = parseInt(request?.seatsNeeded) || 1;
    if (isNaN(seats) || seats <= 0) {
      Alert.alert('Error', 'Invalid seat count');
      setIsCalculating(false);
      return;
    }

    const {
      FUEL_PRICE_PER_LITER,
      AVERAGE_MILEAGE,
      DRIVER_PROFIT_MARGIN,
      APP_COMMISSION,
      PEAK_HOUR_SURCHARGE,
      PEAK_HOURS,
      BASE_COST_PER_KM,
      MINIMUM_FARE
    } = CARPOOL_PRICE_PARAMS;

    const getFareForTime = (rideTime) => {
      const hour = rideTime.getHours();
      const isPeakHour = PEAK_HOURS.some(h => hour >= h && hour < h + 2);

      // Fuel & Surcharge
      let baseFuelCost = (dist / AVERAGE_MILEAGE) * FUEL_PRICE_PER_LITER;
      const peakSurcharge = isPeakHour ? baseFuelCost * PEAK_HOUR_SURCHARGE : 0;
      const totalFuelCost = baseFuelCost + peakSurcharge;

      const sharedFuelPerSeat = totalFuelCost / 3;
      const maintenancePerSeat = dist * BASE_COST_PER_KM;
      const baseCostPerSeat = sharedFuelPerSeat + maintenancePerSeat;

      const driverProfitPerSeat = baseCostPerSeat * DRIVER_PROFIT_MARGIN;
      const appCommissionPerSeat = (baseCostPerSeat + driverProfitPerSeat) * APP_COMMISSION;

      let finalFarePerSeat = baseCostPerSeat + driverProfitPerSeat + appCommissionPerSeat;
      finalFarePerSeat = Math.max(finalFarePerSeat, MINIMUM_FARE);

      const totalFare = finalFarePerSeat * seats;
      const totalDriverEarnings = (baseCostPerSeat + driverProfitPerSeat) * seats;
      const totalAppCommission = appCommissionPerSeat * seats;

      return {
        isPeakHour,
        baseFuelCost,
        peakSurcharge,
        totalFuelCost,
        sharedFuelPerSeat,
        maintenancePerSeat,
        baseCostPerSeat,
        driverProfitPerSeat,
        appCommissionPerSeat,
        finalFarePerSeat,
        totalFare,
        totalDriverEarnings,
        totalAppCommission
      };
    };

    const pickupFare = getFareForTime(pickupTime);
    const dropoffFare = routeType === 'Two Way' ? getFareForTime(dropOffTime) : null;

    const totalFare = pickupFare.totalFare + (dropoffFare?.totalFare || 0);
    const totalAppCommission = pickupFare.totalAppCommission + (dropoffFare?.totalAppCommission || 0);
    const totalDriverEarnings = pickupFare.totalDriverEarnings + (dropoffFare?.totalDriverEarnings || 0);

    // For display: set finalFare as combined per seat fare
    const finalFarePerSeat =
      pickupFare.finalFarePerSeat + (dropoffFare?.finalFarePerSeat || 0);

    setFareDetails({
      finalFare: Math.round(finalFarePerSeat),
      returnFare: dropoffFare ? Math.round(dropoffFare.finalFarePerSeat) : null,
      totalFare: Math.round(totalFare),
      driverEarnings: Math.round(totalDriverEarnings),
      appCommission: Math.round(totalAppCommission),
      breakdown: {
        seats,
        pickup: {
          isPeakHour: pickupFare.isPeakHour,
          baseFuelCost: Math.round(pickupFare.baseFuelCost),
          peakSurcharge: Math.round(pickupFare.peakSurcharge),
          sharedFuelPerSeat: Math.round(pickupFare.sharedFuelPerSeat),
          maintenancePerSeat: Math.round(pickupFare.maintenancePerSeat),
          baseCostPerSeat: Math.round(pickupFare.baseCostPerSeat),
          driverProfitPerSeat: Math.round(pickupFare.driverProfitPerSeat),
          appCommissionPerSeat: Math.round(pickupFare.appCommissionPerSeat),
          finalFarePerSeat: Math.round(pickupFare.finalFarePerSeat)
        },
        dropoff: dropoffFare && {
          isPeakHour: dropoffFare.isPeakHour,
          baseFuelCost: Math.round(dropoffFare.baseFuelCost),
          peakSurcharge: Math.round(dropoffFare.peakSurcharge),
          sharedFuelPerSeat: Math.round(dropoffFare.sharedFuelPerSeat),
          maintenancePerSeat: Math.round(dropoffFare.maintenancePerSeat),
          baseCostPerSeat: Math.round(dropoffFare.baseCostPerSeat),
          driverProfitPerSeat: Math.round(dropoffFare.driverProfitPerSeat),
          appCommissionPerSeat: Math.round(dropoffFare.appCommissionPerSeat),
          finalFarePerSeat: Math.round(dropoffFare.finalFarePerSeat)
        }
      }
    });

    setIsCalculating(false);
  };

  const handleTimeChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(false);
      if (event.type === 'set' && selectedDate) {
        updateTime(selectedDate);
      }
    } else {
      setShowTimePicker(false);
      if (selectedDate) {
        updateTime(selectedDate);
      }
    }
  };

  const updateTime = (selectedDate) => {
    if (activeTimePickerFor === 'pickup') {
      setPickupTime(selectedDate);
      setRequest(prev => ({ ...prev, time: selectedDate }));  // ✅ Sync
    } else if (activeTimePickerFor === 'dropoff') {
      setDropOffTime(selectedDate);
    }
  };
  const showPicker = (forWhat) => {
    if (forWhat === 'dropoff' && routeType !== 'Two Way') return;
    setActiveTimePickerFor(forWhat);

    if (Platform.OS === 'android') {
      setShowAndroidPicker(true);
    } else {
      setShowTimePicker(true);
    }
  };  

  const formatTime = (date) => {
    if (!date) return 'Select Time';
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${formattedMinutes} ${ampm}`;
  };

  const toggleDaySelection = (day) => {
    setRequest(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setRequest({ ...request, date: selectedDate });
    }
  };

  const formatTimeForDB = (date) => {
    if (!date) return null;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}:00`;
  };

  const submitRequest = async () => {
    if (isSubmitting) return;
    if (!fareDetails) {
      Alert.alert('Error', 'Fare calculation in progress');
      return;
    }
    const { pickup, dropoff, seatsNeeded, date, recurring, daysOfWeek  } = request;
    if (!pickup || !dropoff || !seatsNeeded || !date) {
      Alert.alert("Error", "Please complete all required fields.");
      return;
    }

// ✅ New validation: If recurring ride but no day selected
console.log("Recurring:", request.recurring, "Days selected:", request.daysOfWeek);
  if (!recurring || (!daysOfWeek || daysOfWeek.length === 0)) {
    Alert.alert("Error", "Please select at least one day for a recurring ride.");
    return;
  }
    setIsSubmitting(true);

    try {
      // Prepare common payload
      const ridePayload = {
        pickup_location: pickup,
        dropoff_location: dropoff,
        seats: parseInt(seatsNeeded),
        date: date.toISOString().split('T')[0],
        pickup_time: formatTimeForDB(pickupTime),
        dropoff_time: routeType === 'Two Way' ? formatTimeForDB(dropOffTime) : null,
        smoking_preference: request.smoking,
        music_preference: request.music,
        conversation_preference: request.conversation,
        allows_luggage: request.luggage,
        is_recurring: request.recurring,
        recurring_days: request.recurring ? request.daysOfWeek.join(',') : null,
        special_requests: request.specialRequests || null,
        route_type: routeType,
        fare: fareDetails.totalFare,
          distance_km: distanceKm  // Add distance

      };

      let carpool_profile_id = null;

      if (saveProfile) {
        const profilePayload = {
          UserID: userId,
          ...ridePayload,
            distance_km: distanceKm  // Add distance

        };

        const response = await saveCarpoolProfile(profilePayload);
        if (response && response.data && response.data.data) {
          carpool_profile_id = response.data.data.carpool_profile_id;
          Alert.alert("Success", "Profile saved successfully!");
        }
      }
      let RequestID = null;

      // Always create carpool status
      const statusPayload = {
        PassengerID: passengerId,
        carpool_profile_id: carpool_profile_id || null,
        ...ridePayload,
      };

      const response = await saveCarpoolRequest(statusPayload);
      if (response && response.data && response.data.data) {
        RequestID = response.data.data.RequestID;
      }
      console.log("Ride Request ID:", RequestID);

      // Navigate to status screen
      navigation.navigate('CarpoolStatusScreen', { userId, passengerId, fareDetails });
    } catch (error) {
      console.error('Error saving profile or creating request:', error);
      Alert.alert(
        "Error",
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to submit carpool request."
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#d63384" barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              // Convert Date objects to ISO strings for serialization
              const serializableState = {
                ...request,
                date: request.date.toISOString(),
                time: request.time.toISOString()
              };

              navigation.navigate('Carpool', {
                pickupLocation: request.pickup,
                dropoffLocation: request.dropoff,
                formState: serializableState
              });
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#070707ff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {profileId ? 'Edit Carpool Profile' : 'Create Carpool Profile'}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer}>
          {/* Route Type Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                routeType === 'One Way' && styles.toggleButtonActiveLeft,
              ]}
              onPress={() => setRouteType('One Way')}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  routeType === 'One Way' && styles.toggleButtonTextActive,
                ]}
              >
                One Way
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                styles.toggleButtonRight,
                routeType === 'Two Way' && styles.toggleButtonActiveRight,
              ]}
              onPress={() => setRouteType('Two Way')}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  routeType === 'Two Way' && styles.toggleButtonTextActive,
                ]}
              >
                Two Way
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.officeReportTime}>*Office Report Time</Text>

          {/* Location Card */}
          <View style={styles.locationCard}>
            <View style={styles.locationRow}>
              <FontAwesome5 name="dot-circle" size={20} color={primaryColor} />
              <TextInput
                style={styles.locationInput}
                value={request.pickup}
                onChangeText={(text) => setRequest({ ...request, pickup: text })}
                placeholder="Pickup location"
                editable={false}
                selectTextOnFocus={false}
                multiline={true}
                numberOfLines={2}
                textAlignVertical="top"
              />
              <TouchableOpacity onPress={() => showPicker('pickup')}>
                <Text style={styles.timeText}>{formatTime(pickupTime)}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.directionArrowContainer}>
              {routeType === 'Two Way' ? (
                <Ionicons name="swap-vertical" size={20} color={"#000000"} style={{ marginRight: 300 }} />
              ) : (
                <Ionicons name="arrow-down" size={20} color={"#000000"} style={{ marginRight: 300 }} />
              )}
            </View>

            <View style={styles.locationRow}>
              <FontAwesome5 name="map-marker-alt" size={20} color={primaryColor} />
              <TextInput
                style={styles.locationInput}
                value={request.dropoff}
                onChangeText={(text) => setRequest({ ...request, dropoff: text })}
                placeholder="Dropoff location"
                editable={false}
                selectTextOnFocus={false}
                multiline={true}
                numberOfLines={2}
                textAlignVertical="top"
              />
              {routeType === 'Two Way' ? (
                <TouchableOpacity onPress={() => showPicker('dropoff')}>
                  <Text style={styles.timeText}>{formatTime(dropOffTime)}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.timeTextInactive}>  </Text>
              )}
            </View>
            <Text style={styles.distanceText}>
              Distance: {isNaN(distanceKm) ? 'N/A' : distanceKm.toFixed(1)} km
            </Text>
          </View>

          {/* Time Pickers */}
          <DateTimePickerModal
            isVisible={showTimePicker}
            mode="time"
            onConfirm={(date) => handleTimeChange({ type: 'set' }, date)}
            onCancel={() => setShowTimePicker(false)}
            date={activeTimePickerFor === 'pickup' ? pickupTime : dropOffTime}
            buttonTextColorIOS={primaryColor}
            accentColor={primaryColor}
            themeVariant="light"
            customHeaderIOS={() => (
              <View style={{
                backgroundColor: primaryColor,
                padding: 15,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10
              }}>
                <Text style={{ color: 'white', fontSize: 48, fontWeight: 'bold' }}>
                  {activeTimePickerFor === 'pickup' ? 'Pick Pickup Time' : 'Pick Dropoff Time'}
                </Text>
              </View>
            )}
          />

          {Platform.OS === 'android' && showAndroidPicker && (
            <DateTimePicker
              value={activeTimePickerFor === 'pickup' ? pickupTime : dropOffTime}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
              textColor={primaryColor}
              themeVariant="light"
              style={styles.androidPicker}
            />
          )}

          {/* Seats Needed */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Seats Needed <Text style={{ color: "#c61a09" }}>*</Text>
            </Text>
            <View style={styles.pickerField}>
              <Picker
                selectedValue={request.seatsNeeded}
                onValueChange={(itemValue) => setRequest({ ...request, seatsNeeded: itemValue })}
                style={styles.picker}
                dropdownIconColor="#D64584"
              >
                {[1, 2, 3, 4].map((num) => (
                  <Picker.Item
                    key={num}
                    label={num.toString()}
                    value={num.toString()}
                    color="#050505"
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Date */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text>{request.date.toLocaleDateString()}</Text>
                <MaterialIcons name="calendar-today" size={20} color="#D64584" />
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={request.date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              themeVariant="light"
              textColor="#D64584"
              accentColor="#D64584"
              style={styles.pickerStyle}
              positiveButton={{ label: 'OK', textColor: '#D64584' }}
              negativeButton={{ label: 'Cancel', textColor: '#D64584' }}
            />
          )}

          {/* Fare Breakdown */}
          {fareDetails && fareDetails.breakdown && (
            <View style={styles.fareCard}>
              <Text style={styles.fareHeader}>Fare Summary</Text>

              <View style={styles.fareRow}>
                <Text>Distance:</Text>
                <Text>{distanceKm?.toFixed(1)} km</Text>
              </View>

              <View style={styles.fareRow}>
                <Text>Final Fare (Per Person/day):</Text>
                <Text>{fareDetails.finalFare} PKR</Text>
              </View>

              <View style={[styles.fareRow, { marginTop: 6 }]}>
                <Text>Total Fare for {fareDetails.breakdown.seats} Seat(s):</Text>
                <Text>{fareDetails.totalFare} PKR</Text>
              </View>
            </View>
          )}


          {/* Recurring */}
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Recurring Ride</Text>
            <Switch
              value={request.recurring}
              onValueChange={(value) => setRequest({ ...request, recurring: value })}
              trackColor={{ false: "#767577", true: "#D64584" }}
              thumbColor={request.recurring ? "#fff" : "#f4f3f4"}
            />
          </View>

          {request.recurring && (
            <View style={styles.daysContainer}>
              <Text style={styles.smallLabel}>Select days:</Text>
              <View style={styles.daysRow}>
                {days.map(day => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      request.daysOfWeek.includes(day) && styles.dayButtonSelected
                    ]}
                    onPress={() => toggleDaySelection(day)}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      request.daysOfWeek.includes(day) && styles.dayButtonTextSelected
                    ]}>
                      {day.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Ride Preferences Toggle */}
          <TouchableOpacity
            style={styles.preferencesHeader}
            onPress={() => setExpandedPreferences(!expandedPreferences)}
          >
            <Text style={styles.preferencesHeaderText}>Ride Preferences</Text>
            <MaterialIcons
              name={expandedPreferences ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={24}
              color="#555"
            />
          </TouchableOpacity>

          {expandedPreferences && (
            <>
              {/* Smoking Preference */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Smoking Preference</Text>
                <Picker
                  selectedValue={request.smoking}
                  onValueChange={(itemValue) => setRequest({ ...request, smoking: itemValue })}
                  style={styles.picker}
                  dropdownIconColor="#D64584"
                >
                  <Picker.Item label="No preference" value="no-preference" />
                  <Picker.Item label="Smoking Not Allowed" value="Smoking Not Allowed" />
                  <Picker.Item label="Smoking Allowed" value="Smoking Allowed" />
                </Picker>
              </View>

              {/* Music Preference */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Music Preference</Text>
                <Picker
                  selectedValue={request.music}
                  onValueChange={(itemValue) => setRequest({ ...request, music: itemValue })}
                  style={styles.picker}
                  dropdownIconColor="#D64584"
                >
                  <Picker.Item label="No preference" value="no-preference" />
                  <Picker.Item label="Quiet ride" value="Quiet ride" />
                  <Picker.Item label="Music OK" value="Music Ok!" />
                </Picker>
              </View>

              {/* Conversation Preference */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Conversation</Text>
                <Picker
                  selectedValue={request.conversation}
                  onValueChange={(itemValue) => setRequest({ ...request, conversation: itemValue })}
                  style={styles.picker}
                  dropdownIconColor="#D64584"
                >
                  <Picker.Item label="No preference" value="no-preference" />
                  <Picker.Item label="Quiet Ride" value="Quiet Ride" />
                  <Picker.Item label="Friendly Chat" value="Friendly Chat" />
                </Picker>
              </View>

              {/* Luggage */}
              <View style={styles.switchContainer}>
                <Text style={styles.label}>Have Luggage</Text>
                <Switch
                  value={request.luggage}
                  onValueChange={(value) => setRequest({ ...request, luggage: value })}
                  trackColor={{ false: "#767577", true: "#D64584" }}
                  thumbColor={request.luggage ? "#fff" : "#f4f3f4"}
                />
              </View>
            </>
          )}

          {/* Special Requests */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Special Requests</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={request.specialRequests}
              onChangeText={(text) => setRequest({ ...request, specialRequests: text })}
              placeholder="Any special requirements or notes for the driver"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Save Profile */}
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Save Profile</Text>
            <Switch
              value={saveProfile}
              onValueChange={(value) => setSaveProfile(value)}
              trackColor={{ false: "#767577", true: "#D64584" }}
              thumbColor={saveProfile ? "#fff" : "#f4f3f4"}
            />
          </View>

        </ScrollView>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={submitRequest}
          disabled={isSubmitting || isCalculating}
        >
          {isSubmitting || isCalculating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  contentContainer: { padding: 20, paddingBottom: 40 },
  statusBar: {
    height: Constants.statusBarHeight,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 26,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    marginTop: -12,
    color: 'black',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 8,
    marginLeft: 64,
    marginRight: 64,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: lightGrey,
    backgroundColor: lightGrey,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  toggleButtonRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  toggleButtonActiveLeft: {
    backgroundColor: primaryColor,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  toggleButtonActiveRight: {
    backgroundColor: primaryColor,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  toggleButtonText: {
    fontSize: 16,
    color: 'black',
  },
  toggleButtonTextActive: {
    color: 'white',
  },
  officeReportTime: {
    alignSelf: 'flex-end',
    marginTop: 24,
    marginRight: 4,
    fontSize: 12,
    color: 'gray',
  },
  locationCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: lightGrey,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  locationInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: 'black',
    paddingVertical: 0,
  },
  timeText: {
    fontSize: 16,
    color: 'gray',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  timeTextInactive: {
    fontSize: 16,
    color: 'lightgray',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  directionArrowContainer: {
    alignItems: 'center',
    marginVertical: 4,
    borderLeftWidth: 1,
    borderLeftColor: lightGrey,
    height: 30,
    marginLeft: 10,
    paddingLeft: 5,
  },
  inputGroup: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: lightGrey,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  label: { fontSize: 14, marginBottom: 8, color: '#555', fontWeight: '500' },
  smallLabel: { fontSize: 12, marginBottom: 8, color: '#777' },
  input: { height: 40, fontSize: 16 },
  multilineInput: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40
  },
  pickerField: {
    height: 50,
    borderColor: '#D64584',
    borderWidth: 1,
    borderRadius: 5,
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#050505',
  },
  pickerStyle: {
    backgroundColor: 'white',
    ...Platform.select({
      android: {
        color: '#D64584',
      },
    }),
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  daysContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center'
  },
  dayButtonSelected: {
    backgroundColor: '#D64584',
    borderColor: '#D64584'
  },
  dayButtonText: {
    fontSize: 12,
    color: '#555'
  },
  dayButtonTextSelected: {
    color: 'white'
  },
  preferencesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  preferencesHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50'
  },
  fareCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    marginBottom: 15,

    elevation: 2
  },
  fareHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4
  },
  totalFareText: {
    fontWeight: 'bold',
    fontSize: 16
  },
  submitButton: {
    backgroundColor: primaryColor,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default CarpoolProfile;