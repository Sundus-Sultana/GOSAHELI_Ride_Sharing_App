import React, { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Modal,
  Alert,
  Linking,
  Platform,BackHandler
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import Swiper from "react-native-swiper";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import MenuOverlay from "../components/MenuOverlay";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase/setup';
import { getRideHistory } from '../../api.js';
import SaheliLogo from '../../assets/IconWomen2.png';
import { getUserById ,getDriverById} from '../../api';
import { getNotifications, markNotificationsAsRead } from "../utils/ApiCalls.js";
import { ScrollView } from "react-native-gesture-handler";
import axios from 'axios'; // ✅ Make sure this is at the top
import { API_URL } from '../../api.js'; 
import { registerForPushNotificationsAsync } from '../utils/NotificationSetup'; // Adjust path if needed

const Home = ({ route }) => {
  const navigation = useNavigation();
  const [passengerId, setPassengerId] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('BookRide');
  const [rideHistory, setRideHistory] = useState([]);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [dbUser, setDbUser] = useState(null);

  // Always prioritize route.params.userId if provided
  const userId = route?.params?.userId ?? auth.currentUser?.uid;
  const userName = route?.params?.userName ?? auth.currentUser?.displayName;
  console.log('USERID IN Home SCREEN', userId);
  console.log('name IN Home SCREEN', userName);


    // Add this helper function to format time to PKT
  const formatToPktTime  = (timestamp) => {
  if (!timestamp) return 'Just now';
  
  const now = new Date();
  const pastDate = new Date(timestamp);
  const seconds = Math.floor((now - pastDate) / 1000);
  
  // Within last 24 hours
  if (seconds < 86400) {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  
  // Between 24-48 hours ago
  if (seconds < 172800) {
    return 'Yesterday';
  }
  
  // 2-6 days ago
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
  
  // More than 1 week ago - show actual date
  return pastDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};
  
  
  // Add this state to the component
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Add this useEffect to fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId) 
      return;
      try {
            console.log('Fetching notifications for user:', userId);
        const notifs = await getNotifications(userId);
      console.log('Notifications received:', notifs);
  
        setNotifications(notifs);
        const unread = notifs.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    
    fetchNotifications();
  }, [userId, notificationVisible]); // Refresh when notification overlay opens/closes
  
  const handleNotificationPress = async () => {
    setNotificationVisible(true);
    if (unreadCount > 0) {
            console.log('Marking notifications as read for user:', userId);
  
      try {
        await markNotificationsAsRead(userId);
        setUnreadCount(0);
        // Update local notifications to mark as read
        setNotifications(notifs => notifs.map(n => ({...n, isRead: true})));
      } catch (err) {
        console.error("Error marking notifications as read:", err);
      }
    }
  };

 useEffect(() => {
    const askForPushOnce = async () => {
      try {
        const userId = await AsyncStorage.getItem('UserID');
        const alreadyAsked = await AsyncStorage.getItem('PushPermissionAsked');

        if (!alreadyAsked && userId) {
          await registerForPushNotificationsAsync(userId);
          await AsyncStorage.setItem('PushPermissionAsked', 'true');
        } else {
          console.log('✅ Push permission already asked or userId missing');
        }
      } catch (err) {
        console.error('❌ Error checking push permission status:', err);
      }
    };

    askForPushOnce();
  }, []);

 useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert('Exit App', 'Do you want to exit?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove(); // ✅ Use `.remove()` instead
    }, [])
  );
  
  useEffect(() => {
  const fetchPassengerId = async () => {
    if (!userId) return;
    try {
      const response = await axios.get(`${API_URL}/api/get-passenger/${userId}`);
      if (response.data.passenger?.PassengerID) {
      const passengerId = response.data.passenger.PassengerID;
      setPassengerId(passengerId);
      console.log("PassengerID set in state:", passengerId);
      return passengerId;
    }
    return null;
    } catch (error) {
    if (error.response && error.response.status === 404) {
        // Passenger record not found — expected, so do nothing or just console log
        console.log("Passenger record not found (404) — user probably new, no action needed yet.");
      } else {
        // For other errors, log or alert
        console.error("Error fetching PassengerID:", error);
        Alert.alert("Error", "Unable to fetch PassengerID. Please try again.");
      }
    }
  };

  fetchPassengerId();
}, [userId]); // Dependency on userId




 const insertPassenger = async (id) => {
  console.log('🛫 insertPassenger() called with:', id); // <--- Add this
  try {
    const response = await axios.post(`${API_URL}/api/become-passenger`, { userId: id });
    console.log('✅ Passenger inserted or exists:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('⚠️ Backend error:', error.response.data);
    } else {
      console.log('❌ insertPassenger failed:', error.message);
    }
  }
};

