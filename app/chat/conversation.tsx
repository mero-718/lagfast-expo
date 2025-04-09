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
import { userInfo, fetchMessages } from '@/utils/api';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
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
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Load current user data
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const userData = await userInfo();
        if (userData) {
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    };

    loadCurrentUser();
  }, []);

  // Load messages when current user and recipient are available
  useEffect(() => {
    const loadMessagesData = async () => {
      if (currentUser?.id && recipientId) {
        try {
          setIsLoadingMessages(true);
          const messages = await fetchMessages(currentUser.id, recipientId as string);
          
          // Format messages to match the Message interface
          const formattedMessages = messages.map((msg: any) => ({
            id: msg.id,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            content: msg.content,
            timestamp: msg.timestamp,
            status: msg.status || 'delivered'
          }));
          
          setMessages(formattedMessages);
        } catch (error) {
          console.error('Error loading messages:', error);
        } finally {
          setIsLoadingMessages(false);
          setIsLoading(false);
        }
      }
    };

    loadMessagesData();
  }, [currentUser?.id, recipientId]);

  // Setup socket listeners
  useEffect(() => {
    if (currentUser?.id) {
      setupSocketListeners();
    }
  }, [currentUser?.id]);

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (!socket) {
      console.error('Socket not initialized');
      return;
    }

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
      receiverId: recipientId as string,
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
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.sentMessage : styles.receivedMessage
      ]}>
        <Text style={[
          styles.messageText,
          isCurrentUser ? styles.sentMessageText : styles.receivedMessageText
        ]}>
          {item.content}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timestamp,
            isCurrentUser ? styles.sentTimestamp : styles.receivedTimestamp
          ]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isCurrentUser && (
            <Text style={styles.statusText}>
              {item.status}
            </Text>
          )}
        </View>
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

      {isLoadingMessages ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
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
        <TouchableOpacity 
          style={styles.sendButton} 
          onPress={sendMessage} 
          disabled={!newMessage.trim() || !isSocketConnected}
        >
          <Ionicons 
            name="send" 
            size={24} 
            color={!newMessage.trim() || !isSocketConnected ? '#999' : '#007AFF'} 
          />
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
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  sentMessageText: {
    color: '#FFFFFF',
  },
  receivedMessageText: {
    color: '#000000',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    marginRight: 4,
  },
  sentTimestamp: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  receivedTimestamp: {
    color: '#666666',
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
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