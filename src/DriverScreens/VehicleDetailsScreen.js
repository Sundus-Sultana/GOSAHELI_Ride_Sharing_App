// 📁 VehicleDetailsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert
} from 'react-native';
import { Modal, Portal, Provider, Searchbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import {
  getVehicleByDriverId,
  saveVehicleDetails,
  updateVehicleDetails
} from '../../api';

const carModels = [
  'Corolla', 'Civic', 'Alto', 'Mehran', 'Wagon R', 'Swift', 'City', 'Elantra', 'Sonata',
  'Sportage', 'Tucson', 'Picanto', 'Seltos', 'X70', 'Tiggo 8', 'Hilux', 'Revo', 'Land Cruiser',
  'Fortuner', 'Vitz', 'Yaris', 'Passo', 'Aqua', 'Prius', 'Camry', 'Accord', 'CR-V', 'BR-V',
  'CX-5', 'CX-3', 'RAV4', 'Jimny', 'Vitara', 'Cultus', 'i10', 'Model S', 'Model X', 'Model 3'
];

const vehicleTypes = ['Car', 'Van'];
const capacities = ['1', '2', '3', '4', '5', '6', '7'];

const VehicleDetailsScreen = ({ route }) => {
  const navigation = useNavigation();
  const { driverId } = route.params || {};

  const [modelVisible, setModelVisible] = useState(false);
  const [typeVisible, setTypeVisible] = useState(false);
  const [capacityVisible, setCapacityVisible] = useState(false);

  const [modelSearch, setModelSearch] = useState('');
  const [typeSearch, setTypeSearch] = useState('');
  const [capacitySearch, setCapacitySearch] = useState('');

  const [selectedModel, setSelectedModel] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState('');
  const [color, setColor] = useState('');
  const [regNo, setRegNo] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!driverId) return;

    const loadVehicle = async () => {
      try {
        const data = await getVehicleByDriverId(driverId);
        if (data) {
          setSelectedModel(data.VehicleModel);
          setSelectedType(data.VehicleType);
          setSelectedCapacity(data.capacity);
          setColor(data.color);
          setRegNo(data.PlateNumber);
          setIsEditing(false);
        } else {
          setIsEditing(true); // No vehicle found → allow new input
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to load vehicle info.');
        console.error(err);
      }
    };

    loadVehicle();
  }, [driverId]);

  const handleSaveOrUpdate = async () => {
    if (!selectedModel || !selectedType || !selectedCapacity || !color || !regNo) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }

    const payload = {
      VehicleModel: selectedModel,
      VehicleType: selectedType,
      capacity: selectedCapacity,
      color,
      PlateNumber: regNo,
      DriverID: driverId
    };

    try {
      if (isEditing) {
        const data = await getVehicleByDriverId(driverId);
        if (data) {
          await updateVehicleDetails(driverId, payload);
          Alert.alert('Updated', 'Vehicle info updated successfully.');
        } else {
          await saveVehicleDetails(payload);
          Alert.alert('Saved', 'Vehicle info saved successfully.');
        }
        setIsEditing(false);
      } else {
        setIsEditing(true); // Allow edit
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save.');
    }
  };

  return (
    <Provider>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Vehicle Details</Text>

        <Text style={styles.label}>Model</Text>
        <TouchableOpacity style={styles.inputBox} onPress={() => isEditing && setModelVisible(true)}>
          <Text style={styles.inputText}>{selectedModel || 'Select Vehicle Model'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Type</Text>
        <TouchableOpacity style={styles.inputBox} onPress={() => isEditing && setTypeVisible(true)}>
          <Text style={styles.inputText}>{selectedType || 'Select Vehicle Type'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Capacity</Text>
        <TouchableOpacity style={styles.inputBox} onPress={() => isEditing && setCapacityVisible(true)}>
          <Text style={styles.inputText}>{selectedCapacity || 'Select Capacity'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Color</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter Color"
          value={color}
          onChangeText={setColor}
          editable={isEditing}
        />

        <Text style={styles.label}>Registration No</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter Registration Number"
          value={regNo}
          onChangeText={setRegNo}
          editable={isEditing}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveOrUpdate}>
          <Text style={styles.saveButtonText}>{isEditing ? 'SAVE' : 'EDIT'}</Text>
        </TouchableOpacity>

        <Portal>
          <Modal visible={modelVisible} onDismiss={() => setModelVisible(false)} contentContainerStyle={styles.modal}>
            <Searchbar placeholder="Search Model" value={modelSearch} onChangeText={setModelSearch} />
            <ScrollView>
              {carModels
                .filter(item => item.toLowerCase().includes(modelSearch.toLowerCase()))
                .map((item, idx) => (
                  <TouchableOpacity key={idx} onPress={() => {
                    setSelectedModel(item);
                    setModelVisible(false);
                    setModelSearch('');
                  }}>
                    <Text style={styles.modalItem}>{item}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </Modal>

          <Modal visible={typeVisible} onDismiss={() => setTypeVisible(false)} contentContainerStyle={styles.modal}>
            <Searchbar placeholder="Search Type" value={typeSearch} onChangeText={setTypeSearch} />
            <ScrollView>
              {vehicleTypes
                .filter(item => item.toLowerCase().includes(typeSearch.toLowerCase()))
                .map((item, idx) => (
                  <TouchableOpacity key={idx} onPress={() => {
                    setSelectedType(item);
                    setTypeVisible(false);
                    setTypeSearch('');
                  }}>
                    <Text style={styles.modalItem}>{item}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </Modal>

          <Modal visible={capacityVisible} onDismiss={() => setCapacityVisible(false)} contentContainerStyle={styles.modal}>
            <Searchbar placeholder="Search Capacity" value={capacitySearch} onChangeText={setCapacitySearch} />
            <ScrollView>
              {capacities
                .filter(item => item.includes(capacitySearch))
                .map((item, idx) => (
                  <TouchableOpacity key={idx} onPress={() => {
                    setSelectedCapacity(item);
                    setCapacityVisible(false);
                    setCapacitySearch('');
                  }}>
                    <Text style={styles.modalItem}>{item}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </Modal>
        </Portal>
      </ScrollView>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontWeight: '600', marginBottom: 5, marginTop: 15 },
  inputBox: {
    padding: 15, borderWidth: 1, borderColor: '#ccc',
    borderRadius: 8, marginBottom: 10
  },
  inputText: { fontSize: 16, color: '#555' },
  textInput: {
    padding: 15, borderWidth: 1, borderColor: '#ccc',
    borderRadius: 8, marginBottom: 15, fontSize: 16
  },
  saveButton: {
    backgroundColor: '#D64584', padding: 15,
    borderRadius: 5, alignItems: 'center', marginTop: 30
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modal: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 10, maxHeight: 400 },
  modalItem: {
    paddingVertical: 10, fontSize: 16,
    borderBottomColor: '#eee', borderBottomWidth: 1,
  },
});

export default VehicleDetailsScreen;
