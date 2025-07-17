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
import { getRideHistory, getUser } from "../../api.js";
import SaheliLogo from "../../assets/IconWomen2.png";

const DriverHome = ({ route }) => {
  const navigation = useNavigation();
  const { userId: paramuserId, userName: paramUserName, user: paramuser,driverId: paramDriverId, } = route.params || {};

  const [menuVisible, setMenuVisible] = useState(false);
  const [dbUser, setDbUser] = useState(paramuser || null);
  const [rideHistory, setRideHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("OfferRide");
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);

  const userId = paramuserId || dbUser?.UserID;

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "PKR 0";
    return `PKR ${amount.toLocaleString("en-PK")}`;
  };


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
        { text: "Give Feedback", onPress: () => navigation.navigate("Support") },
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
          <FontAwesome5 name="arrow-left" size={24} color="white" />
          <Text style={styles.backText}>Saheli</Text>
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

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#d63384" />
        <TextInput placeholder="Where would you go?" placeholderTextColor="#888" style={styles.searchInput} />
      </View>

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
      driverId: paramDriverId || dbUser?.DriverID, // Pass driverId
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
          data={rideHistory.slice(0, 2)}
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
             <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Favourite')}>
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
               onPress={() => navigation.navigate('Profile')}
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