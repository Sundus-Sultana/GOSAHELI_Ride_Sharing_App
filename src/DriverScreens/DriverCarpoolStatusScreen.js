// DriverCarpoolStatusScreen.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

const primaryColor = '#D64584';
const darkGrey = '#333';

const DriverCarpoolStatusScreen = () => {
  const [activeTab, setActiveTab] = useState('Requests');

  const renderTab = (tabName) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tabName && styles.activeTab
      ]}
      onPress={() => setActiveTab(tabName)}
    >
      <Text
        style={[
          styles.tabText,
          activeTab === tabName && styles.activeTabText
        ]}
      >
        {tabName}
      </Text>
    </TouchableOpacity>
  );

  const renderPlaceholder = () => (
    <View style={styles.placeholder}>
      <Ionicons name="car-sport-outline" size={50} color={primaryColor} />
      <Text style={styles.placeholderText}>No {activeTab.toLowerCase()} rides yet.</Text>
    </View>
  );

  return (
   <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#d63384" barStyle="light-content" />
      <View style={styles.container}>

      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        {renderTab('Requests')}
        {renderTab('Accepted')}
        {renderTab('Rejected')}
        {renderTab('Completed')}
      </View>

      {/* Ride List Placeholder (we'll replace this with real data later) */}
      {renderPlaceholder()}
      </View>
    </SafeAreaView>
  );
};

export default DriverCarpoolStatusScreen;

const styles = StyleSheet.create({
   safeArea: {
  flex: 1,
  backgroundColor: "#fff", // To match your header background
},
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    marginTop: 10,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  activeTab: {
    borderBottomColor: primaryColor,
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 16,
    color: darkGrey,
    fontWeight: '500',
  },
  activeTabText: {
    color: primaryColor,
    fontWeight: 'bold',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
});
