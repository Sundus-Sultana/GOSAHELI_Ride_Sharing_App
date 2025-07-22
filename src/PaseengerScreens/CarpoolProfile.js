import React, { useState, useEffect } from 'react';
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
import { saveCarpoolProfile } from '../../api';


const primaryColor = '#D64584';
const lightGrey = '#E0E0E0';

const CarpoolProfile = ({ route }) => {
  const { userId, pickupLocation, dropoffLocation } = route.params || {};
  const [saveProfile, setSaveProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    specialRequests: ''
  });

  const [expandedPreferences, setExpandedPreferences] = useState(false);
  const [routeType, setRouteType] = useState('Two Way');
  const [pickupTime, setPickupTime] = useState(new Date());
  const [dropOffTime, setDropOffTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeTimePickerFor, setActiveTimePickerFor] = useState(null);
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

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

    const { pickup, dropoff, seatsNeeded, date } = request;
    if (!pickup || !dropoff || !seatsNeeded || !date) {
      Alert.alert("Error", "Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (saveProfile) {
        const profilePayload = {
          UserID: userId,
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
          route_type: routeType
        };

        console.log('Sending payload:', profilePayload);
        const response = await saveCarpoolProfile(profilePayload);
        console.log('Server response:', response);
        Alert.alert("Success", "Profile saved successfully!");
      }
    } catch (error) {
      console.error('Full error details:', {
        message: error.message,
        config: error.config,
        response: error.response?.data
      });
      Alert.alert(
        "Error", 
        error.response?.data?.error || 
        error.response?.data?.message || 
        "Failed to save profile"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
       <View style={styles.statusBar} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create your Carpool Profile</Text>
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
            />
            {routeType === 'Two Way' ? (
              <TouchableOpacity onPress={() => showPicker('dropoff')}>
                <Text style={styles.timeText}>{formatTime(dropOffTime)}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timeTextInactive}>  </Text>
            )}
          </View>
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
                <Picker.Item label="No smoking" value="no-smoking" />
                <Picker.Item label="Smoking allowed" value="smoking-allowed" />
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
                <Picker.Item label="Quiet ride" value="quiet" />
                <Picker.Item label="Music OK" value="music-ok" />
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
                <Picker.Item label="Quiet ride" value="quiet" />
                <Picker.Item label="Chatting OK" value="chatting" />
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

      <TouchableOpacity
  style={styles.submitButton}
  onPress={submitRequest}
  disabled={isSubmitting}
>
  <Text style={styles.submitButtonText}>
    {isSubmitting ? 'Submitting...' : 'Find Carpool'}
  </Text>
</TouchableOpacity>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
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
  marginTop: -12,   // 👈 move text slightly upward
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
  submitButton: { 
  backgroundColor: '#D64584', 
  padding: 16, 
  borderRadius: 8, 
  alignItems: 'center', 
  marginTop: 20,
  marginBottom: 50,
  marginHorizontal: 20, // Add horizontal margin for better appearance
},
submitButtonText: { 
  color: 'white', 
  fontSize: 18, 
  fontWeight: 'bold' 
}

});

export default CarpoolProfile;