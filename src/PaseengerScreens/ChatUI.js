import React, { useState, useEffect, useRef } from 'react';
import {
  View, TextInput, TouchableOpacity, Text, Alert,Image,
  FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,BackHandler
} from 'react-native';
import { db } from '../firebase/setup.js';
import { useNavigation } from '@react-navigation/native';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../../api.js';
import { Ionicons } from '@expo/vector-icons'; // or 'react-native-vector-icons/Ionicons' if using bare React Native


export default function ChatScreen({ route }) {
 const {
  driverId ,userId,
  chatRoomId,
  currentUser,
  currentUserId,
  currentUserName,
  receiverUserId,
  receiverUserName,
  receiverUserPhoto,
  currentUserPhoto,
} = route.params;

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);
  const navigation = useNavigation();

    const senderPhotos = {
    [currentUserId]: currentUserPhoto,
    [receiverUserId]: receiverUserPhoto,
  };

  useFocusEffect(
  React.useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
     navigation.navigate('DriverCarpoolStatusScreen', {
  tab: 'Accepted',
  driverId,
  userId
});

      return true;
    });

    return () => backHandler.remove();
  }, [])
);

  useEffect(() => {
    const q = query(collection(db, chatRoomId), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(msgs);
        setLoading(false);

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      (error) => {
        console.error("Error loading messages:", error);
        setLoading(false);
        Alert.alert("Error", "Could not load messages. Please check your connection.");
      }
    );

    return () => unsubscribe();
  }, [chatRoomId]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, chatRoomId), {
        text: message,
        sender: currentUserName,
        senderId: currentUserId,
        createdAt: serverTimestamp(),
      });
      setMessage('');
    } catch (err) {
      console.error("Error sending message:", err);
      Alert.alert("Error", "Could not send message. Please check your connection.");
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.senderId === currentUserId;
    const displayTime = item.createdAt?.toDate
      ? new Date(item.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '...';
       const profileImageUri = senderPhotos[item.senderId]
      ? `${API_URL}/uploads/${senderPhotos[item.senderId]}`
      : null;

    return (
      <View style={[styles.messageContainer, isMe ? styles.rightAlign : styles.leftAlign]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.sender[0].toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
          <Text style={styles.senderLabel}>{item.sender}</Text>
          <Text style={[styles.messageText, !isMe && { color: '#ffffff' }]}>{item.text}</Text>
          <Text style={styles.timestamp}>{displayTime}</Text>
        </View>
        {!isMe && (
          <View style={styles.senderProfileRow}>
            {profileImageUri && (
              <Image source={{ uri: profileImageUri }} style={styles.profilePhotoUnderMessage} />
            )}
            <Text style={styles.profileNameUnderMessage}>{item.sender}</Text>
          </View>
          )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#d63384" barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
  <View style={styles.header}>
  <View style={styles.headerContent}>
    <TouchableOpacity
      onPress={() => navigation.navigate('DriverCarpoolStatusScreen', {
        tab: 'Accepted',
        driverId,
        userId
      })}
      style={styles.backButton}
    >
      <Ionicons name="arrow-back" size={24} color="white" />
    </TouchableOpacity>

    <Image
      source={
        receiverUserPhoto
          ? { uri: `${API_URL}/uploads/${receiverUserPhoto}` }
          : require('../../assets/empty_avatar.jpg')
      }
      style={styles.avatarImage}
    />

    <Text style={styles.headerText}>{receiverUserName}</Text>
  </View>
</View>


        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#d63384" />
            <Text>Loading chat...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 10, paddingBottom: 60 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text>No messages yet. Start the conversation!</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            placeholder="Type a message..."
            value={message}
            onChangeText={setMessage}
            style={styles.input}
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendButton, sending && { opacity: 0.6 }]}
            onPress={sendMessage}
            disabled={sending}
          >
            <Text style={styles.sendButtonText}>{sending ? '...' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
 header: {
  backgroundColor: '#d63384',
  paddingVertical: 12,
  paddingHorizontal: 16,
  elevation: 4,
},

headerContent: {
  flexDirection: 'row',
  alignItems: 'center',
},
  headerText: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#fff',
},
  inputRow: {
    flexDirection: 'row',
    padding: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: '#d63384',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 25,
    marginLeft: 8,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
  },
  rightAlign: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  leftAlign: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d63384',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bubble: {
    padding: 10,
    borderRadius: 15,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myBubble: {
    backgroundColor: '#d63384',
    borderBottomRightRadius: 0,
  },
  otherBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 0,
  },
  messageText: {
    fontSize: 15,
    color: '#fff',
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ddd',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 10,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
 backButton: {
  marginRight: 10,
},

avatarImage: {
  width: 40,
  height: 40,
  borderRadius: 20,
  marginRight: 10,
},
senderProfileRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 4,
  marginLeft: 4,
},

profilePhotoUnderMessage: {
  width: 24,
  height: 24,
  borderRadius: 12,
  marginRight: 6,
  backgroundColor: '#ccc',
},

profileNameUnderMessage: {
  fontSize: 12,
  color: '#666',
}


});
