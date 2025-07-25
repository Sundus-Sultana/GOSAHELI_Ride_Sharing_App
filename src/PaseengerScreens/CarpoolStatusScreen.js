import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, Image, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';

const primaryColor = '#D64584';
const darkGrey = '#333';

const dummyData = {
  upcoming: [
    { 
      id: '1', 
      pickup: 'G-9, Islamabad', 
      dropoff: 'F-10 Markaz', 
      date: 'Today, Jul 24', 
      time: '10:00 AM',
      driver: 'Ali Khan',
      car: 'Toyota Corolla (ABC-123)',
      status: 'confirmed',
      seats: 3
    },
    { 
      id: '2', 
      pickup: 'I-8/4', 
      dropoff: 'Blue Area', 
      date: 'Tomorrow, Jul 25', 
      time: '9:30 AM',
      driver: 'Sara Ahmed',
      car: 'Honda Civic (XYZ-456)',
      status: 'pending',
      seats: 2
    }
  ],
  completed: [
    { 
      id: '3', 
      pickup: 'DHA Phase 2', 
      dropoff: 'F-11/3', 
      date: 'Jul 22, 2025', 
      time: '8:00 AM',
      driver: 'Usman Malik',
      car: 'Suzuki Cultus (DEF-789)',
      rating: 4.5,
      fare: 'PKR 250'
    }
  ],
  cancelled: []
};

const CarpoolStatusScreen = ({ route }) => {
    const { userId,passengerId } = route.params || {};
  console.log("PassengerID on status screen:", passengerId,userId);
  const [selectedTab, setSelectedTab] = useState('upcoming');

  const renderStatusBadge = (status) => {
    switch(status) {
      case 'confirmed':
        return (
          <View style={[styles.badge, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.badgeText}>Confirmed</Text>
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.badge, { backgroundColor: '#FFC107' }]}>
            <Text style={styles.badgeText}>Pending</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const renderCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{item.date} • {item.time}</Text>
        {item.status && renderStatusBadge(item.status)}
        {item.rating && (
          <View style={styles.ratingContainer}>
            <FontAwesome name="star" size={14} color="#FFC107" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.routeContainer}>
        <View style={styles.routeDot} />
        <View style={styles.routeLine} />
        <View style={[styles.routeDot, { backgroundColor: primaryColor }]} />
      </View>
      
      <View style={styles.locationContainer}>
        <View style={styles.locationTextContainer}>
          <Text style={styles.locationText}>{item.pickup}</Text>
        </View>
        <View style={styles.locationTextContainer}>
          <Text style={styles.locationText}>{item.dropoff}</Text>
        </View>
      </View>
      
      {item.driver && (
        <View style={styles.driverContainer}>
          <View style={styles.avatarPlaceholder}>
            <MaterialIcons name="person" size={24} color="#fff" />
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{item.driver}</Text>
            <Text style={styles.carInfo}>{item.car}</Text>
            {item.seats && (
              <Text style={styles.seatsInfo}>
                <Ionicons name="people" size={14} color="#666" /> {item.seats} seats available
              </Text>
            )}
          </View>
        </View>
      )}
      
      {item.fare && (
        <View style={styles.fareContainer}>
          <Text style={styles.fareText}>Fare: {item.fare}</Text>
        </View>
      )}
      
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={[styles.actionButtonText, { color: primaryColor }]}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
          <Text style={[styles.actionButtonText, { color: '#fff' }]}>
            {selectedTab === 'upcoming' ? 'Track Ride' : 'Rate Ride'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Carpools</Text>
        <TouchableOpacity>
          <MaterialIcons name="notifications-none" size={24} color={darkGrey} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabRow}>
        {['upcoming', 'completed', 'cancelled'].map(tab => (
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

      <FlatList
        data={dummyData[selectedTab]}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Image 
              source={require('../../assets/bg.png')} 
              style={styles.emptyImage}
            />
            <Text style={styles.emptyTitle}>No {selectedTab} rides</Text>
            <Text style={styles.emptySubtitle}>When you have {selectedTab} rides, they'll appear here</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: darkGrey
  },
  tabRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  tab: {
    paddingVertical: 15,
    alignItems: 'center',
    width: '33%'
  },
  activeTab: {
    position: 'relative'
  },
  tabText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 14
  },
  activeTabText: {
    color: primaryColor,
    fontWeight: '600'
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '100%',
    backgroundColor: primaryColor
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: darkGrey
  },
  routeContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50'
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: '#ddd',
    marginVertical: 4
  },
  locationContainer: {
    flexDirection: 'row',
    marginLeft: 36,
    marginTop: -42,
    marginBottom: 16
  },
  locationTextContainer: {
    flex: 1
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    color: darkGrey,
    marginBottom: 20
  },
  driverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  driverInfo: {
    flex: 1
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: darkGrey
  },
  carInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  seatsInfo: {
    fontSize: 13,
    color: '#666',
    marginTop: 4
  },
  fareContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  fareText: {
    fontSize: 16,
    fontWeight: '600',
    color: darkGrey
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: primaryColor
  },
  primaryButton: {
    backgroundColor: primaryColor
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 14
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 20
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: darkGrey,
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20
  }
});

export default CarpoolStatusScreen;