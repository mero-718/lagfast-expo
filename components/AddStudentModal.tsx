import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StudentFormData {
  username: string;
  email: string;
  password: string;
}

interface FormErrors {
  username: string;
  email: string;
  password: string;
}

interface AddStudentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: StudentFormData) => Promise<void>;
  loading?: boolean;
  title?: string;
  submitButtonText?: string;
  initialData?: {
    username: string;
    email: string;
    password?: string;
  };
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({
  visible,
  onClose,
  onSubmit,
  loading = false,
  title = 'Add New Student',
  submitButtonText = 'Add Student',
  initialData
}) => {
  const [formData, setFormData] = useState<StudentFormData>({
    username: '',
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({
    username: '',
    email: '',
    password: '',
  });

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username || '',
        email: initialData.email || '',
        password: initialData.password || '',
      });
    } else {
      // Reset form when modal is opened for adding a new student
      setFormData({
        username: '',
        email: '',
        password: '',
      });
    }
  }, [initialData, visible]);

  // Validate email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      username: '',
      email: '',
      password: '',
    };

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Only validate password if we're adding a new student or if it's provided
    if (!initialData && !formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
    
    // Reset form after successful submission
    setFormData({
      username: '',
      email: '',
      password: '',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalForm}>
            <TextInput
              style={[styles.modalInput, errors.username ? styles.inputError : null]}
              placeholder="Username"
              value={formData.username}
              onChangeText={(text) => setFormData({...formData, username: text})}
              autoCapitalize="none"
            />
            {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
            
            <TextInput
              style={[styles.modalInput, errors.email ? styles.inputError : null]}
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            
            <TextInput
              style={[styles.modalInput, errors.password ? styles.inputError : null]}
              placeholder={"Password"}
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
              secureTextEntry
            />
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.modalButtonText}>{submitButtonText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalForm: {
    width: '100%',
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 5,
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
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
});

export default AddStudentModal; 