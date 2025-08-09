import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons} from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../api';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';



const ChangePassword = ({ navigation, route }) => {
  const { userId } = route.params;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);



  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('SettingsScreen', { userId });
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove(); // Clean up on unmount
    }, [])
  );

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Alert.alert('Error', 'Please fill all fields');
    }

    if (newPassword.length < 6) {
      return Alert.alert('Weak Password', 'Password should be at least 6 characters long');
    }

    if (currentPassword === newPassword) {
      return Alert.alert('Error', 'New password cannot be same as current password');
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert('Error', 'New passwords do not match');
    }

    try {
  setLoading(true);
  console.log('URL Hitting:', `${API_URL}/api/change-password`);

  const res = await axios.post(`${API_URL}/api/change-password`, {
    userId,
    currentPassword,
    newPassword,
  });

  if (res.data.success) {
   

    // ✅ Save in backend DB (Notification table)
    await axios.post(`${API_URL}/api/save-notification`, {
      userId,
      type: 'Password Change',
      message: 'Your password was successfully updated.'
    });

    Alert.alert('Success', 'Password updated successfully');
    Toast.show({
  type: 'success',
  text1: 'Password Changed',
  text2: 'Your password has been updated successfully.',
});
    navigation.goBack();
  } else {
    Alert.alert('Error', res.data.message || 'Password update failed');
  }
} catch (err) {
  console.error('Password Change Error:', err.response?.data || err.message);
  if (err.response?.status === 400 || err.response?.status === 404) {
    Alert.alert('Error', err.response.data.message || 'Invalid request');
  } else {
    Alert.alert('Error', 'Something went wrong');
  }
} finally {
  setLoading(false);
}
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#d63384" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          {/* Current Password */}
          <View style={styles.passwordInput}>
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              secureTextEntry={!showCurrent}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
              <Ionicons name={showCurrent ? "eye" : "eye-off"} size={24} color="#888" />
            </TouchableOpacity>
          </View>

          {/* New Password */}
          <View style={styles.passwordInput}>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry={!showNew}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)}>
              <Ionicons name={showNew ? "eye" : "eye-off"} size={24} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={styles.passwordInput}>
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Ionicons name={showConfirm ? "eye" : "eye-off"} size={24} color="#888" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handlePasswordChange}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff'
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#d63384',
    padding: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  form: {
    padding: 20,
    marginTop: 30
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 10,
    marginBottom: 15
  },
  saveButton: {
    backgroundColor: '#d63384',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  submitRatingButton: {
  marginLeft: 10,
  paddingHorizontal: 12,
  paddingVertical: 4,
  backgroundColor:'#d63384',
  borderRadius: 12,
},
submitRatingText: {
  color: '#fff',
  fontSize: 12,
  fontWeight: '600',
},
});

export default ChangePassword;
