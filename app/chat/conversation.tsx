import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getSocket } from '../../utils/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userInfo } from '@/utils/api';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface User {
  id: string;
  username: string;
}

export default function ConversationScreen() {
  const router = useRouter();
  const { id: recipientId } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [recipient, setRecipient] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await userInfo();
        if (userData) {
          setCurrentUser(userData);
          setupSocketListeners();
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (!socket) {
      console.error('Socket not initialized');
      return;
    }

    console.log('Setting up socket listeners...');
    
    if (socket.connected) {
      setIsSocketConnected(true);
      if (currentUser && recipientId) {
        const roomId = [currentUser.id, recipientId].sort().join('_');
        socket.emit('join_room', { room_id: roomId });
      }
    }

    socket.on('connect', () => {
      console.log('Socket connected');
      setIsSocketConnected(true);
      if (currentUser && recipientId) {
        const roomId = [currentUser.id, recipientId].sort().join('_');
        socket.emit('join_room', { room_id: roomId });
      }
    });

    socket.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error);
      setIsSocketConnected(false);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsSocketConnected(false);
    });

    socket.on('new_message', (message: Message) => {
      console.log('New message received:', message);
      setMessages(prevMessages => {
        const messageExists = prevMessages.some(msg => msg.id === message.id);
        if (!messageExists) {
          return [...prevMessages, message];
        }
        return prevMessages;
      });
      scrollToBottom();
    });

    socket.on('message_delivered', (data: { messageId: string }) => {
      console.log('Message delivered:', data.messageId);
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === data.messageId ? { ...msg, status: 'delivered' } : msg
        )
      );
    });

    return () => {
      if (socket) {
        socket.off('new_message');
        socket.off('message_delivered');
        socket.off('connect');
        socket.off('connect_error');
        socket.off('disconnect');
        if (currentUser && recipientId) {
          const roomId = [currentUser.id, recipientId].sort().join('_');
          socket.emit('leave_room', { room_id: roomId });
        }
      }
    };
  };

  const sendMessage = async () => {
    const socket = getSocket();

    if (!isSocketConnected || !socket) {
      console.error('Socket is not connected or not available');
      return;
    }

    if (!newMessage.trim() || !currentUser || !recipientId) {
      console.error('Missing required data for sending message');
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    try {
      console.log('Sending message:', message);
      
      const roomId = [currentUser.id, recipientId].sort().join('_');
      socket.emit('join_room', { room_id: roomId });
      
      socket.emit('send_message', {
        recipientId,
        content: newMessage.trim()
      });

      setMessages(prevMessages => [...prevMessages, message]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === currentUser?.id;
    return (
      <View style={[styles.messageContainer, isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage]}>
        <Text style={styles.messageText}>{item.content}</Text>
        <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
        {isCurrentUser && item.status && (
          <Text style={styles.statusText}>{item.status}</Text>
        )}
      </View>
    );
  };

  const renderTemporaryMessage = () => {
    if (!newMessage.trim() || !currentUser) {
      return null;
    }

    return (
      <View style={[styles.messageContainer, styles.currentUserMessage, styles.temporaryMessage]}>
        <Text style={styles.messageText}>{newMessage}</Text>
        <Text style={styles.timestamp}>Typing...</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{recipient?.username || 'Chat'}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loadingIndicator} size="large" color="#007AFF" />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={!newMessage.trim() || !isSocketConnected}>
          <Ionicons name="send" size={24} color={!newMessage.trim() || !isSocketConnected ? '#999' : '#007AFF'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 5,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 15,
    marginBottom: 10,
    maxWidth: '80%',
  },
  currentUserMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  otherUserMessage: {
    backgroundColor: '#e5e5ea',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  temporaryMessage: {
    backgroundColor: '#d0e8ff',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
    marginHorizontal: 10,
    marginBottom: 5,
    opacity: 0.7,
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    alignSelf: 'flex-end',
    marginTop: 3,
  },
  statusText: {
    fontSize: 10,
    color: '#a0d0ff',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    padding: 10,
  },
}); 