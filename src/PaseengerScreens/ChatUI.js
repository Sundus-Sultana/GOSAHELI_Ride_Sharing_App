import React, { useState, useEffect, useRef } from 'react';
import {
  View, TextInput, TouchableOpacity, Text,
  FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { db } from '../firebase/setup.js'; // ✅ your existing firebase.js
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

export default function ChatScreen({ route }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);

  const currentUser = 'rider'; // Change to 'passenger' on other device
  const chatRoomId = 'rider_passenger_chat';

  useEffect(() => {
    const q = query(collection(db, chatRoomId), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
      setLoading(false);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);

    try {
      await addDoc(collection(db, chatRoomId), {
        text: message,
        sender: currentUser,
        createdAt: serverTimestamp(),
      });
      setMessage('');
    } catch (err) {
      console.error("Error sending message:", err);
    }

    setSending(false);
  };

  const renderItem = ({ item }) => {
    const isMe = item.sender === currentUser;
    const displayTime = item.createdAt?.toDate
      ? new Date(item.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '...';

    return (
      <View style={[styles.messageContainer, isMe ? styles.rightAlign : styles.leftAlign]}>
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
          <Text style={styles.senderLabel}>{item.sender}</Text>
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.timestamp}>{displayTime}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d63384" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 10 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inputRow: {
    flexDirection: 'row',
    paddingTop: 30,
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 25,
    marginBottom: 30,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginLeft: 8,
     marginBottom: 30,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  messageContainer: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  leftAlign: {
    justifyContent: 'flex-start',
  },
  rightAlign: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: '#d63384',
    alignSelf: 'flex-end',
  },
  otherBubble: {
    backgroundColor: '#eee',
    alignSelf: 'flex-start',
  },
  senderLabel: {
    fontSize: 10,
    color: '#fafafa',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#fafafa',
  },
  timestamp: {
    fontSize: 10,
    color: '#fafafa',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});