const fetchPassengerIdAndNavigate = async () => {
  try {
    console.log("Calling:", `${API_URL}/api/get-passenger/${userId}`);
    const response = await axios.get(`${API_URL}/api/get-passenger/${userId}`);
    if (response.data.passenger?.PassengerID) {
      const passengerId = response.data.passenger.PassengerID;
      console.log("Fetched PassengerID:", passengerId);
       setPassengerId(passengerId); 
        console.log("set passenger ID:", passengerId);

      // Navigate after getting PassengerID
      navigation.navigate('Carpool', {
        userName: userName || auth.currentUser?.displayName || 'User',
        userEmail: auth.currentUser?.email,
        userId: userId,
        passengerId: passengerId,
        riderId: route.params?.userId
      });
    } else {
      Alert.alert("Error", "Passenger record not found.");
    }
  } catch (error) {
    console.error("Error fetching PassengerID:", error.response?.data || error.message);
    Alert.alert("Error", "Unable to fetch PassengerID. Please try again.");
  }
};


  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'PKR 0';
    return `PKR ${amount.toLocaleString('en-PK')}`;
  };

  // Fetch user from DB
useEffect(() => {
  const fetchUserData = async () => {
    if (!userId) return;
    try {
      const userFromDB = await getUserById(userId);
      if (userFromDB) {
        setDbUser(userFromDB); // Set user details for display or logic
        await insertPassenger(userId); // Insert into Passenger table if not exists
      }
    } catch (err) {
      console.error('Error fetching user by ID:', err);
    }
  };

  fetchUserData();
}, []);



  // Fetch ride history
  useEffect(() => {
    const fetchRideHistory = async () => {
      try {
        if (!userId) return;
        const history = await getRideHistory(userId);
        setRideHistory(history);
      } catch (error) {
        console.error('Error fetching ride history:', error);
      }
    };

    fetchRideHistory();
  }, [userId]);

 useEffect(() => {
  const checkRatingShown = async () => {
    const hasRatedBefore = await AsyncStorage.getItem(`ratingShown-${userId}`);
    if (!hasRatedBefore) {
      setTimeout(() => {
        setShowRating(true);
      }, 12000);
    }
  };
  checkRatingShown();
}, [userId]);



  const handleRating = (selectedRating) => {
    setRating(selectedRating);
  };

