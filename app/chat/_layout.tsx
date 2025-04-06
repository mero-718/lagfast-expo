import { Stack } from 'expo-router';

export default function ChatLayout() {
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
          title: 'Chat'
        }} 
      />
      <Stack.Screen 
        name="conversation" 
        options={{ 
          title: 'Conversation'
        }} 
      />
    </Stack>
  );
} 