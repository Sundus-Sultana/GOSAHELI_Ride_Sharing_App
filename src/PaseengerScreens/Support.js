import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Linking, Alert, Animated, Easing, Dimensions, Image } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { getUserById, getDriverById, getPassengerByUserId, submitComplaintApi } from '../../api';
const { width } = Dimensions.get('window');

const Support = ({ navigation, route }) => {
  const userId = route?.params?.userId || null;
  console.log('userid in support: ', userId);
  const [message, setMessage] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const animation = useRef(new Animated.Value(0)).current;

  // Basic FAQs
  const faqs = [
    {
      id: 'payment',
      question: 'How do I pay for rides?',
      answer: 'You can pay for rides using cash. We accept all major credit/debit cards and mobile payment options.'
    },
    {
      id: 'safety',
      question: 'What safety measures do you have?',
      answer: 'All our drivers are verified women with background checks. We provide real-time ride tracking, emergency contact features, and 24/7 support for any safety concerns.'
    },
    {
      id: 'account',
      question: 'How do I update my account?',
      answer: 'You can update your account information from the Profile section in the app. For security reasons, some changes may require verification.'
    }
  ];

  const toggleQuestion = (id) => {
    if (expandedQuestion === id) {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: false
      }).start(() => setExpandedQuestion(null));
    } else {
      setExpandedQuestion(id);
      Animated.timing(animation, {
        toValue: 1,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: false
      }).start();
    }
  };

  //open external links
  const openContact = (method, value) => {
    switch (method) {
      case 'phone':
        Linking.openURL(`tel:${value}`);
        break;
      case 'email':
        Linking.openURL(`mailto:${value}`);
        break;
      case 'whatsapp':
        Linking.openURL(`https://wa.me/${value}`);
        break;
      default:
        break;
    }
  };

//submitComplaint()
  const submitComplaint = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your message.');
      return;
    }
    try {
      // 1️⃣ Get user data
      const userData = await getUserById(userId);
      if (!userData) {
        Alert.alert('Error', 'Unable to fetch user details.');
        return;
      }

      let driverId = null;
      let passengerId = null;

      if (userData.last_role === 'driver') {
        const driverData = await getDriverById(userId);
        if (driverData && driverData.driver) {
          driverId = driverData.driver.DriverID;
          console.log('driverid in support : ', driverId);
        }
      } else if (userData.last_role === 'passenger') {
        const passengerData = await getPassengerByUserId(userId);
        if (passengerData && passengerData.passenger) {
          passengerId = passengerData.passenger.PassengerID;
          console.log('passengerid in support: ', passengerId);
        }
      }

      if (!driverId && !passengerId) {
        Alert.alert('Error', 'Unable to find related Driver or Passenger record.');
        return;
      }

      // 2️⃣ Submit complaint
      const complaintResponse = await submitComplaintApi({
        driverId,
        passengerId,
        description: message
      });
      console.log('driverid, passengerid, message: ', driverId, passengerId, message);

      if (complaintResponse && complaintResponse.message) {
        Alert.alert('Success', complaintResponse.message, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
        setMessage('');
      } else {
        Alert.alert('Error', 'Failed to submit complaint.');
      }

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#d63384" barStyle="light-content" />
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={30} color="#fff" />
        </TouchableOpacity>
        {/* Header with solid color instead of gradient */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/IconWomen.png')}
                style={styles.logoImage}
              />
              <Image
                source={require('../../assets/location.png')}
                style={styles.locationImage}
              />
            </View>
            <Text style={styles.title}>SAHELI Support</Text>
            <Text style={styles.subtitle}>We're here to help you</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollContainer}>
          {/* Contact Form */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Send us a message</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.messageInput]}
                placeholder="Describe your issue..."
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitComplaint}
            >
              <Text style={styles.submitButtonText}>Send Message</Text>
              <MaterialIcons name="send" size={20} color="#fff" style={styles.sendIcon} />
            </TouchableOpacity>
          </View>

          {/* FAQ Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Common Questions</Text>

            {faqs.map((faq) => (
              <View key={faq.id} style={styles.faqContainer}>
                <TouchableOpacity
                  style={styles.faqQuestionContainer}
                  onPress={() => toggleQuestion(faq.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Ionicons
                    name={expandedQuestion === faq.id ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#d63384"
                  />
                </TouchableOpacity>

                {expandedQuestion === faq.id && (
                  <Animated.View
                    style={[
                      styles.faqAnswerContainer,
                      {
                        opacity: animation,
                        height: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 100] // Adjust based on your content height
                        })
                      }
                    ]}
                  >
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </Animated.View>
                )}
              </View>
            ))}
          </View>

          {/* Contact Options */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Quick Help</Text>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => openContact('phone', '+923175716858')}
              activeOpacity={0.7}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="call" size={24} color="#fff" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactMethod}>Call Support</Text>
                <Text style={styles.contactDetail}>+92 3175716858</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#d63384" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => openContact('whatsapp', '923175716858')}
              activeOpacity={0.7}
            >
              <View style={[styles.contactIcon, { backgroundColor: '#25D366' }]}>
                <FontAwesome5 name="whatsapp" size={24} color="#fff" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactMethod}>WhatsApp</Text>
                <Text style={styles.contactDetail}>Chat with us</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#d63384" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => openContact('email', 'support@saheli.com')}
              activeOpacity={0.7}
            >
              <View style={[styles.contactIcon, { backgroundColor: '#D44638' }]}>
                <MaterialIcons name="email" size={24} color="#fff" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactMethod}>Email Us</Text>
                <Text style={styles.contactDetail}>support@saheli.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#d63384" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => Linking.openURL('https://wa.me/923175716858')}
        >
          <FontAwesome5 name="whatsapp" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff", // To match your header background
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: '#d63384',
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2B2B52',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  contactIcon: {
    backgroundColor: '#d63384',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactMethod: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B2B52',
    marginBottom: 3,
  },
  contactDetail: {
    fontSize: 14,
    color: '#6C757D',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#2B2B52',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#d63384',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    flexDirection: 'row',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sendIcon: {
    marginLeft: 10,
  },
  faqContainer: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqQuestionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  faqQuestion: {
    fontSize: 16,
    color: '#2B2B52',
    flex: 1,
    marginRight: 10,
    fontWeight: '500',
  },
  faqAnswerContainer: {
    overflow: 'hidden',
    paddingBottom: 15,
    paddingHorizontal: 5,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 30,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    zIndex: 2,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  locationImage: {
    width: 30,
    height: 30,
    marginLeft: -25,
    marginBottom: 25,
  },
  backButton: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 10,
    padding: 5
  }

});

export default Support;