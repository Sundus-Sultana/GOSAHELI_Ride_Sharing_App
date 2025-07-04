import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/setup';
import axios from 'axios';
import { API_URL } from '../../api.js'; // Use relative path instead of absolute

export default function ForgotPassword({ navigation, route }) {
  const [email, setEmail] = useState(route.params?.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);

  useEffect(() => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    setIsEmailValid(emailRegex.test(email));
  }, [email]);

  const checkEmailExists = async (email) => {
    try {
      const response = await axios.get(`${API_URL}/rider?email=${email}`, {
        timeout: 5000 // Add timeout to prevent hanging
      });
      return response.data.length > 0;
    } catch (error) {
      console.error('Error checking email:', error);
      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timeout - server not responding');
      }
      throw error;
    }
  };

  const handleResetPassword = async () => {
    if (!isEmailValid) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // Try Firebase first as fallback
      try {
        const emailExists = await checkEmailExists(email);
        if (!emailExists) {
          Alert.alert('Error', 'No account found with this email address');
          return;
        }
      } catch (dbError) {
        console.warn('Database check failed, trying Firebase directly:', dbError);
        // Continue with Firebase even if DB check fails
      }

      await sendPasswordResetEmail(auth, email);
      
      Alert.alert(
        'Password Reset Sent',
        `We've sent a password reset link to ${email}. Please check your email.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Reset Password Error:', error);
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.message.includes('Network Error') || error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Server is not responding. Please try again later.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password
        </Text>
      </View>

      <View style={styles.formContainer}>
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
            editable={!route.params?.email}
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, (isLoading || !isEmailValid) && styles.buttonDisabled]} 
          onPress={handleResetPassword}
          disabled={isLoading || !isEmailValid}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 25,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 40,
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
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 25,
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
  },
  button: {
    backgroundColor: '#E91E63',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#E91E63',
    fontSize: 16,
    fontWeight: '500',
  },
});