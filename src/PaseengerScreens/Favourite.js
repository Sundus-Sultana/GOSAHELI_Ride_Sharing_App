import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; // Make sure to install this package

const Favourite = () => {
  // Initial driver data
  const initialDrivers = [
    {
      id: '1',
      name: 'Sundus Sultana',
      rating: 4.9,
      rides: 1245,
      carModel: 'Legender',
      carNumber: 'ICT 1234',
      avatar: require('../../assets/driver1.jpg'),
    },
    {
      id: '2',
      name: 'Atiqa Din',
      rating: 4.8,
      rides: 982,
      carModel: 'Fortuner',
      carNumber: 'ICT 5678',
      avatar: require('../../assets/driver2.jpg'),
    },
  ];

  const [favoriteDrivers, setFavoriteDrivers] = useState(initialDrivers);

  const removeDriver = (id) => {
    setFavoriteDrivers(favoriteDrivers.filter(driver => driver.id !== id));
  };

  const renderDriverItem = ({ item }) => (
    <View style={styles.driverCard}>
      {/* Heart icon in top right corner */}
      <TouchableOpacity 
        style={styles.heartIcon}
        onPress={() => removeDriver(item.id)}
      >
        <Icon name="heart" size={20} color="#FF3B30" />
      </TouchableOpacity>
      
      <View style={styles.driverInfo}>
        <Image 
          source={item.avatar} 
          style={styles.avatar}
          onError={() => console.log("Error loading image")}
        />
        <View style={styles.driverDetails}>
          <Text style={styles.driverName}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>{item.rating} ★</Text>
            <Text style={styles.ridesText}>{item.rides} rides</Text>
          </View>
          <Text style={styles.carInfo}>{item.carModel} • {item.carNumber}</Text>
        </View>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeDriver(item.id)}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {favoriteDrivers.length > 0 ? (
        <FlatList
          data={favoriteDrivers}
          renderItem={renderDriverItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No favorite drivers yet</Text>
          <Text style={styles.emptySubText}>Your favorite drivers will appear here</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 15,
  },
  listContainer: {
    paddingBottom: 20,
  },
  driverCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heartIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingText: {
    fontSize: 14,
    color: '#FFD700',
    marginRight: 10,
  },
  ridesText: {
    fontSize: 14,
    color: '#666',
  },
  carInfo: {
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Changed to flex-end since we only have remove button
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  removeButton: {
    backgroundColor: '#d63384',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default Favourite;