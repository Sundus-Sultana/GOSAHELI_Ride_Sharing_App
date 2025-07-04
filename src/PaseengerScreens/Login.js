import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons'; // Added Ionicons
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/setup';
import AsyncStorage from '@react-native-async-storage/async-storage';   // For storing data locally
import axios from 'axios';   // HTTP client for API requests
import {  reload } from 'firebase/auth';



export default function Login({ navigation }) {
   // State variables for user input, loading state, and toggle options
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);  // Checkbox state
  const [showPassword, setShowPassword] = useState(false); // Toggle for showing/hiding password

  // When the component mounts, try to load saved email and password (if 'Remember Me' was selected)
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedCredentials = await AsyncStorage.getItem('userCredentials');
        if (savedCredentials) {
          const { email: savedEmail, password: savedPassword, rememberMe: savedRememberMe } = JSON.parse(savedCredentials);
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(savedRememberMe);
        }
      } catch (error) {
        console.error('Error loading credentials:', error);
      }
    };
    
    loadSavedCredentials();
  }, []);



// Clears the form fields and checkbox
  const clearLoginForm = () => {
    setEmail('');
    setPassword('');
    setRememberMe(false);
  };




  // Main function to validate user input and log them in
  const validateAndLogin = async () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  // Basic email validation using regex
    if (!email || !emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
  
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
  // Start loading state
    setIsLoading(true);
  
    try {
      // 1. First authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // 2. Then get rider details from PostgreSQL
      const response = await axios.get(`http://192.168.100.28:5000/rider?email=${email}`);
      const riderData = response.data[0];
  
      if (!riderData) {
        throw new Error('rider record not found');
      }
  
      // 3. Save credentials if Remember Me is checked
      if (rememberMe) {
        await AsyncStorage.setItem('userCredentials', JSON.stringify({
          email,
          password,
          rememberMe: true,
        }));
      } else {
        await AsyncStorage.removeItem('userCredentials');
      }
     
      // 4. Navigate to Home with username
      clearLoginForm();
      navigation.navigate('Home', { 
        userName: riderData.username || 'rider' 
      });
  
    } catch (error) {
       // Handle specific Firebase error codes
      console.error('Login Error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      } else if (error.message.includes('rider record')) {
        errorMessage = 'Account not properly registered';
      }
      
      Alert.alert('Error', errorMessage);  // Show alert to user
    } finally {
      setIsLoading(false); // Stop loading state
    }
  };
  




  // UI for the login screen
  return (
    <View style={styles.container}>
    {/* Welcome header */}
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Hey SAHELI! Good to see you again</Text>
      </View>
     {/* Login form */}
      <View style={styles.formContainer}>
         {/* Email input field */}
        <View style={styles.inputContainer}>
          <FontAwesome5 name="envelope" size={18} color="#E91E63" style={styles.icon} />
          <TextInput
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />
        </View>
        
 {/* Password input with eye icon toggle */}
<View style={styles.inputContainer}>
  <MaterialIcons name="lock-outline" size={20} color="#E91E63" style={styles.icon} />
  <TextInput
    placeholder="Password"
    value={password}
    secureTextEntry={!showPassword} // Show password when showPassword is true
    onChangeText={setPassword}
    style={styles.input}
    placeholderTextColor="#999"
  />
  <TouchableOpacity 
    onPress={() => setShowPassword(!showPassword)} // Proper toggle
    style={styles.eyeIcon}
  >
    <Ionicons 
      name={showPassword ? "eye" : "eye-off"} // Correct icon logic
      size={20} 
      color="#6C757D" 
    />
  </TouchableOpacity>
</View>

        <View style={styles.optionsRow}>
          <TouchableOpacity 
            style={styles.rememberMe} 
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.7}
          >
            <FontAwesome5 
              name={rememberMe ? "check-square" : "square"} 
              size={18} 
              color="#E91E63" 
            />
            <Text style={styles.rememberText}>Remember me</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('ForgotPassword', { email })}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
          {/* Login button */}
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={validateAndLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>
      
        {/* Signup navigation link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.footerLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2B2B52',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingRight: 40,
  },
 eyeIcon: {
  position: 'absolute',
  right: 15,
  padding: 8,
  zIndex: 1, // Add this to ensure the icon stays above the input
},
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 25,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    marginLeft: 8,
    color: '#2B2B52',
    fontSize: 14,
  },
  forgotPassword: {
    color: '#E91E63',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#E91E63',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  footerText: {
    color: '#6C757D',
    marginRight: 5,
  },
  footerLink: {
    color: '#E91E63',
    fontWeight: '500',
  },
});