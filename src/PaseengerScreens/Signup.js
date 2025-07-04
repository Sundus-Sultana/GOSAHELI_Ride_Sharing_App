import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  TouchableWithoutFeedback, 
  Platform,
  ActivityIndicator

} from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { updateProfile } from 'firebase/auth';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/setup';
import axios from 'axios'; // Add axios import


// Backend API endpoint to store user data (adjust IP for production)
const API_URL = 'http://192.168.100.28:5000/rider';

export default function Signup({ navigation }) {
  // Form field states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

   // Error state for each field
  const [errors, setErrors] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  
  // Refs for input focus control
  const emailRef = useRef(null);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  /**
   * =========================
   *   Field Validation Logic
   * =========================
   */
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validateUsername = (username) => {
    if (!username) return 'Username is required';
    if (username.length < 3) return 'Username must be at least 3 characters';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character';
    return '';
  };

  const validateConfirmPassword = (confirmPassword) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return '';
  };


  // Focus a specific field using its ref
  const handleFocus = (ref) => {
    ref.current.focus();
  };


   // Validate a field when user leaves it
  const handleBlur = (field) => {
    let errorMessage;
    switch (field) {
      case 'email':
        errorMessage = validateEmail(email);
        break;
      case 'username':
        errorMessage = validateUsername(username);
        break;
      case 'password':
        errorMessage = validatePassword(password);
        break;
      case 'confirmPassword':
        errorMessage = validateConfirmPassword(confirmPassword);
        break;
      default:
        break;
    }
    setErrors((prevErrors) => ({ ...prevErrors, [field]: errorMessage }));
  };


    // Reset all form inputs and error messages
  const clearForm = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setErrors({
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    });
  };


  // Android-specific prompt to save credentials in Google Smart Lock
  const promptSaveToGoogle = () => {
    if (Platform.OS === 'android') {
      Alert.alert(
        'Save to Google?',
        'Do you want to save your login credentials to your Google account for easy login next time?',
        [
          {
            text: 'Save',
            onPress: () => {
              Alert.alert('Success', 'Your credentials will be securely saved to your Google account');
            }
          },
          {
            text: 'Not now',
            style: 'cancel',
            onPress: () => {
              // Just continue without saving
            }
          }
        ]
      );
    }
  };




    /**
   * ====================================
   *   Main Signup Handler with Firebase
   * ====================================
   */
  const validateAndSignup = async () => {
    setIsLoading(true);
    // Trim whitespace from all inputs
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    // Run validations
    const emailError = validateEmail(trimmedEmail);
    const usernameError = validateUsername(trimmedUsername);
    const passwordError = validatePassword(trimmedPassword);
    const confirmPasswordError = validateConfirmPassword(trimmedConfirmPassword);

    
    // If any validation fails, show errors and return
    if (emailError || usernameError || passwordError || confirmPasswordError) {
      setErrors({
        email: emailError,
        username: usernameError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
      });
      setIsLoading(false);
      return;
    }
    try {
      // 1. Create user with email/password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        trimmedPassword
      );
  
      // 2. Store user info in PostgreSQL
      await axios.post(API_URL, {
        email: trimmedEmail,
        username: trimmedUsername,
        password: trimmedPassword, // Optional: consider hashing passwords in production
      });
  
      // 3. Optional: Update the user's profile with the username
      await updateProfile(userCredential.user, {
        displayName: trimmedUsername, // Store the username as displayName
      });
  
      // 4. Reload user data to ensure updates are applied
      await auth.currentUser.reload();
  


      // 5. Alert success and prompt credential save
      Alert.alert(
        'Account Created',
        'Your account has been created successfully!',
        [
          {
            text: 'Continue',
            onPress: () => {
              promptSaveToGoogle();
              clearForm();
              navigation.navigate('Home');
            },
          },
        ]
      );
    
    } catch (error) {
      console.error('Signup error:', error);
      let errorMessage = 'Signup failed. Please try again.';
      
       // Handle known Firebase error codes
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already in use.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled.';
          break;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <Text style={styles.header}>Create Account</Text>
        <Text style={styles.subtitle}>Join us today!</Text>

        {/* Email Input */}
        <TouchableWithoutFeedback onPress={() => handleFocus(emailRef)}>
          <View style={[styles.inputContainer, errors.email && styles.inputError]}>
            <FontAwesome5 name="envelope" size={18} color="#E91E63" style={styles.inputIcon} />
            <TextInput
              ref={emailRef}
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              onBlur={() => handleBlur('email')}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => usernameRef.current.focus()}
            />
            {errors.email && <MaterialIcons name="error" size={20} color="#FF3B30" style={styles.errorIcon} />}
          </View>
        </TouchableWithoutFeedback>
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : <View style={styles.errorSpacer} />}

        {/* Username Input */}
        <TouchableWithoutFeedback onPress={() => handleFocus(usernameRef)}>
          <View style={[styles.inputContainer, errors.username && styles.inputError]}>
            <FontAwesome5 name="user" size={18} color="#E91E63" style={styles.inputIcon} />
            <TextInput
              ref={usernameRef}
              placeholder="Username"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
              onBlur={() => handleBlur('username')}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current.focus()}
            />
            {errors.username && <MaterialIcons name="error" size={20} color="#FF3B30" style={styles.errorIcon} />}
          </View>
        </TouchableWithoutFeedback>
        {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : <View style={styles.errorSpacer} />}

        {/* Password Input */}
        <View style={[styles.inputContainer, errors.password && styles.inputError]}>
          <MaterialIcons name="lock-outline" size={20} color="#E91E63" style={styles.inputIcon} />
          <TextInput
            ref={passwordRef}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            onBlur={() => handleBlur('password')}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordRef.current.focus()}
          />
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)} 
            style={styles.showButton}
          >
            <MaterialIcons 
              name={showPassword ? 'visibility' : 'visibility-off'} 
              size={20} 
              color="#888" 
            />
          </TouchableOpacity>
          {errors.password && <MaterialIcons name="error" size={20} color="#FF3B30" style={styles.errorIcon} />}
        </View>
        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : <View style={styles.errorSpacer} />}

        {/* Confirm Password Input */}
        <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
          <MaterialIcons name="lock-outline" size={20} color="#E91E63" style={styles.inputIcon} />
          <TextInput
            ref={confirmPasswordRef}
            placeholder="Confirm Password"
            placeholderTextColor="#888"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            onBlur={() => handleBlur('confirmPassword')}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />
          <TouchableOpacity 
            onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
            style={styles.showButton}
          >
            <MaterialIcons 
              name={showConfirmPassword ? 'visibility' : 'visibility-off'} 
              size={20} 
              color="#888" 
            />
          </TouchableOpacity>
          {errors.confirmPassword && <MaterialIcons name="error" size={20} color="#FF3B30" style={styles.errorIcon} />}
        </View>
        {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : <View style={styles.errorSpacer} />}

        {/* Signup Button */}
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={validateAndSignup}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    paddingVertical: 0,
  },
  inputIcon: {
    marginRight: 10,
  },
  showButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorIcon: {
    marginLeft: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 12,
    marginTop: 2,
  },
  errorSpacer: {
    height: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#E91E63',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#E91E63',
    fontSize: 14,
    fontWeight: '600',
  },
});  