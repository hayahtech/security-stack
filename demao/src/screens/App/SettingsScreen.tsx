import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

export const SettingsScreen = () => {
    const navigation = useNavigation();

    const handleLogout = () => {
        Alert.alert(
            'Sair',
            'Tem certeza que deseja sair do aplicativo?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: () => signOut(auth)
                }
            ]
        );
    };

    const SettingItem = ({ icon, label, onPress, value, type = 'link' }: any) => (
        <TouchableOpacity style={styles.item} onPress={onPress} disabled={type === 'toggle'}>
            <Text style={styles.itemIcon}>{icon}</Text>
            <Text style={styles.itemLabel}>{label}</Text>
            {type === 'toggle' && (
                <Switch
                    value={value}
                    onValueChange={onPress}
                    trackColor={{ false: "#cbd5e1", true: "#10b981" }}
                    thumbColor={"#fff"}
                />
            )}
            {type === 'link' && <Text style={styles.chevron}>›</Text>}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Voltar</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Configurações</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Geral</Text>
                <View style={styles.section}>
                    <SettingItem
                        icon="🌙"
                        label="Modo Escuro (Em breve)"
                        type="toggle"
                        value={false}
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon="🔔"
                        label="Notificações"
                        type="toggle"
                        value={true}
                        onPress={() => { }}
                    />
                </View>

                <Text style={styles.sectionTitle}>Suporte</Text>
                <View style={styles.section}>
                    <SettingItem icon="❓" label="Ajuda e FAQ" onPress={() => Alert.alert('Info', 'Acesse nosso site para ajuda.')} />
                    <SettingItem icon="📝" label="Termos de Uso" onPress={() => { }} />
                    <SettingItem icon="🔒" label="Política de Privacidade" onPress={() => { }} />
                </View>

                <Text style={styles.sectionTitle}>Conta</Text>
                <View style={styles.section}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Sair da Conta</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.version}>Versão 1.0.0</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e293b',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1e293b',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backBtn: {
        padding: 8,
        marginLeft: -8,
    },
    backText: {
        color: '#94a3b8',
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 10,
        marginTop: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: 4,
    },
    section: {
        backgroundColor: '#334155',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    itemIcon: {
        fontSize: 22,
        marginRight: 16,
    },
    itemLabel: {
        flex: 1,
        fontSize: 16,
        color: '#f1f5f9',
        fontWeight: '500',
    },
    chevron: {
        fontSize: 22,
        color: '#475569',
    },
    logoutButton: {
        padding: 18,
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
    },
    logoutText: {
        color: '#ef4444',
        fontWeight: 'bold',
        fontSize: 16,
    },
    version: {
        textAlign: 'center',
        marginTop: 40,
        color: '#475569',
        fontSize: 12,
        fontWeight: '600',
    }
});
