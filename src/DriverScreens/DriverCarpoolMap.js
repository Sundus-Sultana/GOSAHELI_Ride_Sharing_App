import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, Alert, Keyboard
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic3VuZHVzc3VsdGFuYSIsImEiOiJjbWFzYXd6MXYwZHdjMnFzNW51OHFxbW1iIn0.3WX-TCF91Jh3Go-pjGwAOg';
const BASE_FARE_PKR = 100;
const PER_KM_RATE_PKR = 30;
const bboxIslamabadRawalpindi = '72.8,33.4,73.3,33.9';

// ✅ Smart English filter: not too strict
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

const DriverCarpoolMap = ({ route }) => {
  // Receive but don't use userId
  const { userId } = route.params;
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
      const commonFix = {
        'iiui': 'international islamic university',
        'sadqabad': 'sadiqabad'
      };
      const fixedText = commonFix[text.toLowerCase()] || text;

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

      if (results.length < 3) {
        const nomRes = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: fixedText,
            format: 'json',
            addressdetails: 1,
            viewbox: '72.8,33.9,73.3,33.4',
            bounded: 1,
            countrycodes: 'pk',
            limit: 10
          },
          headers: { 'User-Agent': 'YourApp/1.0' }
        });

        const nomResults = nomRes.data
          .map(f => {
            const name = f.address?.suburb || f.address?.neighbourhood || f.address?.road || f.address?.village || f.address?.city || f.display_name.split(',')[0];
            return {
              display_name: name,
              lat: parseFloat(f.lat),
              lon: parseFloat(f.lon),
              relevance: 0.5,
              source: 'nominatim'
            };
          })
          .filter(r => r.display_name && isMostlyEnglish(r.display_name));

        results = [...results, ...nomResults];
      }

      const clean = [];
      const seen = new Set();
      for (const r of results) {
        if (r.display_name && isMostlyEnglish(r.display_name) && !seen.has(r.display_name)) {
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
    if (pickup && dropoff) calculateRoute();
  }, [pickup, dropoff]);

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
          onChangeText={t => { setPickupText(t); fetchSuggestions(t, true); }}
          onFocus={() => setIsPickupFocused(true)}
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
          onChangeText={t => { setDropoffText(t); fetchSuggestions(t, false); }}
          onFocus={() => setIsDropoffFocused(true)}
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
        onPress: () => navigation.navigate('DriverCarpoolProfile',{
        userId: userId , // Pass it forward
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
}

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

export default DriverCarpoolMap;