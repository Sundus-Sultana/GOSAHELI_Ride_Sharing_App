import React, { useState, useEffect, useRef } from 'react';
import {
  View, TextInput, TouchableOpacity, Text,
  StyleSheet, FlatList, Alert, ScrollView,
  Keyboard, Platform, ActivityIndicator, Dimensions
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';

export default function Carpool({ navigation }) {
  const [sourceText, setSourceText] = useState('');
  const [destText, setDestText] = useState('');
  const [sourceCoord, setSourceCoord] = useState(null);
  const [destCoord, setDestCoord] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [locationPermission, setLocationPermission] = useState(false);
  const [recentRoutes, setRecentRoutes] = useState([]);
  const [isSourceFocused, setIsSourceFocused] = useState(false);
  const [isDestFocused, setIsDestFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const mapRef = useRef(null);
  const nominatimUrl = 'https://nominatim.openstreetmap.org/search';
  const sourceInputRef = useRef(null);
  const destInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      // Set default to Islamabad if no location available
      if (!sourceCoord) {
        setSourceCoord({
          latitude: 33.6844,
          longitude: 73.0479
        });
      }
    })();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setSourceCoord(coords);

      try {
        const res = await axios.get('https://nominatim.openstreetmap.org/reverse', {
          params: {
            format: 'json',
            lat: coords.latitude,
            lon: coords.longitude,
            countrycodes: 'pk',
            addressdetails: 1
          },
          headers: {
            'User-Agent': 'SaheliRide/1.0',
            'Accept-Language': 'en',
          },
        });

        if (res.data?.address) {
          const address = res.data.address;
          let displayName = '';
          if (address.road) displayName += address.road + ', ';
          if (address.neighbourhood) displayName += address.neighbourhood + ', ';
          if (address.suburb) displayName += address.suburb + ', ';
          if (address.city) displayName += address.city;
          setSourceText(displayName || 'Current Location');
        } else {
          setSourceText('Current Location');
        }
      } catch {
        setSourceText('Current Location');
      }
      setSourceSuggestions([]);
      Keyboard.dismiss();
    } catch (error) {
      Alert.alert('Location Error', 'Failed to fetch current location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const geocode = async (query) => {
    try {
      // Special handling for IIUI
      if (query.toLowerCase().includes('iiui') || query.toLowerCase().includes('international islamic university')) {
        return {
          latitude: 33.7294,
          longitude: 73.0931
        };
      }

      const res = await axios.get(nominatimUrl, {
        params: { 
          q: query + ', Pakistan', 
          format: 'json',
          countrycodes: 'pk',
          limit: 5
        },
        headers: { 
          'User-Agent': 'SaheliRide/1.0', 
          'Accept-Language': 'en' 
        },
      });

      if (res.data && res.data.length > 0) {
        return {
          latitude: parseFloat(res.data[0].lat),
          longitude: parseFloat(res.data[0].lon),
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const getRoute = async (src, dest) => {
    if (!src || !dest) return;
    
    setLoading(true);
    const url = `https://router.project-osrm.org/route/v1/driving/${src.longitude},${src.latitude};${dest.longitude},${dest.latitude}?overview=full&geometries=geojson`;

    try {
      const res = await axios.get(url);
      const route = res.data.routes[0];
      const coords = route.geometry.coordinates.map(c => ({
        latitude: c[1],
        longitude: c[0],
      }));
      setRouteCoords(coords);

      const distanceKm = (route.distance / 1000).toFixed(1);
      const durationMin = (route.duration / 60).toFixed(0);
      
      // Save to recent routes
      if (sourceText && destText) {
        setRecentRoutes(prev => [
          { 
            source: sourceText, 
            destination: destText, 
            distance: distanceKm,
            duration: durationMin,
            timestamp: Date.now() 
          },
          ...prev.slice(0, 4),
        ]);
      }

      // Fit map to route
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.fitToCoordinates([src, dest], {
            edgePadding: { 
              top: 100, 
              bottom: 100, 
              left: 50, 
              right: 50 
            },
            animated: true,
          });
        }
      }, 500);
    } catch (error) {
      Alert.alert('Route Error', 'Could not calculate route. Please check your locations and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sourceCoord && destCoord) {
      getRoute(sourceCoord, destCoord);
    }
  }, [sourceCoord, destCoord]);

  const fetchSuggestions = async (text, setSuggestions) => {
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    
    try {
      const res = await axios.get(nominatimUrl, {
        params: { 
          q: text + ', Pakistan', 
          format: 'json',
          countrycodes: 'pk',
          limit: 5
        },
        headers: { 
          'User-Agent': 'SaheliRide/1.0', 
          'Accept-Language': 'en' 
        },
      });
      setSuggestions(res.data || []);
    } catch (error) {
      console.error('Suggestion fetch error:', error);
      setSuggestions([]);
    }
  };

  const renderSuggestionItem = (item, setField, setCoord, setSuggestions) => {
    const address = item.display_name.split(',').slice(0, 3).join(',');
    return (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => {
          const coords = {
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          };
          setField(address);
          setCoord(coords);
          setSuggestions([]);
          Keyboard.dismiss();
        }}
      >
        <MaterialIcons name="location-on" size={20} color="#555" />
        <Text style={styles.suggestionText}>{address}</Text>
      </TouchableOpacity>
    );
  };

  const renderRecentRouteItem = (route, index) => {
    return (
      <TouchableOpacity
        key={index}
        style={styles.recentRouteItem}
        onPress={async () => {
          setLoading(true);
          const src = await geocode(route.source);
          const dst = await geocode(route.destination);
          if (src && dst) {
            setSourceText(route.source);
            setDestText(route.destination);
            setSourceCoord(src);
            setDestCoord(dst);
          }
          setLoading(false);
        }}
      >
        <View style={styles.routeIcon}>
          <FontAwesome name="history" size={16} color="#666" />
        </View>
        <View style={styles.routeInfo}>
          <Text style={styles.routeText} numberOfLines={1}>
            <Text style={{ fontWeight: 'bold' }}>From:</Text> {route.source}
          </Text>
          <Text style={styles.routeText} numberOfLines={1}>
            <Text style={{ fontWeight: 'bold' }}>To:</Text> {route.destination}
          </Text>
          {route.distance && (
            <Text style={styles.routeMeta}>
              {route.distance} km • {route.duration} mins
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plan Your Carpooling</Text>
      </View>

      {/* Search Section */}
      <View style={styles.searchContainer}>
        {/* Source Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputIcon}>
            <MaterialIcons name="my-location" size={20} color="#d63384" />
          </View>
          <TextInput
            ref={sourceInputRef}
            placeholder="Pickup location"
            placeholderTextColor="#888"
            style={styles.input}
            value={sourceText}
            onChangeText={(text) => {
              setSourceText(text);
              fetchSuggestions(text, setSourceSuggestions);
            }}
            onFocus={() => {
              setIsSourceFocused(true);
              setIsDestFocused(false);
            }}
            onBlur={() => setIsSourceFocused(false)}
          />
          {sourceText ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSourceText('');
                setSourceCoord(null);
                setRouteCoords([]);
              }}
            >
              <MaterialIcons name="clear" size={18} color="#888" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Destination Input */}
        <View style={[styles.inputContainer, { marginTop: 8 }]}>
          <View style={styles.inputIcon}>
            <MaterialIcons name="location-on" size={20} color="#d63384" />
          </View>
          <TextInput
            ref={destInputRef}
            placeholder="Drop-off location"
            placeholderTextColor="#888"
            style={styles.input}
            value={destText}
            onChangeText={(text) => {
              setDestText(text);
              fetchSuggestions(text, setDestSuggestions);
            }}
            onFocus={() => {
              setIsDestFocused(true);
              setIsSourceFocused(false);
            }}
            onBlur={() => setIsDestFocused(false)}
          />
          {destText ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setDestText('');
                setDestCoord(null);
                setRouteCoords([]);
              }}
            >
              <MaterialIcons name="clear" size={18} color="#888" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Current Location Button */}
        {isSourceFocused && !sourceText && locationPermission && (
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={getCurrentLocation}
            disabled={loading}
          >
            <Ionicons name="locate" size={18} color="#d63384" />
            <Text style={styles.currentLocationText}>Use current location</Text>
          </TouchableOpacity>
        )}

        {/* Suggestions List */}
        {(sourceSuggestions.length > 0 && isSourceFocused) && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={sourceSuggestions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) =>
                renderSuggestionItem(item, setSourceText, setSourceCoord, setSourceSuggestions)
              }
              keyboardShouldPersistTaps="always"
            />
          </View>
        )}

        {(destSuggestions.length > 0 && isDestFocused) && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={destSuggestions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) =>
                renderSuggestionItem(item, setDestText, setDestCoord, setDestSuggestions)
              }
              keyboardShouldPersistTaps="always"
            />
          </View>
        )}

        {/* Swap Button */}
        {sourceCoord && destCoord && (
          <TouchableOpacity
            style={styles.swapButton}
            onPress={() => {
              const tempText = sourceText;
              const tempCoord = sourceCoord;
              setSourceText(destText);
              setSourceCoord(destCoord);
              setDestText(tempText);
              setDestCoord(tempCoord);
            }}
          >
            <MaterialIcons name="swap-vert" size={24} color="#d63384" />
          </TouchableOpacity>
        )}
      </View>

      {/* Recent Routes */}
      {recentRoutes.length > 0 && !(isSourceFocused || isDestFocused) && (
        <View style={styles.recentRoutesContainer}>
          <Text style={styles.sectionTitle}>Recent Routes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentRoutes.map((route, index) => renderRecentRouteItem(route, index))}
          </ScrollView>
        </View>
      )}

      {/* Map View */}
      <View 
        style={styles.mapContainer}
        onLayout={() => setMapReady(true)}
      >
        {mapReady && (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: sourceCoord?.latitude || 33.6844,
              longitude: sourceCoord?.longitude || 73.0479,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            mapType="standard"
            showsUserLocation={locationPermission}
            showsMyLocationButton={false}
            showsBuildings={true}
            showsTraffic={false}
            showsIndoors={true}
            showsPointsOfInterest={true}
            loadingEnabled={true}
            loadingIndicatorColor="#d63384"
          >
            {sourceCoord && (
              <Marker coordinate={sourceCoord} title="Pickup">
                <View style={styles.marker}>
                  <View style={[styles.markerPin, { backgroundColor: '#d63384' }]}>
                    <MaterialIcons name="location-pin" size={20} color="white" />
                  </View>
                </View>
              </Marker>
            )}
            
            {destCoord && (
              <Marker coordinate={destCoord} title="Drop-off">
                <View style={styles.marker}>
                  <View style={[styles.markerPin, { backgroundColor: '#28a745' }]}>
                    <MaterialIcons name="location-pin" size={20} color="white" />
                  </View>
                </View>
              </Marker>
            )}
            
            {routeCoords.length > 0 && (
              <Polyline 
                coordinates={routeCoords} 
                strokeWidth={4} 
                strokeColor="#d63384"
              />
            )}
          </MapView>
        )}
      </View>

      {/* Proceed Button */}
      {sourceCoord && destCoord && !(isSourceFocused || isDestFocused) && (
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={() =>
            navigation.navigate('CarpoolProfile', {
              source: sourceCoord,
              destination: destCoord,
              sourceText,
              destText,
            })
          }
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.proceedButtonText}>Create Profile</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  clearButton: {
    padding: 5,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 5,
  },
  currentLocationText: {
    marginLeft: 10,
    color: '#d63384',
    fontSize: 16,
  },
  suggestionsContainer: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#333',
  },
  swapButton: {
    position: 'absolute',
    right: 25,
    top: 75,
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  recentRoutesContainer: {
    padding: 15,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  recentRouteItem: {
    width: 200,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginRight: 10,
    flexDirection: 'row',
  },
  routeIcon: {
    marginRight: 10,
  },
  routeInfo: {
    flex: 1,
  },
  routeText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  },
  routeMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  marker: {
    alignItems: 'center',
  },
  markerPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  proceedButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#d63384',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});