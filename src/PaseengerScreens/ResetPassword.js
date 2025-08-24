import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { confirmPasswordReset, getAuth } from 'firebase/auth';
import * as Linking from 'expo-linking';
import axios from 'axios';
import { API_URL } from '../../api';

export default function ResetPassword({ navigation }) {
  const [oobCode, setOobCode] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const auth = getAuth();

useEffect(() => {
  const handleDeepLink = (url) => {
    if (!url) return;
    
    const parsed = Linking.parse(url);
    console.log('Parsed URL:', parsed);  // Debug logging
    
    if (parsed.path === 'ResetPassword' && parsed.queryParams?.code) {
      setOobCode(parsed.queryParams.code);
      if (parsed.queryParams.userEmail) {
        setEmail(parsed.queryParams.userEmail);
      }
    } else {
      Alert.alert("Error", "Invalid reset link");
      navigation.navigate("Login");
    }
  };

  // Handle both cold and warm starts
  Linking.getInitialURL()
    .then(handleDeepLink)
    .catch(err => console.error('URL handling error:', err));

  // Handle links while app is running
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url);
  });

  return () => subscription.remove();
}, []);

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      // Reset password in Firebase
      await confirmPasswordReset(auth, oobCode, password);

      // Update password in your backend
      await axios.post(`${API_URL}/api/update-password`, {
        email: email,
        newPassword: password
      });

      Alert.alert("Success", "Password has been reset!");
      navigation.navigate("Login");
    } catch (error) {
      console.error("Reset error:", error);
      Alert.alert("Error", error.message || "Failed to reset password");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Your Password</Text>
      {email ? <Text style={styles.emailText}>For: {email}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="New Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>Reset Password</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 22, marginBottom: 20, fontWeight: "bold" },
  emailText: { marginBottom: 20, color: '#666' },
  input: { 
    width: "100%", 
    borderWidth: 1, 
    borderColor: "#ccc", 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 12 
  },
  button: { 
    backgroundColor: "#007BFF", 
    padding: 15, 
    borderRadius: 8, 
    width: "100%" 
  },
  buttonText: { 
    color: "#fff", 
    fontWeight: "bold", 
    textAlign: "center" 
  }
});