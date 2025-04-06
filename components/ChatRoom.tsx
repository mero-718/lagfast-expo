import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { webSocketService } from '../utils/websocket';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Message {
  id: number;
  room_id: number;
  user_id: number;
  content: string;
  timestamp: string;
}

interface ChatRoomProps {
  roomId: number;
  onClose: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Get user ID from AsyncStorage or your auth context
        const storedUserId = await AsyncStorage.getItem('userId');
        if (!storedUserId) {
          throw new Error('User ID not found');
        }
        setUserId(parseInt(storedUserId, 10));
        
        // Connect to WebSocket
        await webSocketService.connect();
        webSocketService.joinRoom(roomId);
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing chat:', error);
        setIsLoading(false);
      }
    };

    initializeChat();

    return () => {
      webSocketService.leaveRoom(roomId);
      webSocketService.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    if (!userId) return;

    const messageUnsubscribe = webSocketService.onMessage((data: Message) => {
      setMessages(prev => [...prev, data]);
      flatListRef.current?.scrollToEnd();
    });

    const typingUnsubscribe = webSocketService.onTyping((data) => {
      if (data.user_id !== userId) {
        setIsTyping(data.is_typing);
      }
    });

    return () => {
      messageUnsubscribe();
      typingUnsubscribe();
    };
  }, [userId]);

  const handleSendMessage = () => {
    if (inputText.trim()) {
      webSocketService.sendMessage(roomId, inputText.trim());
      setInputText('');
    }
  };

  const handleTyping = (text: string) => {
    setInputText(text);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    webSocketService.sendTypingStatus(roomId, true);

    typingTimeoutRef.current = setTimeout(() => {
      webSocketService.sendTypingStatus(roomId, false);
    }, 1000);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.user_id === userId ? styles.sentMessage : styles.receivedMessage
    ]}>
      <Text style={styles.messageText}>{item.content}</Text>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat Room</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messageList}
      />

      {isTyping && (
        <View style={styles.typingIndicator}>
          <Text>Someone is typing...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 5,
  },
  typingIndicator: {
    padding: 8,
    backgroundColor: '#f0f0f0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
