import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  TouchableWithoutFeedback, Platform, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../../api.js';

export default function Registration({ navigation }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNo, setPhoneNo] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState({
    email: '', username: '', password: '', confirmPassword: '', phoneNo: ''
  });

  const emailRef = useRef(null);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const phoneRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('LandingActivity'); // ← Replace with your actual screen
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );


  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Enter a valid email';
    return '';
  };

  const validateUsername = (username) => {
    if (!username) return 'Username is required';
    if (username.length < 3) return 'At least 3 characters';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Minimum 6 characters';
    if (!/[A-Z]/.test(password)) return 'Must include an uppercase letter';
    if (!/[0-9]/.test(password)) return 'Must include a number';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Must include a special character';
    return '';
  };

  const validateConfirmPassword = (confirmPassword) => {
    if (!confirmPassword) return 'Confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return '';
  };

  const validatePhone = (phoneNo) => {
    if (!phoneNo) return 'Phone number is required';
    if (!/^\+?\d{10,15}$/.test(phoneNo)) return 'Enter a valid phone number';
    return '';
  };

  const handleBlur = (field) => {
    let errorMessage;
    switch (field) {
      case 'email': errorMessage = validateEmail(email); break;
      case 'username': errorMessage = validateUsername(username); break;
      case 'password': errorMessage = validatePassword(password); break;
      case 'confirmPassword': errorMessage = validateConfirmPassword(confirmPassword); break;
      case 'phoneNo': errorMessage = validatePhone(phoneNo); break;
    }
    setErrors(prev => ({ ...prev, [field]: errorMessage }));
  };

  const registerUser = async () => {
    setIsLoading(true);

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    const trimmedPhone = phoneNo.trim();

    const emailError = validateEmail(trimmedEmail);
    const usernameError = validateUsername(trimmedUsername);
    const passwordError = validatePassword(trimmedPassword);
    const confirmPasswordError = validateConfirmPassword(trimmedConfirmPassword);
    const phoneError = validatePhone(trimmedPhone);

    if (emailError || usernameError || passwordError || confirmPasswordError || phoneError) {
      setErrors({
        email: emailError,
        username: usernameError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
        phoneNo: phoneError
      });
      setIsLoading(false);
      return;
    }

    try {
      // ✅ Step: Check if email or phone exists
      const response = await axios.post(`${API_URL}/user/check-exists`, {
        email: trimmedEmail,
        phoneNo: trimmedPhone
      });

      const { emailExists, phoneExists } = response.data;

      const newErrors = {};
      if (emailExists) newErrors.email = 'Email already in use';
      if (phoneExists) newErrors.phoneNo = 'Phone number already registered';

      if (emailExists || phoneExists) {
        setErrors(prev => ({ ...prev, ...newErrors }));
        setIsLoading(false);
        return;
      }

      // ✅ Step: All good — go to OTP screen
      navigation.navigate('PhoneVerificationScreen', {
        email: trimmedEmail,
        userName: trimmedUsername,
        password: trimmedPassword,
        phoneNo: trimmedPhone,
      });
    } catch (error) {
      console.error('Check exist error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <Text style={styles.header}>Create Account</Text>
        <Text style={styles.subtitle}>Join us today!</Text>

        {/* Email */}
        <TouchableWithoutFeedback onPress={() => emailRef.current.focus()}>
          <View style={[styles.inputContainer, errors.email && styles.inputError]}>
            <FontAwesome5 name="envelope" size={18} color="#D64584" style={styles.inputIcon} />
            <TextInput
              ref={emailRef}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              onBlur={() => handleBlur('email')}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => usernameRef.current.focus()}
            />
            {errors.email && <MaterialIcons name="error" size={20} color="red" style={styles.errorIcon} />}
          </View>
        </TouchableWithoutFeedback>
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : <View style={styles.errorSpacer} />}

        {/* Username */}
        <TouchableWithoutFeedback onPress={() => usernameRef.current.focus()}>
          <View style={[styles.inputContainer, errors.username && styles.inputError]}>
            <FontAwesome5 name="user" size={18} color="#D64584" style={styles.inputIcon} />
            <TextInput
              ref={usernameRef}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              onBlur={() => handleBlur('username')}
              style={styles.input}
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current.focus()}
            />
            {errors.username && <MaterialIcons name="error" size={20} color="red" style={styles.errorIcon} />}
          </View>
        </TouchableWithoutFeedback>
        {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : <View style={styles.errorSpacer} />}

        {/* Phone Number */}
        <View style={[styles.inputContainer, errors.phoneNo && styles.inputError]}>
          <MaterialIcons name="phone" size={20} color="#D64584" style={styles.inputIcon} />
          <TextInput
            ref={phoneRef}
            placeholder="Phone Number"
            value={phoneNo}
            onChangeText={setPhoneNo}
            onBlur={() => handleBlur('phoneNo')}
            keyboardType="phone-pad"
            style={styles.input}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current.focus()}
          />
          {errors.phoneNo && <MaterialIcons name="error" size={20} color="red" style={styles.errorIcon} />}
        </View>
        {errors.phoneNo ? <Text style={styles.errorText}>{errors.phoneNo}</Text> : <View style={styles.errorSpacer} />}

        {/* Password */}
        <View style={[styles.inputContainer, errors.password && styles.inputError]}>
          <MaterialIcons name="lock-outline" size={20} color="#D64584" style={styles.inputIcon} />
          <TextInput
            ref={passwordRef}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            onBlur={() => handleBlur('password')}
            secureTextEntry={!showPassword}
            style={styles.input}
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordRef.current.focus()}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showButton}>
            <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color="#888" />
          </TouchableOpacity>
          {errors.password && <MaterialIcons name="error" size={20} color="red" style={styles.errorIcon} />}
        </View>
        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : <View style={styles.errorSpacer} />}

        {/* Confirm Password */}
        <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
          <MaterialIcons name="lock" size={20} color="#D64584" style={styles.inputIcon} />
          <TextInput
            ref={confirmPasswordRef}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onBlur={() => handleBlur('confirmPassword')}
            secureTextEntry={!showConfirmPassword}
            style={styles.input}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.showButton}>
            <MaterialIcons name={showConfirmPassword ? 'visibility' : 'visibility-off'} size={20} color="#888" />
          </TouchableOpacity>
          {errors.confirmPassword && <MaterialIcons name="error" size={20} color="red" style={styles.errorIcon} />}
        </View>
        {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : <View style={styles.errorSpacer} />}

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={registerUser}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
        </TouchableOpacity>

        {/* Go to Login */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: {
    width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 12, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  header: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 24, textAlign: 'center' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5',
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 4, borderWidth: 1, borderColor: '#f5f5f5',
  },
  inputError: { borderColor: '#FF3B30' },
  input: { flex: 1, fontSize: 16, color: '#333', marginLeft: 10 },
  inputIcon: { marginRight: 10 },
  errorIcon: { marginLeft: 8 },
  errorText: { color: '#FF3B30', fontSize: 12, marginBottom: 12, marginTop: 2 },
  errorSpacer: { height: 14, marginBottom: 12 },
  showButton: { padding: 4, marginLeft: 8 },
  button: {
    backgroundColor: '#D64584', borderRadius: 10, padding: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 24,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { color: '#666', fontSize: 14 },
  loginLink: { color: '#D64584', fontSize: 14, fontWeight: '600' },
});
