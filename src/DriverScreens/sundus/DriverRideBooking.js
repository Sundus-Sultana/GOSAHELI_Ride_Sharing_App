// DriverRideBooking.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";

const DriverRideBooking = () => {
  const [isAvailable, setIsAvailable] = useState(false);

  // Dummy rides
  const [rides, setRides] = useState([
    {
      id: "1",
      passenger: "Ali Khan",
      pickup: "Model Town, Lahore",
      dropoff: "Johar Town, Lahore",
    },
    {
      id: "2",
      passenger: "Sara Ahmed",
      pickup: "DHA Phase 3",
      dropoff: "Gulberg, Lahore",
    },
    {
      id: "3",
      passenger: "Bilal Hussain",
      pickup: "Shadman",
      dropoff: "Wapda Town",
    },
  ]);

  const handleAccept = (ride) => {
    Alert.alert("Ride Accepted", `You have accepted ${ride.passenger}'s ride.`);
  };

  const handleReject = (rideId) => {
    Alert.alert("Ride Rejected", "You have rejected this ride.");
    setRides((prev) => prev.filter((ride) => ride.id !== rideId));
  };

  const renderRideCard = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.passenger}</Text>
      <Text style={styles.text}>Pickup: {item.pickup}</Text>
      <Text style={styles.text}>Dropoff: {item.dropoff}</Text>
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#4CAF50" }]}
          onPress={() => handleAccept(item)}
        >
          <Text style={styles.btnText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#F44336" }]}
          onPress={() => handleReject(item.id)}
        >
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#d63384" barStyle="light-content" />
      <View style={styles.container}>
        {/* Toggle for availability */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleText}>
            {isAvailable ? "Available" : "Unavailable"}
          </Text>
          <Switch
            value={isAvailable}
            onValueChange={(val) => setIsAvailable(val)}
            thumbColor={isAvailable ? "#4CAF50" : "#f4f3f4"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>

        {/* Ride Requests OR Message */}
        {isAvailable ? (
          <FlatList
            data={rides}
            keyExtractor={(item) => item.id}
            renderItem={renderRideCard}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No ride requests right now.</Text>
            }
          />
        ) : (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>
              You are currently unavailable.  
              When you switch to available, you’ll see ride requests here.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  toggleText: {
    fontSize: 18,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    flex: 0.48,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
  },
  messageBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  messageText: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#777",
  },
});

export default DriverRideBooking;
