import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchUsers } from '@/utils/api';

interface User {
  id: string;
  username: string;
  email: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

interface UserStatusChange {
  userId: string;
  isOnline: boolean;
}

export default function ChatScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // First, fetch users from API
      const data = await fetchUsers();
      
      // Transform the API data to match our User interface
      const transformedUsers: User[] = data.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        status: 'offline', // Start with all users offline
        lastSeen: user.last_seen 
          ? new Date(user.last_seen).toLocaleString() 
          : 'Last seen recently',
      }));
      
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (user: User) => {
    if (user.status === 'online') {
      router.push({
        pathname: '/chat/conversation',
        params: {
          userId: user.id,
          username: user.username,
        },
      });
    }
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'online':
        return '#4CAF50';
      case 'away':
        return '#FFC107';
      case 'offline':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        item.status === 'online' && styles.activeUserItem,
      ]}
      onPress={() => handleUserPress(item)}
      disabled={item.status !== 'online'}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={40} color="#f4511e" />
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.email}>{item.email}</Text>
          {item.status !== 'online' && item.lastSeen && (
            <Text style={styles.lastSeen}>{item.lastSeen}</Text>
          )}
        </View>
      </View>
      {item.status === 'online' && (
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => handleUserPress(item)}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="#f4511e" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat Box</Text>
        <View style={styles.headerControls}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity style={styles.userListButton}>
            <Ionicons name="people" size={24} color="#f4511e" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Indicator */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f4511e" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <>
          {/* User List */}
          <FlatList
            data={paginatedUsers}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.userList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No users found' : 'No users available'}
                </Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f4511e',
    marginBottom: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  userListButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f4511e',
  },
  userList: {
    padding: 16,
    marginTop: 10,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activeUserItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#f4511e',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  lastSeen: {
    fontSize: 12,
    color: '#999',
  },
  chatButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f4511e',
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  pageButton: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 4,
  },
  activePageButton: {
    backgroundColor: '#f4511e',
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: 16,
    color: '#333',
  },
  activePageButtonText: {
    color: '#fff',
  },
  ellipsis: {
    fontSize: 16,
    color: '#999',
    marginHorizontal: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});
