import React, { useState, useEffect } from "react";
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
  Platform,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Swiper from "react-native-swiper";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import DriverMenuOverlay from "../components/DriverMenuOverlay"; // ✅ Correct import name
import { auth } from "../firebase/setup";
import { getRideHistory, getUser, getDriverById } from "../../api.js";
import { getNotifications, markNotificationsAsRead } from "../utils/ApiCalls.js";

import SaheliLogo from "../../assets/IconWomen2.png";
import { registerForPushNotificationsAsync } from '../utils/NotificationSetup'; // Adjust path if needed
// Add at the top with other imports
import AsyncStorage from '@react-native-async-storage/async-storage';


const DriverHome = ({ route }) => {
  const navigation = useNavigation();
  const { userId: paramuserId, userName: paramUserName, user: paramuser, driverId: paramDriverId, } = route.params || {};

  const [menuVisible, setMenuVisible] = useState(false);
  const [dbUser, setDbUser] = useState(paramuser || null);
  const [rideHistory, setRideHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("OfferRide");
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [driver, setDriver] = useState(null);
  const userId = paramuserId || dbUser?.UserID;

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "PKR 0";
    return `PKR ${amount.toLocaleString("en-PK")}`;
  };

  // Add this helper function to format time to PKT
  const formatToPktTime = (timestamp) => {
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

  // Add polling inside useEffect
  useEffect(() => {
    let intervalId;

    const fetchNotifications = async () => {
      if (!userId) return;
      try {
        const notifs = await getNotifications(userId);
        setNotifications(notifs);
        const unread = notifs.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    if (notificationVisible) {
      // Start polling every 1.5 seconds while overlay is open
      fetchNotifications();
      intervalId = setInterval(fetchNotifications, 1500);
    }

    return () => {
      // Cleanup when overlay closes or component unmounts
      if (intervalId) clearInterval(intervalId);
    };
  }, [notificationVisible, userId]);


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
        setNotifications(notifs => notifs.map(n => ({ ...n, isRead: true })));
      } catch (err) {
        console.error("Error marking notifications as read:", err);
      }
    }
  };

  useEffect(() => {
    const fetchDriver = async () => {
      if (!userId) return;
      try {
        console.log('Fetching driver for user id:', userId);
        const driverData = await getDriverById(userId);
        if (driverData) {
          setDriver(driverData);
          console.log('Driver data:', driverData);
          // Store driver ID for later use
          await AsyncStorage.setItem('DriverID', driverData.DriverID.toString());
        }
      } catch (err) {
        console.error("Error fetching driver data:", err);
      }
    };

    fetchDriver();
  }, [userId]);


  // In DriverHome.js, modify the useEffect for push notifications:
  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        // Wait until we have both userId and driverId
        if (userId && driver?.DriverID) {
          const alreadyAsked = await AsyncStorage.getItem('PushPermissionAsked');

          if (!alreadyAsked) {
            await registerForPushNotificationsAsync(userId);
            await AsyncStorage.setItem('PushPermissionAsked', 'true');
          }
        }
      } catch (err) {
        console.error('❌ Push notification initialization error:', err);
      }
    };

    initializePushNotifications();
  }, [userId, driver]); // Add driver to dependencies

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
    const fetchUserData = async () => {
      if (dbUser) return;
      const email = auth.currentUser?.email;
      if (!email) return;
      try {
        const userFromDB = await getUser(email);
        if (userFromDB) {
          setDbUser(userFromDB);
        }
      } catch (err) {
        console.error("Error fetching user from DB:", err);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userId) return;
      try {
        const history = await getRideHistory(userId);
        setRideHistory(history);
      } catch (err) {
        console.error("Error fetching ride history:", err);
      }
    };

    fetchHistory();
  }, [dbUser]);

  const handleRating = (selectedRating) => setRating(selectedRating);

  const submitRating = () => {
    setHasRated(true);
    setShowRating(false);
    if (rating > 3) {
      const url =
        Platform.OS === "ios"
          ? "itms-apps://itunes.apple.com/app/idYOUR_APP_ID?action=write-review"
          : "market://details?id=YOUR_PACKAGE_NAME";
      Linking.openURL(url);
    } else {
      Alert.alert("Thanks for your feedback!", "We appreciate your honesty. What could we improve?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Give Feedback", onPress: () => navigation.navigate("Support", {
            userId: userId,
            driverId: driver?.DriverID,  // Pass driverId
          })
        },
      ]);
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return dateTimeString;
    }
  };

  const renderStars = () => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => handleRating(star)} activeOpacity={0.7}>
          <MaterialIcons
            name={star <= rating ? "star" : "star-border"}
            size={40}
            color={star <= rating ? "#FFD700" : "#ccc"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#d63384" barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            {/* Header<FontAwesome5 name="arrow-left" size={24} color="white" />*/}
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
            <TouchableOpacity
              onPress={() => {
                console.log("Menu opened");
                setMenuVisible(true);
              }}
            >
              <MaterialIcons name="menu" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Overlay (render always, handle inside) */}
        <DriverMenuOverlay
          visible={menuVisible}
          closeModal={() => setMenuVisible(false)}
          navigation={navigation}
          userId={userId}
          user={dbUser}
        />

        {/* Swiper */}
        <View style={styles.sliderContainer}>
          <Swiper
            autoplay
            autoplayTimeout={3}
            showsButtons
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

        {/* Search 
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#d63384" />
          <TextInput placeholder="Where would you go?" placeholderTextColor="#888" style={styles.searchInput} />
        </View>*/}

        {/* Toggle Buttons */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, activeTab === "OfferRide" && styles.activeToggle]}
            onPress={() => setActiveTab("OfferRide")}
          >
            <Text
              style={[
                styles.toggleText,
                activeTab === "OfferRide" ? styles.activeToggleText : styles.inactiveToggleText,
              ]}
            >
              Offer Ride
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, activeTab === "OfferCarpool" && styles.activeToggle]}
            onPress={() => {
              setActiveTab("OfferCarpool");
              navigation.navigate("OfferCarpool", {
                userId: userId,
                driverId: driver?.DriverID,  // Pass driverId
              });
            }}
          >

            <Text
              style={[
                styles.toggleText,
                activeTab === "OfferCarpool" ? styles.activeToggleText : styles.inactiveToggleText,
              ]}
            >
              Offer Carpool
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ride History */}
        <View style={styles.historySection}>
          {rideHistory.length > 0 ? (
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent Rides</Text>
              <TouchableOpacity onPress={() => navigation.navigate("History", { rideHistory })}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noRidesContainer}>
              <Text style={styles.ridehistorytitle}>Your Ride History</Text>
              <Text style={styles.emptyText}>
                No rides found yet. Once you start booking rides, they'll appear here!
              </Text>
            </View>
          )}

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
            scrollEnabled={false}
          />
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
                        ) : item.type === 'Carpool' ? (
                          <MaterialIcons name="directions-car" size={24} color="#d63384" />
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
        <Modal transparent visible={showRating && !hasRated} animationType="fade">
          <View style={styles.ratingOverlay}>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingTitle}>Rate Your Experience</Text>
              <Text style={styles.ratingSubtitle}>How would you rate Saheli?</Text>
              {renderStars()}
              <Text style={styles.ratingText}>
                {rating > 0 ? `You selected: ${rating} star${rating > 1 ? "s" : ""}` : "Tap a star to rate"}
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
          {/* My Rides (Updated) */}
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('DriverCarpoolStatusScreen', {
              userId: userId,
              driverId: driver?.DriverID,
            })}>

            <View style={{ position: 'relative' }}>
              <MaterialIcons name="directions-car" size={25} color="#888" />
              {/* Status dots (⚪⚪⚪) */}
              <View style={{
                position: 'absolute',
                top: -3,
                right: -8,
                flexDirection: 'row'
              }}>
                {[1, 2, 3].map((item) => (
                  <View
                    key={item}
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: '#888',
                      marginHorizontal: 1
                    }}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.navText}>My Carpools</Text>
          </TouchableOpacity>

          <View style={styles.navItem}></View>

          <TouchableOpacity style={styles.navItem}
            onPress={() => navigation.navigate('Offers')}>
            <MaterialIcons name="local-offer" size={25} color="#888" />
            <Text style={styles.navText}>Offers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Profile', { userId })}
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

export default DriverHome;