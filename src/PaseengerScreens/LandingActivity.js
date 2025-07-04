import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet, Image } from 'react-native';

export default function LandingActivity({ navigation }) {

  return (
    <ImageBackground
source={require('../../assets/bg.png')}
      style={styles.background}
    >
      <View style={styles.overlay}>

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
        
        <Text style={styles.brandName}>Saheli</Text>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.rideshareText}>Saheli Rideshare</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}  // Apply button style
            onPress={() => navigation.navigate('Login')}  // Navigate to 'Login' screen
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}  // Apply button style
            onPress={() => navigation.navigate('Signup')}  // Navigate to 'Signup' screen
          >
            <Text style={styles.buttonText}>SignUp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(233, 30, 99, 0.6)',  // Pink overlay
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Ensure overlay is above background but below buttons
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
  brandName: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: -10,
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 19,
    color: '#fff',
    marginTop: 30,
  },
  rideshareText: {
    fontSize: 23,
    color: '#fff',
    marginBottom: -10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 30,
    zIndex: 2, // Ensure buttons are above overlay
  },
  button: {
    paddingVertical: 14,
    backgroundColor:"#E54A80",
    paddingHorizontal: 50,
    borderRadius: 30,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#fff', 
  },
  buttonText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#fff',
  },
});