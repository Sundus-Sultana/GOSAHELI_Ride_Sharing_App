import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, Alert, Keyboard
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic3VuZHVzc3VsdGFuYSIsImEiOiJjbWFzYXd6MXYwZHdjMnFzNW51OHFxbW1iIn0.3WX-TCF91Jh3Go-pjGwAOg';
const BASE_FARE_PKR = 100;
const PER_KM_RATE_PKR = 30;
const bboxIslamabadRawalpindi = '72.8,33.4,73.3,33.9';

const isMostlyEnglish = (text) => {
  const englishChars = text.match(/[a-zA-Z]/g) || [];
  const ratio = englishChars.length / text.length;
  return ratio > 0.4;
};

const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

const Carpool = ({ route }) => {
  const { userId, pickupLocation = '', dropoffLocation = '' } = route.params || {};
    const mapRef = useRef(null);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [pickupText, setPickupText] = useState('');
  const [dropoffText, setDropoffText] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [isPickupFocused, setIsPickupFocused] = useState(false);
  const [isDropoffFocused, setIsDropoffFocused] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [price, setPrice] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const navigation = useNavigation();

  const fetchSuggestions = useCallback(debounce(async (text, isPickup) => {
    if (!text || text.length < 2) return;
    setSuggestionsLoading(true);
    try {
      const fixedText = {
        'iiui': 'international islamic university',
        'sadqabad': 'sadiqabad'
      }[text.toLowerCase()] || text;

      const mapbox = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fixedText)}.json`, {
        params: {
          access_token: MAPBOX_TOKEN,
          bbox: bboxIslamabadRawalpindi,
          limit: 20,
          autocomplete: true,
          fuzzyMatch: true
        }
      });

      let results = mapbox.data.features
        .map(f => ({
          display_name: f.text || f.place_name.split(',')[0],
          lat: f.center[1],
          lon: f.center[0],
          relevance: f.relevance,
          source: 'mapbox'
        }))
        .filter(r => r.display_name && isMostlyEnglish(r.display_name));

      const clean = [];
      const seen = new Set();
      for (const r of results) {
        if (!seen.has(r.display_name)) {
          clean.push(r);
          seen.add(r.display_name);
        }
      }

      clean.sort((a, b) => b.relevance - a.relevance);
      isPickup ? setPickupSuggestions(clean) : setDropoffSuggestions(clean);
    } catch (err) {
      console.warn('Suggestions error:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  }, 400), []);

  const fetchSuggestionsAndReturn = async (text) => {
    if (!text || text.length < 2) return [];
    try {
      const fixedText = {
        'iiui': 'international islamic university',
        'sadqabad': 'sadiqabad'
      }[text.toLowerCase()] || text;

      const mapbox = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fixedText)}.json`, {
        params: {
          access_token: MAPBOX_TOKEN,
          bbox: bboxIslamabadRawalpindi,
          limit: 10,
          autocomplete: true,
          fuzzyMatch: true
        }
      });

      let results = mapbox.data.features
        .map(f => ({
          display_name: f.text || f.place_name.split(',')[0],
          lat: f.center[1],
          lon: f.center[0],
          relevance: f.relevance
        }))
        .filter(r => r.display_name && isMostlyEnglish(r.display_name));

      results.sort((a, b) => b.relevance - a.relevance);
      return results;
    } catch (e) {
      return [];
    }
  };

  const handleSelect = (item, isPickup) => {
    const coords = { latitude: item.lat, longitude: item.lon };
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
      const res = await axios.get(`https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.longitude},${pickup.latitude};${dropoff.longitude},${dropoff.latitude}`, {
        params: {
          access_token: MAPBOX_TOKEN,
          geometries: 'geojson'
        }
      });
      const coords = res.data.routes[0].geometry.coordinates.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
      setRouteCoords(coords);
      const distKm = res.data.routes[0].distance / 1000;
      setPrice(Math.round(BASE_FARE_PKR + distKm * PER_KM_RATE_PKR));
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 100, bottom: 100, left: 50, right: 50 },
        animated: true
      });
    } catch (err) {
      Alert.alert('Error', 'Could not calculate route');
    } finally {
      setRouteLoading(false);
    }
  };

