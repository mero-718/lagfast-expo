import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
// import { loginUser } from '@/utils/api';
// import Toast from 'react-native-toast-message';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    username: '',
    password: '',
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      username: '',
      password: '',
    };

    if (!username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    // try {
    //   const response = await loginUser({ username, password });
      
    //   if (response.success) {
    //     // Navigate to dashboard
    //     Toast.show({
    //       type: 'success',
    //       text1: 'Login Successful',
    //       text2: 'You have been logged in successfully',
    //       position: 'top',
    //       visibilityTime: 3000,
    //     });
    //     router.replace('/dashboard' as any);
    //   } else {
    //     Toast.show({
    //       type: 'error',
    //       text1: 'Login Failed',
    //       text2: response.error || 'Please check your credentials and try again',
    //       position: 'top',
    //       visibilityTime: 3000,
    //     });
    //   }
    // } catch (error) {
    //   Toast.show({
    //     type: 'error',
    //     text1: 'Error',
    //     text2: 'An unexpected error occurred',
    //     position: 'top',
    //     visibilityTime: 3000,
    //   });
    // } finally {
    //   setLoading(false);
    // }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <View style={styles.form}>
        <TextInput
          style={[styles.input, errors.username ? styles.inputError : null]}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
        
        <TextInput
          style={[styles.input, errors.password ? styles.inputError : null]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/auth/register" style={styles.link}>
            Register
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 5,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff0000',
    borderWidth: 1,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#000000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#666666',
  },
  link: {
    color: '#000000',
    fontWeight: 'bold',
  },
}); 