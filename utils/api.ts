import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

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

// Helper function to get auth token
const getAuthToken = async () => {
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
    const response = await fetch(`http://192.168.244.128:8000/users`, {
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
      error: 'Network error occurred',
    };
  }
};

export const loginUser = async (data: LoginData): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_URL}auth/login`, {
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
    if (result.token) {
      await AsyncStorage.setItem('userToken', result.token);
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

// Fetch Users API
export const fetchUsers = async () => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}users`, {
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
    const response = await fetch(`${API_URL}users/${userId}`, {
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
    const response = await fetch(`${API_URL}users/${userId}`, {
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