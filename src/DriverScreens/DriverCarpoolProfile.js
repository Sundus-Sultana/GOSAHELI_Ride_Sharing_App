import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  ScrollView, TouchableOpacity, KeyboardAvoidingView,
  Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import Constants from 'expo-constants';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { saveCarpoolProfile } from '../../api';

const primaryColor = '#D64584';
const lightGrey = '#E0E0E0';

const DriverCarpoolProfile = ({ route }) => {
  const { userId, pickupLocation, dropoffLocation } = route.params || {};

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickupTime, setPickupTime] = useState(new Date());
  const [dropOffTime, setDropOffTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeTimePickerFor, setActiveTimePickerFor] = useState(null);
  const [routeType, setRouteType] = useState('Two Way');

  const [request, setRequest] = useState({
    pickup: '',
    dropoff: '',
    seatsAvailable: '3',
    date: new Date(),
    daysOfWeek: [],
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (route.params) {
      setRequest(prev => ({
        ...prev,
        pickup: route.params.pickupLocation || prev.pickup,
        dropoff: route.params.dropoffLocation || prev.dropoff
      }));
    }
  }, [route.params]);

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${formattedMinutes} ${ampm}`;
  };

  const handleTimeChange = (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate) {
      if (activeTimePickerFor === 'pickup') {
        setPickupTime(selectedDate);
      } else {
        setDropOffTime(selectedDate);
      }
    }
  };

  const showPicker = (forWhat) => {
    if (forWhat === 'dropoff' && routeType !== 'Two Way') return;
    setActiveTimePickerFor(forWhat);
    setShowTimePicker(true);
  };

  const toggleDaySelection = (day) => {
    setRequest(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const formatTimeForDB = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}:00`;
  };

  const submitRequest = async () => {
    const { pickup, dropoff, seatsAvailable, date, daysOfWeek } = request;
    if (!pickup || !dropoff || !seatsAvailable || !date) {
      Alert.alert("Error", "Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const profilePayload = {
        user_id: userId,
        pickup_location: pickup,
        dropoff_location: dropoff,
        seats: parseInt(seatsAvailable),
        date: date.toISOString().split('T')[0],
        pickup_time: formatTimeForDB(pickupTime),
        dropoff_time: routeType === 'Two Way' ? formatTimeForDB(dropOffTime) : null,
        recurring_days: daysOfWeek.join(','),
      };

      await saveCarpoolProfile(profilePayload);
      Alert.alert("Success", "Profile saved successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.statusBar} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create your Carpool Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Route Type */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, routeType === 'One Way' && styles.toggleButtonActiveLeft]}
            onPress={() => setRouteType('One Way')}
          >
            <Text style={[styles.toggleButtonText, routeType === 'One Way' && styles.toggleButtonTextActive]}>One Way</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, styles.toggleButtonRight, routeType === 'Two Way' && styles.toggleButtonActiveRight]}
            onPress={() => setRouteType('Two Way')}
          >
            <Text style={[styles.toggleButtonText, routeType === 'Two Way' && styles.toggleButtonTextActive]}>Two Way</Text>
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
              placeholder="Pickup location"
              editable={false}
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
              placeholder="Dropoff location"
              editable={false}
            />
            {routeType === 'Two Way' && (
              <TouchableOpacity onPress={() => showPicker('dropoff')}>
                <Text style={styles.timeText}>{formatTime(dropOffTime)}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <DateTimePickerModal
          isVisible={showTimePicker}
          mode="time"
          onConfirm={handleTimeChange}
          onCancel={() => setShowTimePicker(false)}
          date={activeTimePickerFor === 'pickup' ? pickupTime : dropOffTime}
        />

        {/* Seats Available */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Seats Available <Text style={{ color: "#c61a09" }}>*</Text></Text>
          <View style={styles.pickerField}>
            <Picker
              selectedValue={request.seatsAvailable}
              onValueChange={(val) => setRequest({ ...request, seatsAvailable: val })}
              style={styles.picker}
              dropdownIconColor="#D64584"
            >
              {[1, 2, 3, 4].map((n) => (
                <Picker.Item key={n} label={n.toString()} value={n.toString()} color="#050505" />
              ))}
            </Picker>
          </View>
        </View>

        {/* Day Picker Always Visible */}
        <View style={styles.daysContainer}>
          <Text style={styles.smallLabel}>Select days:</Text>
          <View style={styles.daysRow}>
            {days.map(day => (
              <TouchableOpacity
                key={day}
                style={[styles.dayButton, request.daysOfWeek.includes(day) && styles.dayButtonSelected]}
                onPress={() => toggleDaySelection(day)}
              >
                <Text style={[styles.dayButtonText, request.daysOfWeek.includes(day) && styles.dayButtonTextSelected]}>
                  {day.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.submitButton} onPress={submitRequest} disabled={isSubmitting}>
        <Text style={styles.submitButtonText}>{isSubmitting ? 'Submitting...' : 'Find Passenger'}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  contentContainer: { padding: 20, paddingBottom: 40 },
  statusBar: { height: Constants.statusBarHeight, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, height: 26,
    backgroundColor: '#F5F5F5', borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18, fontWeight: 'bold', marginLeft: 16,
    marginTop: -12, color: 'black',
  },
  toggleContainer: {
    flexDirection: 'row', alignSelf: 'center',
    marginTop: 8, marginLeft: 64, marginRight: 64,
    borderRadius: 8, overflow: 'hidden',
    borderWidth: 1, borderColor: lightGrey,
    backgroundColor: lightGrey,
  },
  toggleButton: {
    flex: 1, paddingVertical: 8, paddingHorizontal: 16,
    backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center',
  },
  toggleButtonRight: {
    borderTopRightRadius: 8, borderBottomRightRadius: 8,
  },
  toggleButtonActiveLeft: {
    backgroundColor: primaryColor, borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
  },
  toggleButtonActiveRight: {
    backgroundColor: primaryColor, borderTopRightRadius: 8, borderBottomRightRadius: 8,
  },
  toggleButtonText: { fontSize: 16, color: 'black' },
  toggleButtonTextActive: { color: 'white' },
  officeReportTime: { alignSelf: 'flex-end', marginTop: 24, marginRight: 4, fontSize: 12, color: 'gray' },
  locationCard: {
    backgroundColor: 'white', borderRadius: 8, marginTop: 8,
    marginBottom: 15, paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: lightGrey, elevation: 2,
  },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
  },
  locationInput: {
    flex: 1, marginLeft: 8, fontSize: 16, color: 'black',
  },
  timeText: {
    fontSize: 16, color: 'gray', paddingVertical: 4, paddingHorizontal: 8,
  },
  directionArrowContainer: {
    alignItems: 'center', marginVertical: 4,
    borderLeftWidth: 1, borderLeftColor: lightGrey,
    height: 30, marginLeft: 10, paddingLeft: 5,
  },
  inputGroup: {
    marginBottom: 16, backgroundColor: 'white',
    borderRadius: 8, padding: 12, borderWidth: 1, borderColor: lightGrey, elevation: 2,
  },
  label: { fontSize: 14, marginBottom: 8, color: '#555', fontWeight: '500' },
  pickerField: {
    height: 50, borderColor: '#D64584', borderWidth: 1,
    borderRadius: 5, justifyContent: 'center',
    overflow: 'hidden', marginBottom: 8,
  },
  picker: { height: 50, width: '100%', color: '#050505' },
  daysContainer: {
    backgroundColor: 'white', borderRadius: 8,
    padding: 12, marginBottom: 16
  },
  daysRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 8,
  },
  smallLabel: { fontSize: 12, marginBottom: 8, color: '#777' },
  dayButton: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: '#ddd',
    justifyContent: 'center', alignItems: 'center',
  },
  dayButtonSelected: { backgroundColor: '#D64584', borderColor: '#D64584' },
  dayButtonText: { fontSize: 12, color: '#555' },
  dayButtonTextSelected: { color: 'white' },
  submitButton: {
    backgroundColor: '#D64584', padding: 16, borderRadius: 8,
    alignItems: 'center', marginTop: 20, marginBottom: 50, marginHorizontal: 20,
  },
  submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default DriverCarpoolProfile;
