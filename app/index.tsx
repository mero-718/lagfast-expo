import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import CustomSplashScreen from '@/components/CustomSplashScreen';

export default function SplashScreen() {
    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace('/auth/login');
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <CustomSplashScreen />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});
