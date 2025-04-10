import { Stack } from 'expo-router';
import { useAuthCheck } from '@/hooks/useAuthCheck';

export default function AuthLayout() {
  // This will check auth status for auth routes
  useAuthCheck();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f4511e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen 
        name="index"
        options={{
          headerShown: false,
          title: '',
          headerTitle: ''
        }}
      />
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Login'
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: 'Register'
        }} 
      />
    </Stack>
  );
} 