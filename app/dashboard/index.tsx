import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { registerUser, fetchUsers, updateUser, deleteUser } from '@/utils/api';
import DataTable from '@/components/DataTable';
import Drawer from '@/components/Drawer';
import AddStudentModal from '@/components/AddStudentModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';

// Define user interface
interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Load users when component mounts
  useEffect(() => {
    loadUsers();
  }, []);

  // Load users from API
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch users',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle drawer
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Close drawer
  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been successfully logged out',
        position: 'top',
        visibilityTime: 3000,
      });
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      Toast.show({
        type: 'error',
        text1: 'Logout Failed',
        text2: 'An error occurred while logging out',
        position: 'top',
        visibilityTime: 3000,
      });
    }
  };

  // Handle add user
  const handleAddUser = () => {
    setEditingUser(null);
    setShowAddUserModal(true);
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowAddUserModal(true);
  };

  // Handle delete user
  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      setLoading(true);
      await deleteUser(userToDelete.id);
      
      // Remove user from local state
      setUsers(users.filter(u => u.id !== userToDelete.id));
      
      Toast.show({
        type: 'success',
        text1: 'User Deleted',
        text2: `${userToDelete.username} has been deleted successfully`,
        position: 'top',
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error('Delete user error:', error);
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: 'Failed to delete user',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  // Handle add user submit
  const handleAddUserSubmit = async (formData: { username: string; email: string; password: string }) => {
    setLoading(true);
    try {
      if (editingUser) {
        // Update existing user
        const updatedUser = await updateUser(editingUser.id, formData);
        setUsers(users.map(user => 
          user.id === editingUser.id ? updatedUser : user
        ));
        
        setShowAddUserModal(false);
        setEditingUser(null);
        
        Toast.show({
          type: 'success',
          text1: 'User Updated',
          text2: 'User has been updated successfully',
          position: 'top',
          visibilityTime: 3000,
        });
      } else {
        // Add new user
        const response = await registerUser(formData);
        
        if (response.success) {
          // Refresh users list
          await loadUsers();
          setShowAddUserModal(false);
          
          Toast.show({
            type: 'success',
            text1: 'User Added',
            text2: 'New user has been added successfully',
            position: 'top',
            visibilityTime: 3000,
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Add User Failed',
            text2: response.error || 'Please try again',
            position: 'top',
            visibilityTime: 3000,
          });
        }
      }
    } catch (error) {
      console.error('Add/Update user error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An unexpected error occurred',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle row press
  const handleRowPress = (user: User) => {
    router.push({
      pathname: "/dashboard/detail",
      params: {
        username: user.username,
        email: user.email
      }
    });
  };

  // Define table columns
  const columns = [
    { 
      key: 'username', 
      title: 'Username', 
      flex: 2,
      sortable: true 
    },
    { 
      key: 'email', 
      title: 'Email', 
      flex: 3,
      sortable: true 
    },
  ];

  // Define drawer items
  const drawerItems = [
    { 
      icon: 'home', 
      label: 'Home', 
      onPress: () => {
        closeDrawer();
        router.replace('/dashboard');
      } 
    },
    { 
      icon: 'person', 
      label: 'Profile', 
      onPress: () => {
        closeDrawer();
        router.push('/profile');
      } 
    },
    { 
      icon: 'chatbox-sharp', 
      label: 'Chat', 
      onPress: () => {
        closeDrawer();
        router.push('/chat');
      } 
    },
    { 
      icon: 'settings', 
      label: 'Settings', 
      onPress: () => { 
        closeDrawer(); 
      } 
    },
    { 
      icon: 'log-out', 
      label: 'Logout', 
      onPress: handleLogout 
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentContainer}>
          {/* Header with drawer toggle */}
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={toggleDrawer} style={styles.drawerButton}>
              <Ionicons name="menu" size={24} color="#f4511e" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Student List</Text>
            <View style={styles.placeholderButton} />
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <DataTable
              data={users}
              columns={columns}
              loading={loading}
              searchKeys={['username', 'email']}
              showAddButton={true}
              onAddPress={handleAddUser}
              showActions={true}
              onEditPress={handleEditUser}
              onDeletePress={handleDeleteUser}
              onRowPress={handleRowPress}
              itemsPerPage={7}
              searchPlaceholder="Search students..."
            />
          </View>
        </View>
      </ScrollView>

      {/* Drawer Component */}
      <Drawer
        visible={drawerOpen}
        onClose={closeDrawer}
        title="Menu"
        items={drawerItems}
      />

      {/* Add/Edit User Modal */}
      <AddStudentModal
        visible={showAddUserModal}
        onClose={() => {
          setShowAddUserModal(false);
          setEditingUser(null);
        }}
        onSubmit={handleAddUserSubmit}
        title={editingUser ? "Edit Student" : "Add New Student"}
        submitButtonText={editingUser ? "Update Student" : "Add Student"}
        initialData={editingUser ? {
          username: editingUser.username,
          email: editingUser.email,
          password: ''
        } : undefined}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Student"
        message="Are you sure you want to delete this student?"
        itemName={userToDelete?.username || ''}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 130,
    color: '#f4511e',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    color: '#333',
  },
  drawerButton: {
    width: 40,
    marginLeft: 9,
  },
  placeholderButton: {
    width: 40,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    elevation: 3,
  },
}); 