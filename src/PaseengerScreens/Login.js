import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/setup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../../api.js'; 

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const clearLoginForm = () => {
    setEmail('');
    setPassword('');
    setRememberMe(false);
  };

  const validateAndLogin = async () => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!email || !emailRegex.test(email)) {
    Alert.alert('Error', 'Please enter a valid email address');
    return;
  }

  if (!password || password.length < 6) {
    Alert.alert('Error', 'Password must be at least 6 characters');
    return;
  }

  setIsLoading(true);

  try {
    // Step 1: Authenticate with your PostgreSQL database
    const loginResponse = await axios.post(`${API_URL}/login`, {
      email,
      password
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    // Step 2: Get complete user data
    const userResponse = await axios.get(`${API_URL}/user?email=${email}`);
    const userData = userResponse.data[0];

    if (!userData) throw new Error('User record not found');

    // Remember Me logic
    if (rememberMe) {
      await AsyncStorage.setItem('userCredentials', JSON.stringify({
        email,
        password,
        rememberMe: true,
      }));
    } else {
      await AsyncStorage.removeItem('userCredentials');
    }

    // Store UserID (note the exact case matching your database)
    await AsyncStorage.setItem('UserID', String(userData.UserID));

    // Navigate to Home
    clearLoginForm();
    navigation.navigate('Home', {
      userName: userData.username || 'User',
      userId: userData.UserID,  // Consistent casing
    });

  } catch (error) {
    console.error('Login Error:', error);
    let errorMessage = 'Login failed. Please try again.';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message.includes('User record')) {
      errorMessage = 'Account not properly registered';
    }
    Alert.alert('Error', errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Hey SAHELI! Good to see you again</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <FontAwesome5 name="envelope" size={18} color="#D64584" style={styles.icon} />
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

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock-outline" size={20} color="#D64584" style={styles.icon} />
            <TextInput
              placeholder="Password"
              value={password}
              secureTextEntry={!showPassword}
              onChangeText={setPassword}
              style={styles.input}
              placeholderTextColor="#999"
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)} 
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showPassword ? "eye" : "eye-off"} 
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
                color="#D64584" 
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

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={validateAndLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>

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
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    zIndex: 1,
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
    color: '#D64584',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#D64584',
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
    color: '#D64584',
    fontWeight: '500',
  },
});
