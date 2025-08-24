import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const History = ({ route }) => {
  const rideHistory = route?.params?.rideHistory || [];

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateTimeString;
    }
  };

  // Function to format currency as PKR
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'PKR 0';
    return `PKR ${amount.toLocaleString('en-PK')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Ride History</Text>
      
      {rideHistory.length === 0 ? (
        <View style={styles.noRidesContainer}>
          <Text style={styles.noRidesText}>No ride history available</Text>
        </View>
      ) : (
        <FlatList
          data={rideHistory}
          keyExtractor={(item) => item.ride_history_id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <View style={styles.historyCard}>
              <View style={styles.historyTop}>
                <Text style={styles.historyDate}>{formatDateTime(item.ride_date)}</Text>
                <Text style={styles.historyAmount}>{formatCurrency(item.fare_amount)}</Text>
              </View>
              <View style={styles.locationContainer}>
                <View style={styles.locationItem}>
                  <FontAwesome5 name="dot-circle" size={14} color="#d63384" />
                  <Text style={styles.locationText}>{item.pickup_location || 'Unknown location'}</Text>
                </View>
                <View style={[styles.locationItem, { marginTop: 5 }]}>
                  <FontAwesome5 name="map-marker-alt" size={14} color="#d63384" />
                  <Text style={styles.locationText}>{item.dropoff_location || 'Unknown location'}</Text>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d63384',
    marginBottom: 20,
    marginTop:20,
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 14,
    color: '#555',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d63384',
  },
  locationContainer: {
    marginTop: 5,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  listContainer: {
    paddingBottom: 20,
  },
  noRidesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noRidesText: {
    fontSize: 18,
    color: '#888',
  },
});

export default History;