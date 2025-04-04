import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAuthCheck() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const inAuthGroup = segments[0] === 'auth';

        if (!token && !inAuthGroup) {
          // Redirect to login if no token and not in auth group
          router.replace('/auth/login');
        } else if (token && inAuthGroup) {
          // Redirect to dashboard if token exists and in auth group
          router.replace('/dashboard');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // If there's an error, redirect to login for safety
        router.replace('/auth/login');
      }
    };

    checkAuth();
  }, [segments]);
} 