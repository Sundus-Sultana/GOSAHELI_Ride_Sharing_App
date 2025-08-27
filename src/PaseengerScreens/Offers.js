import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

const Offers = () => {
  const [scaleValue] = useState(new Animated.Value(0));
  const [fadeValue] = useState(new Animated.Value(0));

  // Start animations
  useEffect(() => {
    // Scale up animation
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.elastic(1),
      useNativeDriver: true
    }).start();

    // Fade in animation
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#d63384" barStyle="light-content" />
      
      <View style={styles.container}>
        {/* Pakistan Flag Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Offers & Rewards</Text>
          <Ionicons name="flag" size={24} color="white" />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Animated.View style={[styles.imageContainer, { transform: [{ scale: scaleValue }] }]}>
            <Image 
              source={require('../../assets/flag.jpg')} // Add your flag image
              style={styles.flagImage}
            />
          </Animated.View>

          <Animated.View style={[styles.textContainer, { opacity: fadeValue }]}>
            <Text style={styles.mainText}>Special Azadi Offers</Text>
            <Text style={styles.comingSoonText}>Coming Soon!</Text>
            <Text style={styles.subText}>Celebrate 78th years of freedom with exclusive discounts</Text>
          </Animated.View>

          {/* Countdown Timer (Static) */}
          <View style={styles.countdownContainer}>
            <View style={styles.countdownBox}>
              <Text style={styles.countdownNumber}>14</Text>
              <Text style={styles.countdownLabel}>August</Text>
            </View>
          </View>

          {/* Notification Button
          <TouchableOpacity 
            style={styles.notifyButton}
            onPress={() => Alert.alert("Notification Set", "We'll notify you when Azadi offers go live!")}
          >
            <Ionicons name="notifications-outline" size={20} color="#046A38" />
            <Text style={styles.notifyText}>Notify Me</Text>
          </TouchableOpacity> */}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>🇵🇰 Pakistan Zindabad! 🇵🇰</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e6f0ebff"
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  header: {
    backgroundColor: '#d63384',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  imageContainer: {
    marginBottom: 30
  },
  flagImage: {
    width: 150,
    height: 100,
    resizeMode: 'contain'
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40
  },
  mainText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#324c37',
    marginBottom: 10,
    textAlign: 'center'
  },
  comingSoonText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#324c37',
    marginBottom: 15,
    textAlign: 'center'
  },
  subText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    maxWidth: 300
  },
  countdownContainer: {
    flexDirection: 'row',
    marginBottom: 30
  },
  countdownBox: {
    backgroundColor: '#324c37',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 80
  },
  countdownNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white'
  },
  countdownLabel: {
    fontSize: 14,
    color: 'white',
    marginTop: 5
  },
  notifyButton: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#324c37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  notifyText: {
    color: '#324c37',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8
  },
  footer: {
    padding: 15,
    backgroundColor: '#324c37'
  },
  footerText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default Offers;