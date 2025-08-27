// favouriteDetails.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, ActivityIndicator, Alert, Animated, Platform
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { TouchableOpacity, FlatList } from 'react-native-gesture-handler';
import axios from 'axios';
import { API_URL } from '../../api';
import { removeFavourite } from '../utils/ApiCalls';
import { Rating } from 'react-native-ratings';

export default function Favourite({ route, navigation }) {
  const passengerId = route?.params?.passengerId;
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    fetchFavourites();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [passengerId]);

  const fetchFavourites = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/favourites/passenger/${passengerId}/details`
      );
      if (res.data.success) {
        setFavourites(res.data.favourites);
      } else {
        setFavourites([]);
      }
    } catch (err) {
      console.error('Error fetching favourites:', err);
      Alert.alert('Error', 'Could not load favourites');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFavourites();
  };

  const handleRemoveFavourite = async (driverId) => {
    Alert.alert(
      'Remove Favourite',
      'Are you sure you want to remove this driver from favourites?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          onPress: async () => {
            const prevList = [...favourites];
            const updatedList = favourites.filter(fav => fav.DriverID !== driverId);
            setFavourites(updatedList);
            
            const result = await removeFavourite(passengerId, driverId);
            if (!result.success) {
              Alert.alert('Error', 'Failed to remove favourite');
              setFavourites(prevList);
            } else {
              // Show success feedback
              Animated.sequence([
                Animated.timing(fadeAnim, {
                  toValue: 0.5,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]).start();
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (progress, dragX, driverId) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.9],
      extrapolate: 'clamp',
    });
    
    return (
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveFavourite(driverId)}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <MaterialIcons name="delete" size={28} color="white" />
          <Text style={styles.removeText}>Remove</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item, index }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          {
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50 * (index + 1), 0],
            }),
          },
        ],
      }}
    >
      <Swipeable
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.DriverID)}
        friction={2}
        rightThreshold={40}
      >
        <View style={styles.card}>
          <Image
            source={
              item.photo_url
                ? { uri: item.photo_url.startsWith('/uploads')
                    ? `${API_URL}${item.photo_url}`
                    : `${API_URL}/uploads/${item.photo_url}`
                  }
                : require('../../assets/empty_avatar.jpg')
            }
            style={styles.avatar}
          />
          <View style={styles.info}>
            <View style={styles.nameContainer}>
              <Text style={styles.name} numberOfLines={1}>{item.username}</Text>
              {item.IsRecentlyRated && (
                <View style={styles.recentBadge}>
                  <Text style={styles.recentBadgeText}>Recent</Text>
                </View>
              )}
            </View>
            
            <View style={styles.vehicleInfo}>
              <Ionicons name="car-sport" size={16} color="#666" />
              <Text style={styles.vehicle}>
                {item.color} {item.VehicleModel}
              </Text>
            </View>
            
            <View style={styles.plateContainer}>
              <MaterialIcons name="confirmation-number" size={16} color="#666" />
              <Text style={styles.plate}>{item.PlateNumber}</Text>
            </View>
            
            <View style={styles.ratingContainer}>
              <Rating
                type="star"
                ratingCount={5}
                imageSize={18}
                readonly
                startingValue={item.Rating || 0}
                style={styles.ratingStars}
              />
              <Text style={styles.ratingText}>
                {typeof item.Rating === 'number' ? item.Rating.toFixed(1) : 'N/A'}
                {item.RatingCount > 0 && ` (${item.RatingCount})`}
              </Text>
            </View>
          </View>
        </View>
      </Swipeable>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with gradient */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>My Favourite Drivers</Text>
        <View style={styles.headerRight} />
      </View>

      {/* List with refresh control */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d63384" />
          <Text style={styles.loadingText}>Loading your favourites...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* 🔹 Swipe hint */}
          {favourites.length > 0 && (
            <View style={styles.hintContainer}>
              <Ionicons name="swap-horizontal" size={16} color="#666" />
              <Text style={styles.hintText}>Swipe left on a driver to remove</Text>
            </View>
          )}
        <Animated.FlatList
          data={favourites}
          keyExtractor={(item) => item.DriverID.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-dislike" size={60} color="#d1d1d1" />
              <Text style={styles.emptyTitle}>No Favourites Yet</Text>
              <Text style={styles.emptySubtitle}>
                Your favourite drivers will appear here
              </Text>
            </View>
          }
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
         </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#d63384',
    paddingVertical: 15,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  backButton: {
    padding: 4,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  headerRight: {
    width: 36, // Balance the header layout
  },
  hintContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 6,
},
hintText: {
  fontSize: 14,
  color: '#666',
  marginLeft: 6,
},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontWeight: '600',
    fontSize: 18,
    color: '#333',
    flexShrink: 1,
  },
  recentBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  recentBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  plateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  plate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStars: {
    alignSelf: 'flex-start',
    marginRight: 8,
  },
  ratingText: {
    color: '#d63384',
    fontWeight: '600',
    fontSize: 16,
  },
  removeButton: {
    backgroundColor: '#dd0202ff',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '80%',
    borderRadius: 12,
    marginTop: 10,
    marginRight: 8,
  },
  removeText: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 4,
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 4,
  },
});