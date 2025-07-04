import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  Linking,
  Dimensions,
  image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

const About = ({ navigation }) => {
  const openWebsite = (url) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <View style={styles.container}>
      {/* Updated Header to match Support.js */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
            <View style={styles.logoContainer}>
                              <Image
                                source={require('../../assets/IconWomen.png')}
                                style={styles.logoImage}
                              />
                              <Image
                                source={require('../../assets/location.png')}
                                style={styles.locationImage}
                              />
                            </View>
          <Text style={styles.title}>About SAHELI</Text>
          <Text style={styles.subtitle}>Empowering women through safe transportation</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.sectionText}>
            SAHELI is a women-only ride sharing platform designed to provide safe, affordable, and 
            convenient transportation options for women in Pakistan. We empower female drivers and 
            provide comfortable rides for female passengers.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={24} color="#d63384" />
            <Text style={styles.featureText}>Verified women drivers only</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="car-seat" size={24} color="#d63384" />
            <Text style={styles.featureText}>Comfortable women-only rides</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="wallet" size={24} color="#d63384" />
            <Text style={styles.featureText}>Affordable pricing</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="location" size={24} color="#d63384" />
            <Text style={styles.featureText}>Real-time tracking</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => Linking.openURL('mailto:support@saheli.com')}
          >
            <Ionicons name="mail" size={24} color="#d63384" />
            <Text style={styles.contactText}>support@saheli.com</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => Linking.openURL('tel:+923001234567')}
          >
            <Ionicons name="call" size={24} color="#d63384" />
            <Text style={styles.contactText}>+92 300 1234567</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Follow Us</Text>
          <View style={styles.socialIcons}>
            <TouchableOpacity onPress={() => openWebsite('https://facebook.com/saheli')}>
              <Ionicons name="logo-facebook" size={32} color="#1877F2" style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openWebsite('https://instagram.com/saheli')}>
              <Ionicons name="logo-instagram" size={32} color="#E1306C" style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openWebsite('https://twitter.com/saheli')}>
              <Ionicons name="logo-twitter" size={32} color="#1DA1F2" style={styles.icon} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2023 SAHELI Ride Sharing</Text>
          <Text style={styles.footerText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: '#d63384',
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2B2B52',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  icon: {
    marginHorizontal: 15,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#777',
    marginBottom: 5,
  },
  logoContainer: {
    flexDirection: 'row',  
    alignItems: 'center',  
    marginBottom: 10,
    zIndex: 2,
  },
  logoImage: {
    width: 100,  
    height: 100, 
  },
  locationImage: {
    width: 30,  
    height: 30, 
    marginLeft: -25, 
    marginBottom: 25,
  },
});

export default About;