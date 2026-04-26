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
    StatusBar
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

export const LoginScreen = () => {
    const navigation = useNavigation<any>();
    const { theme, isDark } = useTheme();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        // Validação básica
        if (!email || !password) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Navigation is handled by AppNavigator's auth listener usually, 
            // but explicit navigation is fine too if listener is purely for initial load
        } catch (error: any) {
            let msg = 'Ocorreu um erro ao fazer login.';
            if (error.code === 'auth/invalid-email') msg = 'Email inválido.';
            if (error.code === 'auth/user-not-found') msg = 'Usuário não encontrado.';
            if (error.code === 'auth/wrong-password') msg = 'Senha incorreta.';
            if (error.code === 'auth/invalid-credential') msg = 'Credenciais inválidas.';

            Alert.alert('Falha no Login', msg);
        } finally {
            setLoading(false);
        }
    };

    const navigateToRegister = () => {
        navigation.navigate('Register');
    };

    const handleForgotPassword = () => {
        Alert.alert('Recuperar Senha', 'Funcionalidade em desenvolvimento. Entre em contato com o suporte.');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <StatusBar backgroundColor={theme.colors.background} barStyle={isDark ? "light-content" : "dark-content"} />
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <View style={[styles.logoPlaceholder, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}>
                        <Text style={{ fontSize: 40 }}>🎨</Text>
                    </View>
                    <Text style={[styles.title, { color: theme.colors.text }]}>PinturaPro</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Gestão Inteligente de Obras</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.inputBg, color: theme.colors.text, borderColor: theme.colors.border }]}
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
                            style={[styles.input, { backgroundColor: theme.colors.inputBg, color: theme.colors.text, borderColor: theme.colors.border }]}
                            placeholder="******"
                            placeholderTextColor={theme.colors.placeholder}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity onPress={handleForgotPassword}>
                        <Text style={[styles.forgotText, { color: theme.colors.secondary }]}>Esqueci minha senha</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Entrar</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.registerContainer}>
                        <Text style={{ color: theme.colors.textSecondary }}>Não tem conta? </Text>
                        <TouchableOpacity onPress={navigateToRegister}>
                            <Text style={[styles.registerLink, { color: theme.colors.secondary }]}>Criar conta</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    forgotText: {
        textAlign: 'right',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 24,
    },
    loginButton: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 24,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    registerLink: {
        fontWeight: 'bold',
    }
});
