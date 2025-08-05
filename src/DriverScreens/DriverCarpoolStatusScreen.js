import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView,
  LayoutAnimation, UIManager, Platform
} from 'react-native';
import { Ionicons ,MaterialIcons} from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { Alert, ToastAndroid } from 'react-native'; // Already imported mostly
import axios from 'axios';
import { API_URL } from '../../api';

const primaryColor = '#D64584';
const darkGrey = '#333';
const BlackColor='#000000'

const DriverCarpoolStatusScreen = ({ route }) => {
  const { driverId } = route.params;
  const [activeTab, setActiveTab] = useState('Requests');
  const [loading, setLoading] = useState(true);
  const [matchedRequests, setMatchedRequests] = useState([]);
  const [allPendingRequests, setAllPendingRequests] = useState([]);
  const [showMatchedOnly, setShowMatchedOnly] = useState(false);

  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

const handleAccept = (requestId) => {
  // Call your accept API or function here
  console.log('Accepted:', requestId);
  ToastAndroid.show('Request Accepted', ToastAndroid.SHORT);
};

const handleReject = (requestId) => {
  Alert.alert(
    "Confirm Rejection",
    "Are you sure you want to reject this request?",
    [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Reject",
        style: "destructive",
        onPress: () => {
          // Call your reject API or function here
          console.log('Rejected:', requestId);
          ToastAndroid.show('Request Rejected', ToastAndroid.SHORT);
        }
      }
    ],
    { cancelable: true }
  );
};


  useEffect(() => {
    if (activeTab === 'Requests') fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const [matchedRes, pendingRes] = await Promise.all([
        axios.get(`${API_URL}/api/driver/carpool/matched-requests-all/${driverId}`),
        axios.get(`${API_URL}/api/driver/carpool/all-pending-requests`)
      ]);
      setMatchedRequests(matchedRes.data.matched || []);
      setAllPendingRequests(pendingRes.data.allPending || []);
    } catch (e) {
      console.error('Error fetching requests:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderTab = (tabName) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tabName && styles.activeTab]}
      onPress={() => setActiveTab(tabName)}
    >
      <Text style={[styles.tabText, activeTab === tabName && styles.activeTabText]}>
        {tabName}
      </Text>
    </TouchableOpacity>
  );


  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB'); // DD-MM-YYYY
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-PK', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };


const renderRequestCard = (item, key, isMatched = false) => {
  const formattedDate = formatDate(item.date);
  const pickupTime = formatTime(item.pickup_time);
  const dropoffTime = formatTime(item.dropoff_time);
const routeType = (item.route_type || '').toLowerCase(); // "one way" or "two way"

  const specialReq = item.special_requests;
  const luggage = item.allows_luggage;
  const preferences = [
    { label: 'Smoking', value: item.smoking_preference },
    { label: 'Music', value: item.music_preference },
    { label: 'Conversation', value: item.conversation_preference },
  ].filter(pref => pref.value && pref.value !== 'no-preference');

  const renderStatusBadge = (status) => {
    let backgroundColor = '#999';
    let label = status?.toUpperCase();

    if (status === 'matched') {
      backgroundColor = '#4CAF50';
      label = 'MATCHED';
    } else if (status === 'pending') {
      backgroundColor = isMatched ? '#17A2B8' : '#FFC107';
      label = isMatched ? 'REQUESTED' : 'PENDING';
    } else if (status === 'rejected') {
      backgroundColor = '#F44336';
      label = 'REJECTED';
    }

    return (
      <View style={[styles.badge, { backgroundColor }]}>
        <Text style={[
          styles.badgeText,
          label === 'REQUESTED' && {
            textShadowColor: '#00BFFF',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 6,
          }
        ]}>
          {label}
        </Text>
      </View>
    );
  };

  const dayAbbreviations = {
    Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
    Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun'
  };

  const renderRecurringDays = (days) => {
    if (!days) return null;
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
        {days.split(',').map((day, idx) => (
          <View key={idx} style={styles.dayCircle}>
            <Text style={styles.dayText}>{dayAbbreviations[day.trim()] || day}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.card} key={key}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>DATE START: {formattedDate}</Text>
        {renderStatusBadge(item.status)}
      </View>

      {/* Pickup */}
      <View style={styles.routeRow}>
        <View style={styles.routeDot} />
        <Text style={styles.locationText}>
          <Text style={styles.locationLabel}>Pickup: </Text>{item.pickup_location}
        </Text>
        <Text style={styles.timeText}>{pickupTime}</Text>
      </View>

      {/* Route Type */}
      <View style={{ alignItems: 'flex-start', marginVertical: 4 }}>
        <Ionicons
  name={routeType === 'two way' ? 'swap-vertical' : 'arrow-down'}
  size={20}
  color={BlackColor}
/>


      </View>

      {/* Dropoff */}
      <View style={styles.routeRow}>
        <View style={[styles.routeDot, { backgroundColor: primaryColor }]} />
        <Text style={styles.locationText}>
          <Text style={styles.locationLabel}>Dropoff: </Text>{item.dropoff_location}
        </Text>
        {dropoffTime && <Text style={styles.timeText}>{dropoffTime}</Text>}
      </View>

      {/* Recurring Days */}
      {renderRecurringDays(item.recurring_days)}

      {/* Passenger Info */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <Text style={{ fontWeight: '400', color: '#555' }}>
          Passengers:{" "}
          <Text style={{ fontWeight: '600', color: darkGrey, fontSize: 18 }}>
            {item.seats}
            <Ionicons name="woman" size={20} color={primaryColor} style={{ marginLeft: 4 }} />
          </Text>
        </Text>
      </View>

      {/* Preferences */}
    {preferences.length > 0 && (
  <View style={styles.preferenceContainer}>
    {preferences.map((pref, index) => {
      let IconComponent = Ionicons;
      let iconName = 'options-outline';

      if (pref.label === 'Smoking') {
        IconComponent = MaterialIcons;
        iconName = 'smoking-rooms';
      } else if (pref.label === 'Music') {
        iconName = 'musical-notes-outline';
      } else if (pref.label === 'Conversation') {
        iconName = 'chatbubble-ellipses-outline';
      }

      return (
        <View key={index} style={styles.preferenceRow}>
          <IconComponent
            name={iconName}
            size={18}
            color={primaryColor}
            style={styles.preferenceIcon}
          />
          <Text style={styles.preferenceLabel}>{pref.label}:</Text>
          <Text style={styles.preferenceValue}>{pref.value}</Text>
        </View>
      );
    })}
  </View>
)}



      {/* Luggage */}
      {luggage && (
        <View style={{ marginTop: 6 }}>
          <Text style={{ color: '#555' }}>
            <Text style={{ fontWeight: '600' }}>Allow Luggage:</Text> Yes
          </Text>
        </View>
      )}

      {/* Special Requirements */}
      {specialReq && (
        <View style={{ marginTop: 4 }}>
          <Text style={{ color: '#555' }}>
            <Text style={{ fontWeight: '600' }}>Special Requirements:</Text> {specialReq}
          </Text>
        </View>
      )}

      {/* Fare */}
      <View style={styles.cardFooter}>
        <Text style={[styles.actionButtonText, { color: primaryColor }]}>
          Fare (per day): {item.fare || 'N/A'}
        </Text>
      </View>
      {/* Accept / Reject Buttons */}
<View style={styles.actionsRow}>
  <TouchableOpacity
    style={styles.actionButton}
    activeOpacity={0.8}
    onPress={() => handleAccept(item.RequestID)}
  >
    <Text style={styles.acceptButtonText}>Accept</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.actionButton, styles.rejectButton]}
    activeOpacity={0.8}
    onPress={() => handleReject(item.RequestID)}
  >
    <Text style={styles.rejectButtonText}>Reject</Text>
  </TouchableOpacity>
</View>

</View>

  );
};



  const renderRequests = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 50 }} />;
    }

    const matchedIds = new Set(matchedRequests.map(req => String(req.RequestID)));
    const filteredPending = allPendingRequests.filter(
      req => !matchedIds.has(String(req.RequestID))
    );

    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Matched Requests */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-circle-outline" size={20} color={primaryColor} />
            <Text style={styles.sectionHeaderText}>
              Matched Requests ({matchedRequests.length})
            </Text>
          </View>
          {matchedRequests.length === 0 ? (
            <Text style={styles.emptyText}>No matching requests found.</Text>
          ) : (
            matchedRequests.map((req) => renderRequestCard(req, req.RequestID, true))
          )}
        </View>

        {/* Pending Requests */}
        {!showMatchedOnly && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color="#FF8C00" />
              <Text style={styles.sectionHeaderText}>
                Pending Requests ({filteredPending.length})
              </Text>
            </View>
            {filteredPending.length === 0 ? (
              <Text style={styles.emptyText}>No pending requests.</Text>
            ) : (
              filteredPending.map((req) => renderRequestCard(req, req.RequestID, false)))}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={primaryColor} barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          {renderTab('Requests')}
          {renderTab('Accepted')}
          {renderTab('Rejected')}
          {renderTab('Completed')}
        </View>

        {/* Filter Toggle */}
        <View style={styles.filterToggleContainer}>
          <TouchableOpacity
            style={[styles.filterToggleButton, !showMatchedOnly && styles.activeFilterButton]}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowMatchedOnly(false);
            }}
          >
            <Text style={[styles.filterToggleText, !showMatchedOnly && styles.activeFilterText]}>
              Show All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterToggleButton, showMatchedOnly && styles.activeFilterButton]}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowMatchedOnly(true);
            }}
          >
            <Text style={[styles.filterToggleText, showMatchedOnly && styles.activeFilterText]}>
              Matched Only
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'Requests' ? renderRequests() : (
          <View style={styles.placeholder}>
            <Ionicons name="car-sport-outline" size={50} color={primaryColor} />
            <Text style={styles.placeholderText}>No {activeTab.toLowerCase()} rides yet.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};