const fetchPassengerIdAndNavigateToSupport = async () => {
  try {
    console.log("Calling for support:", `${API_URL}/api/get-passenger/${userId}`);
    const response = await axios.get(`${API_URL}/api/get-passenger/${userId}`);
    if (response.data.passenger?.PassengerID) {
      const passengerId = response.data.passenger.PassengerID;
      console.log("Fetched PassengerID:", passengerId);
      setPassengerId(passengerId);

      // ✅ Navigate to Support screen
      navigation.navigate('Support', {
        userId: userId,
        passengerId: passengerId
      });
    } else {
      Alert.alert("Error", "Passenger record not found.");
    }
  } catch (error) {
    console.error("Error fetching PassengerID:", error.response?.data || error.message);
    Alert.alert("Error", "Unable to fetch PassengerID. Please try again.");
  }
};


  const submitRating = async () => {
  setHasRated(true);
  setShowRating(false);
  await AsyncStorage.setItem(`ratingShown-${userId}`, 'true');

  // 🔄 Send only RateValue and UserID
  try {
    const response = await axios.post(`${API_URL}/api/feedback`, {
      RateValue: rating,
      UserID: userId, // Firebase UID
    });

    console.log('✅ Feedback submitted:', response.data);
  } catch (error) {
    console.error('❌ Failed to submit feedback:', error.response?.data || error.message);
  }

  // 🎯 Handle rating > 3 logic
  if (rating > 3) {
    const appStoreUrl = Platform.OS === 'ios'
      ? 'itms-apps://itunes.apple.com/app/idYOUR_APP_ID?action=write-review'
      : 'market://details?id=YOUR_PACKAGE_NAME';
    Linking.openURL(appStoreUrl);
  } else {
    Alert.alert(
      'Thanks for your feedback!',
      'We appreciate your honesty. What could we improve?',
      [
        { text: 'Cancel', style: 'cancel' },
       { text: 'Give Feedback', onPress: fetchPassengerIdAndNavigateToSupport }
      ]
    );
  }
};


  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return dateTimeString;
    }
  };

  
  // Render star rating component
  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRating(star)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={star <= rating ? 'star' : 'star-border'}
              size={40}
              color={star <= rating ? '#FFD700' : '#ccc'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
    <StatusBar backgroundColor="#d63384" barStyle="light-content" />
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={24} color="white" />
          <Text style={styles.backText}>Saheli</Text>
        </TouchableOpacity>
 <View style={styles.headerIcons}>
    <TouchableOpacity 
      onPress={handleNotificationPress}
      style={styles.notificationButton}
    >
      <MaterialIcons name="notifications" size={26} color="white" />
      {unreadCount > 0 && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <MaterialIcons name="menu" size={30} color="white" />
        </TouchableOpacity>
      </View>
      </View>

      {/* Menu Overlay */}
      <MenuOverlay
        visible={menuVisible}
        closeModal={() => setMenuVisible(false)}
        user={dbUser} // 👈 change here
        navigation={navigation}
        userId={userId}
        userName={userName}
        passengerId={passengerId}
        
      />


      {/* Image Slider */}
      <View style={styles.sliderContainer}>
        <Swiper
          autoplay={true}
          autoplayTimeout={3}
          showsButtons={true}
          activeDotColor="#d63384"
          nextButton={<Text style={styles.sliderButton}>›</Text>}
          prevButton={<Text style={styles.sliderButton}>‹</Text>}
        >
          <Image source={require("../../assets/bg.png")} style={styles.image} />
          <Image source={require("../../assets/slider2.png")} style={styles.image} />
          <Image source={require("../../assets/slider3.jpg")} style={styles.image} />
          <Image source={require("../../assets/slider4.jpg")} style={styles.image} />
        </Swiper>
      </View>

      {/* Search Bar 
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#d63384" />
        <TextInput
          placeholder="Where would you go?"
          placeholderTextColor="#888"
          style={styles.searchInput}
        />
      </View>*/}

      {/* Transport & Delivery Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, activeTab === 'BookRide' && styles.activeToggle]}
          onPress={() => setActiveTab('BookRide')}
        >
          <Text style={[styles.toggleText, activeTab === 'BookRide' ? styles.activeToggleText : styles.inactiveToggleText]}>
            Book Ride
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
  style={[styles.toggleButton, activeTab === 'Carpool' && styles.activeToggle]}
  onPress={() => {
    setActiveTab('Carpool');
    fetchPassengerIdAndNavigate(); // 👈 Fetch PassengerID first
  }}
>
  <Text style={[styles.toggleText, activeTab === 'Carpool' ? styles.activeToggleText : styles.inactiveToggleText]}>
    Carpool
  </Text>
</TouchableOpacity>

      </View>

      {/* Ride History Section */}
      <View style={styles.historySection}>
        {rideHistory.length > 0 && (
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recent Rides</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History', { rideHistory })}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
        )}

        {rideHistory.length === 0 ? (
          <View style={styles.noRidesContainer}>
            <Text style={styles.ridehistorytitle}>Your Ride History</Text>
            <Text style={styles.emptyText}>
              No rides found yet. Once you start booking rides, they'll appear here!
            </Text>
          </View>
        ) : (
          <FlatList
            data={rideHistory.slice(0, 3)}
            keyExtractor={(item) => item.ride_history_id.toString()}
            renderItem={({ item }) => (
              <View style={styles.historyCard}>
                <View style={styles.historyTop}>
                  <Text style={styles.historyDate}>{formatDateTime(item.ride_date)}</Text>
                  <Text style={styles.historyAmount}>{formatCurrency(item.fare_amount)}</Text>
                </View>
                <View style={styles.locationContainer}>
                  <View style={styles.locationItem}>
                    <FontAwesome5 name="dot-circle" size={14} color="#d63384" />
                    <Text style={styles.locationText}>{item.pickup_location}</Text>
                  </View>
                  <View style={[styles.locationItem, { marginTop: 5 }]}>
                    <FontAwesome5 name="map-marker-alt" size={14} color="#d63384" />
                    <Text style={styles.locationText}>{item.dropoff_location}</Text>
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={styles.historyList}
            scrollEnabled={true}
          />
        )}
      </View>


         // Add the NotificationOverlay component (place this near the DriverMenuOverlay)
      <Modal
        transparent
        visible={notificationVisible}
        animationType="fade"
        onRequestClose={() => setNotificationVisible(false)}
      >
        <View style={styles.notificationOverlay}>
          <View style={styles.notificationContainer}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>Notifications</Text>
              <TouchableOpacity 
                onPress={() => setNotificationVisible(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#d63384" />
              </TouchableOpacity>
            </View>
            
            {notifications.length === 0 ? (
              <View style={styles.noNotifications}>
                <MaterialIcons name="notifications-off" size={40} color="#d63384" />
                <Text style={styles.noNotificationsText}>No notifications yet</Text>
                <Text style={styles.noNotificationsSubtext}>We'll notify you when something arrives</Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.NotificationID.toString()}
                renderItem={({ item }) => (
                  <View style={[
                    styles.notificationItem,
                    !item.isRead && styles.unreadNotification
                  ]}>
                    <View style={styles.notificationIcon}>
                      {item.type === 'alert' ? (
                        <MaterialIcons name="warning" size={24} color="#FF5252" />
                      ) : item.type === 'Password Change' ? (
                        <MaterialIcons name="security" size={24} color="#4CAF50" />
                      ) : (
                        <MaterialIcons name="info" size={24} color="#2196F3" />
                      )}
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationMessage}>{item.message}</Text>
                      <View style={styles.notificationTimeContainer}>
                        <MaterialIcons name="access-time" size={14} color="#888" />
                        <Text style={styles.notificationTime}>
                          {formatToPktTime(item.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
                contentContainerStyle={styles.notificationList}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal
        transparent={true}
        visible={showRating && !hasRated}
        animationType="fade"
        onRequestClose={() => setShowRating(false)}
      >
        <View style={styles.ratingOverlay}>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingTitle}>Rate Your Experience</Text>
            <Text style={styles.ratingSubtitle}>How would you rate Saheli?</Text>

            {renderStars()}

            <Text style={styles.ratingText}>
              {rating > 0 ? `You selected: ${rating} star${rating > 1 ? 's' : ''}` : 'Tap a star to rate'}
            </Text>

            <View style={styles.ratingButtons}>
              <TouchableOpacity
                style={[styles.ratingButton, styles.ratingButtonSecondary]}
                onPress={() => setShowRating(false)}
              >
                <Text style={styles.ratingButtonTextSecondary}>Maybe Later</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.ratingButton, styles.ratingButtonPrimary]}
                onPress={submitRating}
                disabled={rating === 0}
              >
                <Text style={styles.ratingButtonTextPrimary}>Submit Rating</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>



      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="home" size={25} color="#d63384" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {
    if (passengerId) {
      navigation.navigate('Favourite', { 
        passengerId: passengerId,
        userId: userId,
        userName: userName 
      });
    } else {
      Alert.alert("Info", "Please wait while we load your passenger information");
    }
  }}>
          <MaterialIcons name="favorite-border" size={25} color="#888" />
          <Text style={styles.navText}>Favorites</Text>
        </TouchableOpacity>

        <View style={styles.navItem}></View>

        <TouchableOpacity style={styles.navItem}
          onPress={() => navigation.navigate('Offers')}>
          <MaterialIcons name="local-offer" size={25} color="#888" />
          <Text style={styles.navText}>Offers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile', {userId}
          )}
          
        >
          <MaterialIcons name="person" size={25} color="#888" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>

        {/* Logo */}
        <TouchableOpacity style={styles.walletContainer}>
          <View style={styles.walletIcon}>
            <Image
              source={SaheliLogo}
              style={styles.walletImage}
              resizeMode="contain"
            />          </View>
          <Text style={styles.walletText}>   </Text>
        </TouchableOpacity>
      </View>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
  flex: 1,
  backgroundColor: "#fff", // To match your header background
},
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#d63384",
    padding: 15,
    paddingTop: 10,
  },
   headerIcons: {
  flexDirection: "row",
  alignItems: "center",
},
notificationButton: {
  marginRight: 20, // Space between notification and menu icons
  position: 'relative',
},
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    color: "white",
    fontSize: 24,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  notificationBadge: {
  position: 'absolute',
  right: -5,
  top: -5,
  backgroundColor: 'red',
  borderRadius: 10,
  width: 20,
  height: 20,
  justifyContent: 'center',
  alignItems: 'center',
},
notificationBadgeText: {
  color: 'white',
  fontSize: 10,
  fontWeight: 'bold',
},
notificationOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'flex-end',
},
notificationContainer: {
  backgroundColor: 'white',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: 20,
  maxHeight: '80%',
   shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
},
notificationHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 15,
  borderBottomWidth: 1,
  borderBottomColor: '#f0f0f0',
  paddingBottom: 15,
},
notificationTitle: {
  fontSize: 22,
  fontWeight: 'bold',
  color: '#d63384',
},
 closeButton: {
    padding: 8,
  },
notificationList: {
  paddingBottom: 20,
},
notificationItem: {
  flexDirection: 'row',
  paddingVertical: 15,
      paddingHorizontal: 10,
   borderRadius: 10,
    marginVertical: 5,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
},
unreadNotification: {
backgroundColor: '#fff5f9',
    borderLeftWidth: 3,
    borderLeftColor: '#d63384',
  },
 notificationIcon: {
    marginRight: 15,
    marginTop: 3,
  },
  notificationContent: {
    flex: 1,
  },
notificationMessage: {
  fontSize: 14,
  color: '#333',
  marginBottom: 5,
   lineHeight: 20,
},
 notificationTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
    marginLeft: 5,
  },
