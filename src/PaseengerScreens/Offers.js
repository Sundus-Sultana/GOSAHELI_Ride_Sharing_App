import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';

const Offers = () => {
  const [promoCode, setPromoCode] = useState('');
  const [isActivateDisabled, setIsActivateDisabled] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [availablePromoCodes, setAvailablePromoCodes] = useState([
    { code: 'WELCOME20', discount: '20% off on first ride' },
    
  ]);

  const referralOffers = [
    { 
      title: 'Share invite with a friend',
      description: 'Your friend will get 50% discount on first ride',
      action: 'Invite Now'
    },
    { 
      title: 'Get 50% off',
      description: 'When friend completes ride, you get 50% discount',
      
    }
  ];

  const handlePromoCodeChange = (text) => {
    setPromoCode(text);
    setIsActivateDisabled(text.trim() === '');
  };

  const handleActivatePress = () => {
    // Here you would typically validate the promo code with your backend
    alert(`Promo code ${promoCode} activated!`);
    setPromoCode('');
    setIsActivateDisabled(true);
  };

  const handleGetDiscountPress = () => {
    setIsModalVisible(true);
  };

  const handleCopyCode = (code) => {
    setPromoCode(code);
    setIsModalVisible(false);
    setIsActivateDisabled(false);
  };

  const handleReferralAction = (action) => {
    // Handle the referral action (Invite Now or Learn More)
    alert(`${action} clicked!`);
  };

  return (
    <View style={styles.container}>
      {/* First Row: Enter Promo Code */}
      <View style={styles.promoContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter promo code"
          value={promoCode}
          onChangeText={handlePromoCodeChange}
        />
         <TouchableOpacity
          style={[
            styles.button, 
            isActivateDisabled ? styles.disabledButton : styles.activeButton
          ]}
          onPress={handleActivatePress}
          disabled={isActivateDisabled}
        >
          <Text style={[
            styles.buttonText,
            !isActivateDisabled && styles.activeButtonText
          ]}>
            Activate
          </Text>
        </TouchableOpacity>
      </View>

      {/* Second Row: Get Discount */}
      <TouchableOpacity style={styles.getDiscountButton} onPress={handleGetDiscountPress}>
        <Text style={styles.getDiscountText}>Get Discount</Text>
      </TouchableOpacity>

      {/* Referral Offers Section */}
      <View style={styles.referralSection}>
        <Text style={styles.sectionTitle}>Referral Offers</Text>
        
        {referralOffers.map((offer, index) => (
          <View key={index} style={styles.referralCard}>
            <View style={styles.referralTextContainer}>
              <Text style={styles.referralTitle}>{offer.title}</Text>
              <Text style={styles.referralDescription}>{offer.description}</Text>
            </View>
            <TouchableOpacity 
              style={styles.referralActionButton}
              onPress={() => handleReferralAction(offer.action)}
            >
              <Text style={styles.referralActionText}>{offer.action}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Discount Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Available Discounts</Text>
            
            {availablePromoCodes.map((item, index) => (
              <View key={index} style={styles.discountItem}>
                <View>
                  <Text style={styles.discountText}>{item.discount}</Text>
                  <Text style={styles.codeText}>Code: {item.code}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={() => handleCopyCode(item.code)}
                >
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  promoContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  button: {
    backgroundColor: '#ffff',
    padding: 15,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
  },
   activeButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E54A80',
  },
   activeButtonText: {
    color: '#E54A80',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  getDiscountButton: {
    backgroundColor: '#E54A80',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 25,
  },
  getDiscountText: {
    color: 'white',
    fontWeight: 'bold',
  },
  referralSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  referralCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referralTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  referralTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#222',
  },
  referralDescription: {
    fontSize: 14,
    color: '#666',
  },
  referralActionButton: {
    backgroundColor: '#E54A80',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  referralActionText: {
    color: 'white',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  discountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  discountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  codeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  copyButton: {
    backgroundColor: '#E54A80',
    padding: 8,
    borderRadius: 5,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 14,
  },
  closeButton: {
    backgroundColor: '#E54A80',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Offers;