useEffect(() => {
  console.log('ROUTE PARAMS:', route.params);
  console.log('Pickup:', pickupLocation);
  console.log('Dropoff:', dropoffLocation);
}, [route.params]);
 //useEffect(() => {
  //if (route.params?.pickupLocation) {
   // setPickup(route.params.pickupLocation);
 // }
 // if (route.params?.dropoffLocation) {
  //  setDropoff(route.params.dropoffLocation);
  //}
//}, [route.params]);

  useEffect(() => {
    if (pickup && dropoff) calculateRoute();
  }, [pickup, dropoff]);

  useEffect(() => {
    const autoFill = async () => {
      await new Promise(res => setTimeout(res, 300));

      if (pickupLocation && pickupText.trim().toLowerCase() !== pickupLocation.trim().toLowerCase()) {
        setPickupText(pickupLocation);
        const suggestions = await fetchSuggestionsAndReturn(pickupLocation);
        if (suggestions.length > 0) {
          const first = suggestions[0];
          setPickup({ latitude: first.lat, longitude: first.lon });
          setPickupText(first.display_name);
        }
      }

      if (dropoffLocation && dropoffText.trim().toLowerCase() !== dropoffLocation.trim().toLowerCase()) {
        setDropoffText(dropoffLocation);
        const suggestions = await fetchSuggestionsAndReturn(dropoffLocation);
        if (suggestions.length > 0) {
          const first = suggestions[0];
          setDropoff({ latitude: first.lat, longitude: first.lon });
          setDropoffText(first.display_name);
        }
      }
    };
    autoFill();
  }, []);

  return (
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
        <TextInput
          style={styles.input}
          placeholder="Pickup location"
          value={pickupText}
          onChangeText={t => {
            setPickupText(t);
            if (!pickupLocation) fetchSuggestions(t, true);
          }}
          onFocus={() => {
            if (!pickupLocation) setIsPickupFocused(true);
          }}
        />
        {isPickupFocused && (
          <FlatList
            data={pickupSuggestions}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSelect(item, true)}>
                <Text style={styles.item}>{item.display_name}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Dropoff location"
          value={dropoffText}
          onChangeText={t => {
            setDropoffText(t);
            if (!dropoffLocation) fetchSuggestions(t, false);
          }}
          onFocus={() => {
            if (!dropoffLocation) setIsDropoffFocused(true);
          }}
        />
        {isDropoffFocused && (
          <FlatList
            data={dropoffSuggestions}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSelect(item, false)}>
                <Text style={styles.item}>{item.display_name}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {price && (
        <View style={styles.bottomBox}>
          <Text style={styles.price}>Estimated Fare: {price} PKR</Text>
          <TouchableOpacity style={styles.bookBtn} onPress={() => {
            Alert.alert(
              'Booked',
              `Fare: ${price} PKR`,
              [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('CarpoolProfile', {
                    userId,
                    pickupLocation: pickupText,
                    dropoffLocation: dropoffText
                  })
                }
              ]
            );
          }}>
            {routeLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookText}>Book Ride</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  searchBox: {
    position: 'absolute', top: 40, left: 10, right: 10,
    backgroundColor: '#fff', padding: 10, borderRadius: 10,
    zIndex: 10
  },
  input: {
    height: 45,
    borderColor: '#ccc', borderWidth: 1,
    paddingHorizontal: 10, borderRadius: 5,
    marginBottom: 8
  },
  item: {
    padding: 10, borderBottomColor: '#eee', borderBottomWidth: 1
  },
  bottomBox: {
    position: 'absolute', bottom: 30, left: 20, right: 20,
    backgroundColor: '#fff', padding: 15, borderRadius: 10,
    alignItems: 'center', elevation: 4
  },
  price: { fontSize: 18, marginBottom: 10 },
  bookBtn: {
    backgroundColor: '#28a745', padding: 12,
    borderRadius: 8, width: '100%', alignItems: 'center'
  },
  bookText: { color: '#fff', fontWeight: 'bold' }
});

export default Carpool;
