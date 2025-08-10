import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, Alert,
  Keyboard, TouchableWithoutFeedback
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import axios from 'axios';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic3VuZHVzc3VsdGFuYSIsImEiOiJjbWFzYXd6MXYwZHdjMnFzNW51OHFxbW1iIn0.3WX-TCF91Jh3Go-pjGwAOg';
const bboxIslamabadRawalpindi = '72.8,33.4,73.3,33.9';
// Carpool Pricing Constants (exported for use in CarpoolProfile)
export const CARPOOL_PRICE_PARAMS = {
  FUEL_PRICE_PER_LITER: 264.61, // Current Pakistan petrol price
  AVERAGE_MILEAGE: 15, // km/L
  DRIVER_PROFIT_MARGIN:0.03, //20%
  APP_COMMISSION: 0.10, // 10%
  PEAK_HOUR_SURCHARGE: 0.20, // 20% extra during peak hours
  PEAK_HOURS: [7, 9, 17, 19], // 7-9AM and 5-7PM
  BASE_COST_PER_KM: 5, // PKR per km to cover maintenance/other costs
  MINIMUM_FARE: 80 // PKR minimum per passenger (only for very short trips)
};   
// Urdu→English replacements
const urduToEnglishDict = {
  "مسجد": "Mosque",
  "جامع": "Jamia",
  "اسکول": "School",
  "کالج": "College",
  "یونیورسٹی": "University",
  "گلی": "Street",
  "مارکیٹ": "Market",
  "چوک": "Chowk",
};
const containsUrdu = (text) => /[\u0600-\u06FF]/.test(text);
const replaceUrduWords = (text) => {
  let result = text;
  for (const urduWord in urduToEnglishDict) {
    const regex = new RegExp(urduWord, 'g');
    result = result.replace(regex, urduToEnglishDict[urduWord]);
  }
  return result;
};
const cleanAddress = (placeName) => {
  const parts = placeName.split(',').map(p => p.trim());
  return parts.slice(0, 3).join(', ');
};

const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

const mergeSuggestions = (arr1, arr2) => {
  const seen = new Set();
  const merged = [];
  [...arr1, ...arr2].forEach(item => {
    if (!seen.has(item.display_name)) {
      seen.add(item.display_name);
      merged.push(item);
    }
  });
  return merged.sort((a, b) => b.relevance - a.relevance);
};

