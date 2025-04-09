import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { initializeSocket, getSocket } from '../../utils/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUsers } from '@/utils/api';
import { userInfo } from '@/utils/api';

interface CurrentUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface User {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeen?: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (users.length > 0 && onlineUserIds.length > 0) {
      setUsers(prevUsers => 
        prevUsers.map(user => ({
          ...user,
          isOnline: onlineUserIds.includes(user.id.toString())
        }))
      );
    }
  }, [onlineUserIds, users]);

  const loadUserData = async () => {
    try {
      const userData = await userInfo();
      if (userData) {
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);      
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          throw new Error('No token found');
        }

        // Create socket instance
        const socketInstance = initializeSocket(token);

        // Set up all listeners BEFORE connecting
        setupSocketListeners(socketInstance);

        // Now set up connection event handlers
        socketInstance.on('connect', () => {
          console.log('Socket connected');
          setSocket(socketInstance);
        });

        socketInstance.on('error', (error: any) => {
          console.error('Socket error:', error);
        });

        socketInstance.on('disconnect', () => {
          console.log('Socket disconnected');
        });

        socketInstance.on('reconnect', () => {
          console.log('Socket reconnected');
        });

        // Load users after setting up socket
        await loadUsers();
      } catch (error) {
        console.error('Error initializing socket:', error);
        setIsLoading(false);
      }
    };

    initialize();

    return () => {
      if (socket) {
        socket.off('online-users');
        socket.off('user-online');
        socket.off('user-offline');
        socket.off('connect');
        socket.off('error');
        socket.off('disconnect');
        socket.off('reconnect');
      }
    };
  }, []);

  const setupSocketListeners = (socketInstance: any) => {
    // Listen for online users list updates
    socketInstance.on('online-users', (onlineUsers: string[]) => {
      console.log('🟢 Received online users list:', onlineUsers);
      
      // Update onlineUserIds state
      setOnlineUserIds(onlineUsers);
      
      // Immediately update users' online status
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => ({
          ...user,
          isOnline: onlineUsers.includes(user.id.toString())
        }));
        console.log('Updated users with online status:', updatedUsers);
        return updatedUsers;
      });
    });

    socketInstance.on('user-online', (data: { userId: string }) => {
      const userId = data.userId.toString();
      console.log('🟢 User came online:', userId);
      setOnlineUserIds(prev => [...new Set([...prev, userId])]);
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id.toString() === userId ? { ...user, isOnline: true } : user
        )
      );
    });

    socketInstance.on('user-offline', (data: { userId: string }) => {
      const userId = data.userId.toString();
      console.log('🔴 User went offline:', userId);
      setOnlineUserIds(prev => prev.filter(id => id !== userId));
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id.toString() === userId 
            ? { ...user, isOnline: false, lastSeen: new Date().toISOString() } 
            : user
        )
      );
    });
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const fetchedUsers = await fetchUsers();
      
      // Filter out the current user from the list
      const filteredUsers = fetchedUsers.filter((user: User) => user.id !== currentUser?.id);
      
      // Set initial users with offline status
      const initialUsers = filteredUsers.map((user: User) => ({
        ...user,
        isOnline: false
      }));
      
      console.log('Setting initial users:', initialUsers);
      setUsers(initialUsers);

    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = (userId: string) => {
    router.push(`/chat/conversation?id=${userId}`);
  };

  const filteredUsers = useMemo(() => {
    // First filter out the current user
    const usersWithoutCurrent = users.filter(user => user.id !== currentUser?.id);
    
    // Then apply search filter if there's a query
    if (!searchQuery.trim()) {
      return usersWithoutCurrent;
    }
    
    const query = searchQuery.toLowerCase();
    return usersWithoutCurrent.filter(user => 
      user.username.toLowerCase().includes(query)
    );
  }, [users, searchQuery, currentUser]);

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleStartChat(item.id)}
    >
      <View style={styles.avatarContainer}>
        <Ionicons name="person-circle" size={50} color="#007AFF" />
        <View style={[
          styles.onlineStatus,
          { backgroundColor: item.isOnline ? '#4CAF50' : '#9E9E9E' }
        ]} />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.status}>
          {item.isOnline ? 'Online' : `Last seen ${formatLastSeen(item.lastSeen)}`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'ago';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No users found' : 'No users available'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f2f2f7',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  onlineStatus: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