noNotifications: {
  padding: 30,
  alignItems: 'center',
  justifyContent: 'center',
},
 noNotificationsText: {
    fontSize: 18,
    color: '#555',
    marginTop: 15,
    fontWeight: '500',
  },
  noNotificationsSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  sliderContainer: {
    height: 200,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
    overflow: "hidden",
  },
  sliderButton: {
    color: "white",
    fontSize: 50,
    fontWeight: "bold",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    marginTop: 20,
    height: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  toggleContainer: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginTop: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    overflow: "hidden",
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  activeToggle: {
    backgroundColor: "#d63384",
  },
  activeToggleText: {
    color: "#fff",
  },
  toggleText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#fff"
  },
  inactiveToggleText: {
    color: "#888",
  },
  historySection: {
    marginHorizontal: 15,
    marginTop: 25,
    flex: 1,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  seeAllText: {
    color: "#d63384",
    fontWeight: "bold",
  },
  noRidesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
  },

  ridehistorytitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 26,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  historyList: {
    paddingBottom: 20,
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  historyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 14,
    color: "#555",
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#d63384",
  },
  locationContainer: {
    marginTop: 5,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
    position: "relative",
    paddingBottom: 10,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    width: '20%',
  },
  navText: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },
  walletContainer: {
    position: "absolute",
    bottom: 5,
    left: '50%',
    marginLeft: -30,
    alignItems: "center",
  },
  walletIcon: {
    backgroundColor: "#d63384",
    padding: 15,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  walletImage: {
    width: 30,
    height: 30,
    borderRadius: 30,
    backgroundColor: '#d63384',
    alignItems: 'center',
    justifyContent: 'center',
  },

  walletText: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "bold",
    color: "#000",
  },

  // Rating Modal Styles
  ratingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ratingContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    width: '100%',
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d63384',
    marginBottom: 5,
  },
  ratingSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: 15,
  },
  ratingText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  ratingButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  ratingButtonPrimary: {
    backgroundColor: '#d63384',
  },
  ratingButtonSecondary: {
    borderWidth: 1,
    borderColor: '#d63384',
  },
  ratingButtonTextPrimary: {
    color: 'white',
    fontWeight: 'bold',
  },
  ratingButtonTextSecondary: {
    color: '#d63384',
    fontWeight: 'bold',
  },
});

export default Home;