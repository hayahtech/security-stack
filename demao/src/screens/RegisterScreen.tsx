import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar
} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

export const RegisterScreen = () => {
    const navigation = useNavigation<any>();
    const { theme, isDark } = useTheme();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        // Validação
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Erro', 'Preencha todos os campos.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Erro', 'As senhas não coincidem.');
            return;
        }

        setLoading(true);
        try {
            // Cria Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Atualiza Profile (Nome)
            await updateProfile(user, {
                displayName: name
            });

            // Cria documento no Firestore
            await setDoc(doc(db, 'users', user.uid), {
                id: user.uid,
                name: name,
                email: email,
                role: 'painter', // Default role
                worksAssigned: [],
                createdAt: new Date().toISOString()
            });

            Alert.alert('Sucesso', 'Conta criada com sucesso!');
            // Autenticação automática redirecionará para Dashboard via AppNavigator
        } catch (error: any) {
            console.error(error);
            let msg = 'Erro ao criar conta.';
            if (error.code === 'auth/email-already-in-use') msg = 'Este email já está em uso.';
            if (error.code === 'auth/invalid-email') msg = 'Email inválido.';
            if (error.code === 'auth/weak-password') msg = 'Senha muito fraca.';

            Alert.alert('Erro', msg);
        } finally {
            setLoading(false);
        }
    };

    const navigateToLogin = () => {
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <StatusBar backgroundColor={theme.colors.background} barStyle={isDark ? "light-content" : "dark-content"} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Criar Conta</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Junte-se ao time PinturaPro</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Nome Completo</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, color: theme.colors.text }]}
                            placeholder="Seu nome"
                            placeholderTextColor={theme.colors.placeholder}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, color: theme.colors.text }]}
                            placeholder="seu@email.com"
                            placeholderTextColor={theme.colors.placeholder}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Senha</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, color: theme.colors.text }]}
                            placeholder="Mínimo 6 caracteres"
                            placeholderTextColor={theme.colors.placeholder}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Confirmar Senha</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, color: theme.colors.text }]}
                            placeholder="Repita a senha"
                            placeholderTextColor={theme.colors.placeholder}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.registerButton, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Criar Conta</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.loginContainer}>
                        <Text style={{ color: theme.colors.textSecondary }}>Já tem conta? </Text>
                        <TouchableOpacity onPress={navigateToLogin}>
                            <Text style={[styles.loginLink, { color: theme.colors.secondary }]}>Fazer Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        marginBottom: 40,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: -0.5,
        marginBottom: 10,
    },
    headerSubtitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        marginBottom: 8,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginLeft: 4,
    },
    input: {
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    registerButton: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 24,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginLink: {
        fontWeight: 'bold',
        marginLeft: 4,
    }
});