export default DriverCarpoolStatusScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    marginTop: 10,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  activeTab: {
    borderBottomColor: primaryColor,
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 16,
    color: darkGrey,
    fontWeight: '500',
  },
  activeTabText: {
    color: primaryColor,
    fontWeight: 'bold',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },


  filterToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    gap: 12
  },
  filterToggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
  },
  activeFilterButton: {
    backgroundColor: primaryColor,
    borderColor: primaryColor,
  },
  filterToggleText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
  },

  sectionBox: {
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    backgroundColor: '#f2f2f2',
  },

  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 6,
  },

  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: darkGrey,
    marginLeft: 8,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: darkGrey,
    marginBottom: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#eee'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  cardDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 8
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50'
  },
  locationLabel: {
    fontWeight: '600',
    color: '#666'
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    flexWrap: 'wrap'
  },
  timeText: {
    fontSize: 13,
    color: '#666'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 14
  },
  dayCircle: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: primaryColor,
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 6,
    marginRight: 6,
    marginTop: 4,

    // Glow effect
    shadowColor: primaryColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  },

  dayText: {
    color: primaryColor, fontSize: 10
  },
  preferenceContainer: {
  marginTop: 10,
  paddingVertical: 6,
  paddingHorizontal: 8,
  backgroundColor: '#ffffffff',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#EEE',
},

preferenceRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: 4,
},

preferenceIcon: {
  marginRight: 6,
},

preferenceLabel: {
  fontSize: 13,
  fontWeight: '600',
  color: '#444',
  marginRight: 4,
},

preferenceValue: {
  fontSize: 13,
  fontWeight: '500',
  color: '#666',
  flexShrink: 1,
},
actionsRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 16,
},

actionButton: {
  flex: 1,
  paddingVertical: 10,
  marginHorizontal: 6,
  borderRadius: 22,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: primaryColor,
  backgroundColor: '#fff',
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
},

acceptButtonText: {
  color: primaryColor,
  fontWeight: '600',
},

rejectButton: {
  borderColor: '#aaa',
  backgroundColor: '#f9f9f9',
},

rejectButtonText: {
  color: '#555',
  fontWeight: '600',
},



});
