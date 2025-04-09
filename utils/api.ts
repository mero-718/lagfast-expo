import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = process.env.API_URL || 'http://192.168.244.128:9000';

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  username: string;
  password: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

// Helper function to get auth token
export const getAuthToken = async () => {
  return await AsyncStorage.getItem('userToken');
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  return data;
};

export const registerUser = async (data: RegisterData): Promise<ApiResponse<any>> => {
  try {    
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    console.log('response', response);
    
    const result = await handleResponse(response);
    
    if (!response.ok) {
      return {
        success: false,
        error: result.message || 'Registration failed',
      };
    }
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred during registration',
    };
  }
};

export const loginUser = async (data: LoginData): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await handleResponse(response);
    
    if (!response.ok) {
      return {
        success: false,
        error: result.message || 'Login failed',
      };
    }
    
    // Store the token in AsyncStorage
    if (result.access_token) {
      await AsyncStorage.setItem('userToken', result.access_token);
    }
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error occurred',
    };
  }
};

export const loadMessages = async (userId: number) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/messages/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await handleResponse(response);
  } catch (error) {
    throw error;
  }
};

export const userInfo = async () => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await handleResponse(response);
  } catch (error) {
    throw error;
  }
};

// Fetch Users API
export const fetchUsers = async () => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await handleResponse(response);
  } catch (error) {
    throw error;
  }
};

// Update User API
export const updateUser = async (userId: string, userData: { username: string; email: string; password?: string }) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
    return await handleResponse(response);
  } catch (error) {
    throw error;
  }
};

// Delete User API
export const deleteUser = async (userId: string) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await handleResponse(response);
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    // Then clear the token from storage
    await AsyncStorage.removeItem('userToken');

    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred during logout'
    };
  }
};

export const fetchMessages = async (senderId: string, recipientId: string): Promise<Message[]> => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/messages/${senderId}/${recipientId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    
    const data = await response.json();
    return data.map((msg: any) => ({
      id: msg.id,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id,
      content: msg.content,
      timestamp: msg.timestamp,
      status: msg.status || 'delivered'
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const sendMessage = async (userId: string, content: string): Promise<Message> => {
  try {
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`,
      },
      body: JSON.stringify({
        receiver_id: userId,
        content,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}; 