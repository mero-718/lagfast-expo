import { Stack } from 'expo-router';

export default function DashboardLayout() {
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
          title: 'Dashboard'
        }} 
      />
      <Stack.Screen 
        name="detail" 
        options={{ 
          title: 'Detail'
        }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ 
          title: 'Profile'
        }} 
      />
    </Stack>
  );
} 