const Carpool = ({ route }) => {
  const { userId, passengerId } = route.params || {};
  const mapRef = useRef(null);
  const navigation = useNavigation();

  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [pickupText, setPickupText] = useState('');
  const [dropoffText, setDropoffText] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [isPickupFocused, setIsPickupFocused] = useState(false);
  const [isDropoffFocused, setIsDropoffFocused] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [locationWatcher, setLocationWatcher] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [durationMin, setDurationMin] = useState(null);

  const translateToEnglish = async (text) => replaceUrduWords(text);

  const getNearestRoadPoint = async (coords) => {
    try {
      const matchRes = await axios.get(
        `https://api.mapbox.com/matching/v5/mapbox/driving/${coords.longitude},${coords.latitude}`,
        { params: { access_token: MAPBOX_TOKEN, geometries: 'geojson', radiuses: 50 } }
      );
      if (matchRes.data.matchings?.length > 0) {
        const snapped = matchRes.data.matchings[0].geometry.coordinates[0];
        return { latitude: snapped[1], longitude: snapped[0] };
      }
      return coords;
    } catch {
      return coords;
    }
  };

  const startWatchingLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }
      const watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 10 },
        async (loc) => {
          const { latitude, longitude } = loc.coords;
          setPickup({ latitude, longitude });
          const res = await axios.get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`,
            { params: { access_token: MAPBOX_TOKEN, limit: 1, language: 'en' } }
          );
          if (res.data.features?.length > 0) {
            const placeName = cleanAddress(res.data.features[0].place_name);
            setPickupText(placeName);
          }
        }
      );
      setLocationWatcher(watcher);
    } catch {
      Alert.alert('Error', 'Could not fetch your location.');
    }
  };

  const stopWatchingLocation = () => {
    if (locationWatcher) {
      locationWatcher.remove();
      setLocationWatcher(null);
    }
  };

  const getMapboxSuggestions = async (query) => {
    try {
      const res = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
        {
          params: {
            access_token: MAPBOX_TOKEN,
            bbox: bboxIslamabadRawalpindi,
            limit: 15,
            autocomplete: true,
            fuzzyMatch: true,
            types: 'address,street,poi,neighborhood,locality,place,district,region',
            language: 'en'
          }
        }
      );
      return Promise.all(res.data.features.map(async f => {
        let name = f.place_name;
        if (containsUrdu(name)) name = await translateToEnglish(name);
        return {
          title: f.text,
          subtitle: cleanAddress(name).replace(f.text + ', ', ''),
          display_name: cleanAddress(name),
          lat: f.center[1],
          lon: f.center[0],
          relevance: f.relevance
        };
      }));
    } catch {
      return [];
    }
  };

  const getNominatimSuggestions = async (query) => {
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=15&countrycodes=pk&bounded=1&viewbox=72.8,33.4,73.3,33.9&q=${encodeURIComponent(query)}`,
        { headers: { 'User-Agent': 'CarpoolApp/1.0' }, params: { 'accept-language': 'en' } }
      );
      return Promise.all(res.data.map(async f => {
        let name = f.display_name;
        if (containsUrdu(name)) name = await translateToEnglish(name);
        return {
          title: name.split(',')[0],
          subtitle: cleanAddress(name).replace(name.split(',')[0] + ', ', ''),
          display_name: cleanAddress(name),
          lat: parseFloat(f.lat),
          lon: parseFloat(f.lon),
          relevance: 0.5
        };
      }));
    } catch {
      return [];
    }
  };

  const fetchHybridSuggestions = useCallback(
    debounce(async (text, isPickup) => {
      if (!text || text.length < 2) return;
      stopWatchingLocation();
      setSuggestionsLoading(true);
      try {
        const [mapboxResults, nominatimResults] = await Promise.all([
          getMapboxSuggestions(text),
          getNominatimSuggestions(text)
        ]);
        const merged = mergeSuggestions(mapboxResults, nominatimResults);
        isPickup ? setPickupSuggestions(merged) : setDropoffSuggestions(merged);
      } catch (err) {
        console.warn('Suggestion error:', err);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 400),
    []
  );

  const handleSelect = async (item, isPickup) => {
    stopWatchingLocation();
    let coords = { latitude: item.lat, longitude: item.lon };
    coords = await getNearestRoadPoint(coords);
    if (isPickup) {
      setPickup(coords);
      setPickupText(item.display_name);
      setPickupSuggestions([]);
      setIsPickupFocused(false);
    } else {
      setDropoff(coords);
      setDropoffText(item.display_name);
      setDropoffSuggestions([]);
      setIsDropoffFocused(false);
    }
    Keyboard.dismiss();
  };

  const calculateRoute = async () => {
    if (!pickup || !dropoff) return;
    setRouteLoading(true);
    try {
      const start = await getNearestRoadPoint(pickup);
      const end = await getNearestRoadPoint(dropoff);
      const res = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}`,
        { params: { access_token: MAPBOX_TOKEN, geometries: 'geojson' } }
      );
      if (!res.data.routes.length) throw new Error("No route found");
      const coords = res.data.routes[0].geometry.coordinates.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
      setRouteCoords(coords);
      setDistanceKm((res.data.routes[0].distance / 1000).toFixed(2));
      setDurationMin((res.data.routes[0].duration / 60).toFixed(1));
      mapRef.current.fitToCoordinates(coords, { edgePadding: { top: 100, bottom: 100, left: 50, right: 50 }, animated: true });
    } catch {
      Alert.alert('Error', 'Could not calculate route. Try selecting a nearby road.');
    } finally {
      setRouteLoading(false);
    }
  };

  useEffect(() => {
    if (pickup && dropoff) calculateRoute();
  }, [pickup, dropoff]);

  const dismissKeyboardAndHideSuggestions = () => {
    Keyboard.dismiss();
    setIsPickupFocused(false);
    setIsDropoffFocused(false);
    setPickupSuggestions([]);
    setDropoffSuggestions([]);
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboardAndHideSuggestions}>
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{ latitude: 33.6844, longitude: 73.0479, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
        >
          {pickup && <Marker coordinate={pickup} pinColor="green" />}
          {dropoff && <Marker coordinate={dropoff} pinColor="red" />}
          {routeCoords.length > 0 && <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="blue" />}
        </MapView>

        <View style={styles.searchBox}>
          {/* Pickup Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Pickup location"
              value={pickupText}
              onChangeText={t => { setPickupText(t); fetchHybridSuggestions(t, true); }}
              onFocus={() => setIsPickupFocused(true)}
            />
            {pickupText.length > 0 && (
              <TouchableOpacity onPress={() => { setPickupText(''); setPickupSuggestions([]); }}>
                <MaterialIcons name="clear" size={20} color="gray" />
              </TouchableOpacity>
            )}
          </View>

          {isPickupFocused && (
            <FlatList
              style={styles.suggestionList}
              data={
                pickupText.length === 0
                  ? [{ display_name: '📍 Use My Current Location', isCurrentLocation: true }, ...pickupSuggestions]
                  : pickupSuggestions
              }
              keyboardShouldPersistTaps="handled"
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() =>
                    item.isCurrentLocation
                      ? startWatchingLocation()
                      : handleSelect(item, true)
                  }
                >
                  <Text style={[styles.item, item.isCurrentLocation && { fontWeight: 'bold', color: '#007bff' }]}>
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}

          {/* Dropoff Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Dropoff location"
              value={dropoffText}
              onChangeText={t => { setDropoffText(t); fetchHybridSuggestions(t, false); }}
              onFocus={() => setIsDropoffFocused(true)}
            />
            {dropoffText.length > 0 && (
              <TouchableOpacity onPress={() => { setDropoffText(''); setDropoffSuggestions([]); }}>
                <MaterialIcons name="clear" size={20} color="gray" />
              </TouchableOpacity>
            )}
          </View>

          {isDropoffFocused && dropoffSuggestions.length > 0 && (
            <FlatList
              style={styles.suggestionList}
              data={dropoffSuggestions}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleSelect(item, false)}>
                  <Text style={styles.item}>{item.display_name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {distanceKm && durationMin && (
          <View style={styles.bottomBox}>
            <Text style={styles.distance}>Distance: {distanceKm} km</Text>
            <Text style={styles.distance}>Estimated Time: {durationMin} min</Text>
            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() =>
                navigation.navigate('CarpoolProfile', {
                  userId,
                  passengerId,
                  pickupLocation: pickupText,
                  dropoffLocation: dropoffText,
                  distanceKm: parseFloat(distanceKm),  // Ensure it's a number
  durationMin: parseFloat(durationMin)
                })
              }
            >
              {routeLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.bookText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  searchBox: {
    position: 'absolute', top: 40, left: 10, right: 10,
    backgroundColor: '#fff', padding: 10, borderRadius: 10,
    zIndex: 10, maxHeight: 300
  },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  input: { flex: 1, height: 45, borderColor: '#ccc', borderWidth: 1, paddingHorizontal: 10, borderRadius: 5 },
  suggestionList: { maxHeight: 150, marginBottom: 8 },
  item: { padding: 10, borderBottomColor: '#eee', borderBottomWidth: 1 },
  bottomBox: {
    position: 'absolute', bottom: 30, left: 20, right: 20,
    backgroundColor: '#fff', padding: 15, borderRadius: 10,
    alignItems: 'center', elevation: 4
  },
  distance: { fontSize: 17, marginBottom: 5 },
  bookBtn: { backgroundColor: '#D64584', padding: 12, borderRadius: 8, width: '100%', alignItems: 'center' },
  bookText: { color: '#fff', fontWeight: 'bold' }
});

export default Carpool;
