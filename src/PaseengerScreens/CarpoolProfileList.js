import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal,
  StyleSheet, ActivityIndicator, ScrollView
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { getUserCarpoolProfiles } from '../../api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
const primaryColor = '#D64584';

const CarpoolProfileList = ({ route }) => {
  const { userId } = route.params || {};
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);


  const formatTime = (timeStr) => {
  if (!timeStr) return 'N/A';
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(+hours);
  date.setMinutes(+minutes);
  return date.toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};


  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const result = await getUserCarpoolProfiles(userId);
        setProfiles(result.data || []);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  const renderCard = ({ item }) => {
    const isTwoWay = item.route_type === 'Two Way';
    const recurringDays = item.recurring_days?.split(',').filter(Boolean) || [];

    return (
        
      <View style={styles.card}>
        {/* Pickup Location + Time */}
        <View style={styles.row}>
          <FontAwesome5 name="dot-circle" size={20} color={primaryColor} />
          <Text style={styles.text}>{item.pickup_location}</Text>
<Text style={styles.timeRight}>{formatTime(item.pickup_time)}</Text>
        </View>

        {/* Arrow */}
        <View style={styles.arrowRow}>
          <Ionicons
            name={isTwoWay ? 'swap-vertical' : 'arrow-down'}
            size={20}
            color={'#555'}
          />
        </View>

        {/* Dropoff Location + Time */}
        <View style={styles.row}>
          <FontAwesome5 name="map-marker-alt" size={20} color={primaryColor} />
          <Text style={styles.text}>{item.dropoff_location}</Text>
          {isTwoWay && (
<Text style={styles.timeRight}>{formatTime(item.dropoff_time)}</Text>
          )}
        </View>

        {/* Days */}
        {recurringDays.length > 0 && (
          <View style={styles.daysContainer}>
            {recurringDays.map((day, index) => (
              <View key={index} style={styles.dayBadge}>
                <Text style={styles.dayText}>{day.trim()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* See Full */}
        <TouchableOpacity onPress={() => setSelectedProfile(item)} style={styles.seeFullBtn}>
          <Text style={styles.seeFullText}>See Full</Text>
        </TouchableOpacity>
      </View>
    );
  };

const renderModal = () => {
  if (!selectedProfile) return null;

  const {
    route_type,
    pickup_location,
    dropoff_location,
    pickup_time,
    dropoff_time,
    recurring_days,
    date,
    smoking_preference,
    music_preference,
    conversation_preference,
    allows_luggage,
    is_recurring,
    special_requests
  } = selectedProfile;

  const isTwoWay = route_type === 'Two Way';

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(+hours);
    date.setMinutes(+minutes);
    return date.toLocaleTimeString('en-PK', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const shortDays = recurring_days?.split(',').map(day => day.trim().slice(0, 3)) || [];

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.modalContentWrapper}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Route type badge */}
            <View style={styles.routeTypeBadge}>
              <Text style={styles.routeTypeText}>{route_type || 'One Way'}</Text>
            </View>

            {/* Route Card */}
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>Route</Text>

              {pickup_location && (
                <View style={styles.row}>
                  <FontAwesome5 name="dot-circle" size={18} color={primaryColor} />
                  <Text style={styles.text}>{pickup_location}</Text>
                  {pickup_time && <Text style={styles.timeRight}>{formatTime(pickup_time)}</Text>}
                </View>
              )}

              <View style={styles.arrowRow}>
                <Ionicons
                  name={isTwoWay ? 'swap-vertical' : 'arrow-down'}
                  size={20}
                  color={'#555'}
                />
              </View>

              {dropoff_location && (
                <View style={styles.row}>
                  <FontAwesome5 name="map-marker-alt" size={18} color={primaryColor} />
                  <Text style={styles.text}>{dropoff_location}</Text>
                  {isTwoWay && dropoff_time && (
                    <Text style={styles.timeRight}>{formatTime(dropoff_time)}</Text>
                  )}
                </View>
              )}
            </View>

            {/* Days */}
            {shortDays.length > 0 && (
              <View style={[styles.card, { marginTop: 16 }]}>
                <Text style={styles.sectionHeading}>Days</Text>
                <View style={styles.daysContainer}>
                  {shortDays.map((day, idx) => (
                    <View key={idx} style={styles.dayBadge}>
                      <Text style={styles.dayText}>{day}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Start Date */}
            {date && (
              <View style={[styles.card, { marginTop: 16 }]}>
                <Text style={styles.sectionHeading}>Start Date</Text>
                <Text style={styles.modalText}>{formatDate(date)}</Text>
              </View>
            )}

            {/* Preferences */}
            <View style={[styles.card, { marginTop: 16 }]}>
              <Text style={styles.sectionHeading}>Preferences</Text>
              {smoking_preference && (
                <Text style={styles.modalText}>🚬 Smoking: {smoking_preference}</Text>
              )}
              {music_preference && (
                <Text style={styles.modalText}>🎵 Music: {music_preference}</Text>
              )}
              {conversation_preference && (
                <Text style={styles.modalText}>🗣️ Conversation: {conversation_preference}</Text>
              )}
              <Text style={styles.modalText}>🧳 Luggage: {allows_luggage ? 'Allowed' : 'Not Allowed'}</Text>
              <Text style={styles.modalText}>🔁 Recurring: {is_recurring ? 'Yes' : 'No'}</Text>
            </View>

            {/* Special Requests */}
            {special_requests && (
              <View style={[styles.card, { marginTop: 16 }]}>
                <Text style={styles.sectionHeading}>Special Request</Text>
                <Text style={styles.modalText}>{special_requests}</Text>
              </View>
            )}
          </ScrollView>

          {/* Fixed Close Button */}
          <TouchableOpacity onPress={() => setSelectedProfile(null)} style={styles.closeBtnFixed}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};




  if (loading) return <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 50 }} />;

 return (
  <SafeAreaView style={styles.safeArea}>
    <StatusBar backgroundColor={primaryColor} barStyle="light-content" />
    <View style={styles.container}>
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.carpool_profile_id.toString()}
        renderItem={renderCard}
        contentContainerStyle={{ padding: 20 }}
      />
      {renderModal()}
    </View>
  </SafeAreaView>
);
};

const styles = StyleSheet.create({
      safeArea: {
  flex: 1,
  backgroundColor: "#fff", // To match your header background
},
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  arrowRow: {
    alignItems: 'left',
    marginVertical: 4,
    marginLeft: 24,
  },
  text: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    maxWidth: '60%',
  },
  timeRight: {
    marginLeft: 'auto',
    fontSize: 14,
    color: '#555',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  dayBadge: {
    backgroundColor: primaryColor,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  dayText: {
    color: '#fff',
    fontSize: 13,
  },
  seeFullBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
    backgroundColor: primaryColor,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  seeFullText: { color: '#fff', fontSize: 14 },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
     padding: 20,
  paddingBottom: 80,
  },
  modalContentWrapper: {
  flex: 1,
  backgroundColor: 'white',
  margin: 20,
  borderRadius: 10,
  overflow: 'hidden',
},
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: primaryColor,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 6,
    color: '#333',
  },
  routeTypeBadge: {
  backgroundColor: primaryColor,
  alignSelf: 'center',
  paddingVertical: 6,
  paddingHorizontal: 16,
  borderRadius: 20,
  marginBottom: 16,
},
routeTypeText: {
  color: '#fff',
  fontSize: 14,
  fontWeight: 'bold',
  textTransform: 'uppercase',
},
bold: {
  fontWeight: 'bold',
},
  closeBtn: {
    backgroundColor: primaryColor,
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  sectionHeading: {
  fontSize: 16,
  fontWeight: 'bold',
  color: primaryColor,
  marginBottom: 8,
},
routeTypeBadge: {
  backgroundColor: primaryColor,
  alignSelf: 'center',
  paddingVertical: 6,
  paddingHorizontal: 16,
  borderRadius: 20,
  marginBottom: 16,
},
routeTypeText: {
  color: '#fff',
  fontSize: 14,
  fontWeight: 'bold',
  textTransform: 'uppercase',
},
closeBtnFixed: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: primaryColor,
  padding: 15,
  marginBottom:0.3,
  alignItems: 'center',
  borderRadius:12
},
  closeBtnText: { color: 'white', fontWeight: 'bold' },
});

export default CarpoolProfileList;
