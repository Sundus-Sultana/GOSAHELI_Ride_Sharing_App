// CarpoolStatusScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, Image, StatusBar,
  ActivityIndicator,Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons ,FontAwesome5} from '@expo/vector-icons';
import { getCarpoolRequestsByPassenger,deleteCarpoolRequest,API_URL } from '../../api';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import { getUserById } from '../utils/ApiCalls';

const primaryColor = '#D64584';
const darkGrey = '#333';

const CarpoolStatusScreen = ({ route }) => {
  const { userId, passengerId ,price} = route.params || {};
console.log("Price:", price);
const navigation = useNavigation(); 
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
   const [selectedTab, setSelectedTab] = useState('upcoming');
  const [rides, setRides] = useState({
    upcoming: [],
    completed: [],
    cancelled: [],
    pending: [],
    accepted:[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRides();
  }, []);
  useEffect(() => {
  if (selectedTab === 'accepted') {
    fetchAcceptedRides(); // fetch only when selected
  }
}, [selectedTab]);

const handleChatPress = async (requestId, driverUserId, driverName, driverPhoto) => {
  try {
    setLoading(true);
    
    // Get passenger details
    const passengerDetails = await getUserById(userId);
    if (!passengerDetails) {
      Alert.alert("Error", "Could not load your passenger info");
      return;
    }

    // Get driver details
    const driverDetails = await getUserById(driverUserId);
    if (!driverDetails) {
      Alert.alert("Error", "Could not load driver info");
      return;
    }

    navigation.navigate('ChatUI', {
      driverId: driverUserId,
      userId,
      chatRoomId: `chat_request_${requestId}`,
      currentUser: 'passenger',
      currentUserId: userId,
      currentUserName: passengerDetails.username,
      currentUserPhoto: passengerDetails.photo_url,
      receiverUserId: driverUserId,
      receiverUserName: driverName,
      receiverUserPhoto: driverPhoto
    });

  } catch (err) {
    console.error('Error opening chat:', err);
    Alert.alert("Error", "Failed to open chat");
  } finally {
    setLoading(false);
  }
};

  const fetchAcceptedRides = async () => {
  try {
const res = await fetch(`${API_URL}/api/carpool/accepted-requests/${passengerId}`);
    const json = await res.json();
     console.log("Accepted rides data:", json.data); 

    if (json.success) {
      setRides(prev => ({ ...prev, accepted: json.data }));
    } else {
      Alert.alert("Error", json.message || "Could not fetch accepted rides");
    }
  } catch (err) {
    console.error("Fetch accepted rides error:", err);
  }
};


  const handleDelete = async (requestId) => {
  Alert.alert(
    'Confirm Deletion',
    'Are you sure you want to delete this ride?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            setIsDeleting(true);              // ✅ Moved here
            setDeletingId(requestId);         // ✅ Moved here

            const response = await deleteCarpoolRequest(requestId);

            if (response.success) {
              await fetchRides();
              Alert.alert('Success', response.message || 'Carpool Request deleted successfully');
            } else {
              Alert.alert('Error', response.message || 'Failed to delete carpool');
            }
          } catch (error) {
            console.error('Delete error:', error);
            Alert.alert(
              'Error',
              error.response?.data?.message ||
              error.message ||
              'Failed to delete ride'
            );
          } finally {
            setIsDeleting(false);             // ✅ Will now properly reset spinner
            setDeletingId(null);
          }
        },
        style: 'destructive'
      },
    ],
    { cancelable: true }
  );
};


  const fetchRides = async () => {
    try {
      const res = await getCarpoolRequestsByPassenger(passengerId);
      const allRides = res.data || [];

      const categorized = {
        upcoming: [],
        completed: [],
        cancelled: [],
        pending: [],
        accepted:[]
      };

      const today = new Date();

      allRides.forEach((ride) => {
        const rideDate = new Date(ride.date);
        const status = (ride.status || '').toLowerCase();

        if (status === 'cancelled') {
          categorized.cancelled.push(ride);
        } else if (status === 'completed') {
          categorized.completed.push(ride);
        } else if (status === 'pending') {
          categorized.pending.push(ride);
        } else if (rideDate >= today) {
          categorized.upcoming.push(ride);
        }
      });

      setRides(categorized);
    } catch (error) {
      console.error('Failed to fetch ride requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <View style={[styles.badge, { backgroundColor: '#4CAF50' }]}><Text style={styles.badgeText}>Confirmed</Text></View>;
      case 'pending':
        return <View style={[styles.badge, { backgroundColor: '#FFC107' }]}><Text style={styles.badgeText}>Pending</Text></View>;
      case 'cancelled':
        return <View style={[styles.badge, { backgroundColor: '#f44336' }]}><Text style={styles.badgeText}>Cancelled</Text></View>;
      default:
        return null;
    }
  };

  const renderRecurringDays = (recurringDays) => {
    if (!recurringDays) return null;
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
        {recurringDays.split(',').map((day, index) => (
          <View key={index} style={styles.dayCircle}>
            <Text style={styles.dayText}>{day.slice(0, 3)}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderCard = ({ item }) => {
    const formattedDate = moment(item.date).format('DD-MM-YYYY');
    const pickupTime = moment(item.pickup_time, 'HH:mm:ss').format('hh:mm A');
    const dropoffTime = item.dropoff_time ? moment(item.dropoff_time, 'HH:mm:ss').format('hh:mm A') : null;
    // Inside renderCard function
const displayFare = item.fare ? `Rs ${item.fare}` : 'fare not set';
    const lower = (str) => (str || '').toLowerCase();

   const showPreferences =
  (item.smoking_preference && lower(item.smoking_preference) !== 'no preference') ||
  (item.music_preference && lower(item.music_preference) !== 'no preference') ||
  (item.conversation_preference && lower(item.conversation_preference) !== 'no requirements') ||
  item.allows_luggage;

const preferences = [];

if (item.smoking_preference && lower(item.smoking_preference) !== 'no-preference') {
  preferences.push({
    icon: <MaterialIcons name="smoking-rooms" size={16} color={primaryColor} />,
    label: `Smoking: ${item.smoking_preference}`
  });
}
if (item.music_preference && lower(item.music_preference) !== 'no-preference') {
  preferences.push({
    icon: <Ionicons name="musical-notes" size={16} color={primaryColor} />,
    label: `Music: ${item.music_preference}`
  });
}
if (item.conversation_preference && lower(item.conversation_preference) !== 'no-preference' && lower(item.conversation_preference) !== 'no requirements') {
  preferences.push({
    icon: <Ionicons name="chatbubble-ellipses" size={16} color={primaryColor} />,
    label: `Conversation: ${item.conversation_preference}`
  });
}
if (item.allows_luggage) {
  preferences.push({
    icon: <FontAwesome5 name="suitcase-rolling" size={16} color={primaryColor} />,
    label: 'Luggage Allowed'
  });
}



    const isTwoWay = lower(item.route_type) === 'two way';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardDate}>DATE START:  {formattedDate}</Text>
          {renderStatusBadge(item.status)}
        </View>

        {/* Pickup Row */}
        <View style={styles.routeRow}>
          <View style={styles.routeDot} />
          <Text style={styles.locationText}>
            <Text style={styles.locationLabel}>Pickup: </Text>
            {item.pickup_location}
          </Text>
          <Text style={styles.timeText}>{pickupTime}</Text>
        </View>

        {/* Arrow Between */}
        <View style={{ alignItems: 'start', marginVertical: 4 }}>
          <Ionicons
            name={isTwoWay ? 'swap-vertical' : 'arrow-down'}
            size={20}
            color='#555'
          />
        </View>

        {/* Dropoff Row */}
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: primaryColor }]} />
          <Text style={styles.locationText}>
            <Text style={styles.locationLabel}>Dropoff: </Text>
            {item.dropoff_location}
          </Text>
          {dropoffTime && <Text style={styles.timeText}>{dropoffTime}</Text>}
        </View>

        {/* Recurring Days */}
        {renderRecurringDays(item.recurring_days)}

        {/* Seats */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          
          <Text style={{ fontWeight: '400', color: '#555'}}>Passengers: <Text style={{ fontWeight: '600', color: darkGrey,fontSize:22 }}>   {item.seats}<Ionicons name="woman" size={24} color={primaryColor} style={{ marginRight: 4 }} /></Text></Text>
        </View>

        {/* Preferences */}
       {preferences.length > 0 && (
  <View style={{ marginTop: 8 }}>
    {preferences.map((pref, index) => (
      <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        {pref.icon}
        <Text style={{ fontSize: 13, color: '#555', marginLeft: 6 }}>{pref.label}</Text>
      </View>
    ))}
  </View>
)}

 {/* Driver Info - Moved outside footer and styled differently */}
      {selectedTab === 'accepted' && item.driver_name && (
  <View style={styles.driverInfoContainer}>
    <Image
      source={{ 
        uri: item.driver_photo.startsWith('/') 
          ? `${API_URL}${item.driver_photo}`
          : `${API_URL}/uploads/${item.driver_photo}`
      }}
      style={styles.driverImage}
      onError={(e) => console.log("Image loading error:", e.nativeEvent.error)}
      defaultSource={require('../../assets/empty_avatar.jpg')}
    />
    <View style={{ flex: 1 }}>
      <Text style={styles.driverName}>{item.driver_name}</Text>
      <Text style={styles.vehicleInfo}>
        {item.color ? `${item.color} ` : ''}
        {item.VehicleModel || 'No vehicle info'}
        {item.PlateNumber ? ` (${item.PlateNumber})` : ''}
      </Text>
    </View>
    <TouchableOpacity
  onPress={() => handleChatPress(
    item.RequestID,
    item.driver_user_id,
    item.driver_name,
    item.driver_photo
  )}
  style={styles.chatButton}
>
  <Ionicons name="chatbubble-ellipses-outline" size={24} color={primaryColor} />
</TouchableOpacity>
  </View>
)}

          {/* Footer */}
      <View style={styles.cardFooter}>
        {item.status?.toLowerCase() !== 'completed' && item.status?.toLowerCase() !== 'cancelled' && (
          <TouchableOpacity
            onPress={() => handleDelete(item.RequestID)}
            style={styles.iconButton}
            disabled={isDeleting && deletingId === item.RequestID}
          >
            {isDeleting && deletingId === item.RequestID ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={primaryColor} />
            )}
          </TouchableOpacity>
        )}
        
        <Text style={[styles.actionButtonText, { color: primaryColor }]}>
          Fare (per day): {displayFare}
        </Text>
      </View>

      
    </View>
  );
};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Carpools</Text>
        <TouchableOpacity>
          <MaterialIcons name="notifications-none" size={24} color={darkGrey} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {['upcoming', 'pending','accepted', 'completed', 'cancelled'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            {selectedTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={rides[selectedTab]}
keyExtractor={(item, index) => `${item.RequestID || item.requestid}-${index}`}
          renderItem={renderCard}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Image source={require('../../assets/bg.png')} style={styles.emptyImage} />
              <Text style={styles.emptyTitle}>No {selectedTab} rides</Text>
              <Text style={styles.emptySubtitle}>When you have {selectedTab} rides, they'll appear here</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  headerTitle: { fontSize: 22, fontWeight: '600', color: darkGrey },
  tabRow: {
    flexDirection: 'row', justifyContent: 'space-around', marginTop: 10,
    borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  tab: { paddingVertical: 15, alignItems: 'center', width: '25%' },
  activeTab: { position: 'relative' },
  tabText: { color: '#666', fontWeight: '500', fontSize: 14 },
  activeTabText: { color: primaryColor, fontWeight: '600' },
  tabIndicator: { position: 'absolute', bottom: 0, height: 3, width: '100%', backgroundColor: primaryColor },
  listContent: { paddingHorizontal: 15, paddingBottom: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, marginVertical: 8, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
    shadowRadius: 4, elevation: 3, borderWidth: 1, borderColor: '#eee'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardDate: { fontSize: 14, color: '#666', fontWeight: '500' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  routeRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8
  },
  routeDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50'
  },
  locationLabel: { fontWeight: '600', color: '#666' },
  locationText: { flex: 1, fontSize: 14, color: '#000', flexWrap: 'wrap' },
  timeText: { fontSize: 13, color: '#666' },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 16
  },
  iconButton: {
    padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#D64584'
  },
  actionButtonText: { fontWeight: '600', fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyImage: { width: 150, height: 150, marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: darkGrey, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
  dayCircle: {
    backgroundColor: primaryColor, paddingVertical: 6, paddingHorizontal: 6,
    borderRadius: 20, marginRight: 6, marginTop: 4
  },
  dayText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingBottom: 10, 
  },
  
  driverInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },

  driverImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },

  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: darkGrey,
  },

  vehicleInfo: {
    fontSize: 14,
    color: '#666',
  },
  chatButton: {
  padding: 8,
  marginLeft: 10,
},
});


export default CarpoolStatusScreen;