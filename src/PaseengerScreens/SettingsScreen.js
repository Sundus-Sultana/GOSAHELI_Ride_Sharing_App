import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { API_URL, getUserById } from '../../api'; // Adjust path as needed
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import axios from 'axios';



const SettingsScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [userData, setUserData] = useState(null);

  // Fetch user data when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('Profile', { userId });
        return true; // Prevent default behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove(); // Cleanup
    }, [navigation, userId])
  );


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#d63384" barStyle="light-content" />
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId })}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 24 }} /> {/* for alignment like Profile */}
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => navigation.navigate('ChangePassword', { userId })}
          >
            <MaterialIcons name="lock" size={24} color="#d63384" />
            <Text style={styles.optionText}>Change Password</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
{/*
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => alert('Notification settings coming soon')}
          >
            <MaterialIcons name="lock" size={24} color="#d63384" />
            <Text style={styles.optionText}>Settings</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>*/}

          {/* Add more settings items here as needed */}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#d63384',
    padding: 15,
    paddingTop: 15,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    paddingVertical: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  optionText: {
    fontSize: 16,
    color: '#2B2B52',
    flex: 1,
    marginLeft: 15,
  }
});

export default SettingsScreen;
