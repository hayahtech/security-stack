import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { CreateWorkScreen } from '../screens/App/CreateWorkScreen';
import { DailyLogScreen } from '../screens/App/DailyLogScreen';
import { PhotoCaptureScreen } from '../screens/App/PhotoCaptureScreen';
import { ProfileScreen } from '../screens/App/ProfileScreen';
import { SettingsScreen } from '../screens/App/SettingsScreen';
import { WorkGalleryScreen } from '../screens/App/WorkGalleryScreen';
import { NewBudgetScreen } from '../screens/Budget/NewBudgetScreen';
import { BudgetHistoryScreen } from '../screens/Budget/BudgetHistoryScreen';
import { ExpensesScreen } from '../screens/App/ExpensesScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Listener de Autenticação
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            console.log("Auth State Changed:", authUser?.email);
            setUser(authUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // Loading Splash (pode ser substituído por uma tela de Splash real)
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' }}>
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    // Stack Autenticada
                    <>
                        <Stack.Screen name="Dashboard" component={DashboardScreen} />
                        <Stack.Screen name="CreateWork" component={CreateWorkScreen} />
                        <Stack.Screen name="DailyLog" component={DailyLogScreen} />
                        <Stack.Screen name="PhotoCapture" component={PhotoCaptureScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="WorkGallery" component={WorkGalleryScreen} />
                        <Stack.Screen name="NewBudget" component={NewBudgetScreen} />
                        <Stack.Screen name="BudgetHistory" component={BudgetHistoryScreen} />
                        <Stack.Screen name="Expenses" component={ExpensesScreen} />
                    </>
                ) : (
                    // Stack Não-Autenticada
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
