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
      navigation.goBack();
      return true;
    });

    return () => backHandler.remove();
  }, [])
);


 useEffect(() => {
  const q = query(collection(db, chatRoomId), orderBy('createdAt', 'asc'));
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const grouped = [];
      let lastDate = null;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.createdAt?.toDate?.();

        if (timestamp) {
          const dateStr = new Intl.DateTimeFormat('en-PK', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Karachi',
          }).format(timestamp);

          if (dateStr !== lastDate) {
            grouped.push({ type: 'date', date: dateStr, id: `date-${dateStr}` });
            lastDate = dateStr;
          }
        }

        grouped.push({
          id: doc.id,
          ...data,
          createdAt: timestamp || new Date(),
          type: 'message',
        });
      });

      setMessages(grouped);
      setLoading(false);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    (error) => {
      console.error('Error loading messages:', error);
      setLoading(false);
      Alert.alert('Error', 'Could not load messages. Please check your connection.');
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
    if (item.type === 'date') {
    return (
      <View style={styles.dateHeaderContainer}>
        <Text style={styles.dateHeaderText}>{item.date}</Text>
      </View>
    );
  }

  const isMe = item.senderId === currentUserId;
  const displayTime = new Intl.DateTimeFormat('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Karachi',
  }).format(item.createdAt);
      const profileImageUri = senderPhotos[item.senderId]
  ? senderPhotos[item.senderId].startsWith('/')
    ? `${API_URL}${senderPhotos[item.senderId]}`
    : `${API_URL}/uploads/${senderPhotos[item.senderId]}`
  : null;

    return (
       <View style={[styles.messageContainer, isMe ? styles.rightAlign : styles.leftAlign]}>
    {!isMe && (
      <View style={styles.avatar}>
        {profileImageUri ? (
          <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{item.sender[0].toUpperCase()}</Text>
        )}
      </View>
    )}
    <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
      {!isMe && <Text style={styles.senderLabel}>{item.sender}</Text>}
      <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
        {item.text}
      </Text>
    <Text style={[styles.timestamp, isMe ? styles.myTimeText : styles.otherTimeText]}>
  {displayTime}
</Text>
    </View>
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
      onPress={() => navigation.goBack()}
      style={styles.backButton}
    >
      <Ionicons name="arrow-back" size={24} color="white" />
    </TouchableOpacity>

   <Image
  source={
    receiverUserPhoto
      ? { uri: receiverUserPhoto.startsWith('/') 
          ? `${API_URL}${receiverUserPhoto}`
          : `${API_URL}/uploads/${receiverUserPhoto}`
        }
      : require('../../assets/empty_avatar.jpg')
  }
  style={styles.headerAvatarImage}
  onError={(e) => console.log("Header image error:", e.nativeEvent.error)}
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
  dateHeaderContainer: {
  alignItems: 'center',
  marginVertical: 8,
},

dateHeaderText: {
  backgroundColor: '#e0e0e0',
  color: '#555',
  fontSize: 12,
  paddingVertical: 4,
  paddingHorizontal: 10,
  borderRadius: 10,
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
    backgroundColor: '#f8f8f8',
    borderBottomLeftRadius: 0,
  },
 // Add new text color styles
  myMessageText: {
    color: '#fff',
    fontSize: 15,
  },
  otherMessageText: {
    color: '#d63384', // Pink color for receiver messages
    fontSize: 15,
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7a4260ff',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 10,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  myTimeText: {
  color: '#f6f5f5ff', // white for sender time
},

otherTimeText: {
  color: '#545151ff', // grey or customize for receiver time
},
 backButton: {
  marginRight: 10,
},

 // Update avatar styles
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderColor:'#d63384',
    borderWidth:1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },

  avatarText: {
    color: '#d63384',
    fontWeight: 'bold',
  },
  // Update header avatar
  headerAvatarImage: {
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
