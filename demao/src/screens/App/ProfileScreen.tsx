import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const ProfileScreen = () => {
    const navigation = useNavigation<any>();
    const user = auth.currentUser;
    const [stats, setStats] = useState({ active: 0, completed: 0 });
    const [loading, setLoading] = useState(true);

    const COLORS = {
        slate900: '#1e293b',
        slate800: '#334155',
        slate50: '#f8fafc',
        emerald500: '#10b981',
        blue500: '#3b82f6',
        white: '#ffffff',
        slate500: '#64748b',
        slate400: '#94a3b8',
        slate700: '#475569',
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        if (!user) return;
        try {
            const worksRef = collection(db, 'works');
            const activeQuery = query(
                worksRef,
                where('painters', 'array-contains', user.uid),
            );

            const snapshot = await getDocs(activeQuery);
            const worksData = snapshot.docs.map(doc => doc.data());

            const activeCount = worksData.filter(w => w.status !== 'Concluida').length;
            const completedCount = worksData.filter(w => w.status === 'Concluida').length;

            setStats({ active: activeCount, completed: completedCount });
        } catch (e) {
            console.error("Error fetching profile stats:", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header / Cover */}
            <View style={[styles.header, { backgroundColor: COLORS.slate900 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
                    <Text style={styles.settingsText}>⚙️</Text>
                </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View style={styles.profileSection}>
                <View style={[styles.avatarContainer, { borderColor: COLORS.white }]}>
                    <Text style={styles.avatarText}>
                        {user?.displayName?.charAt(0).toUpperCase() || 'P'}
                    </Text>
                </View>
                <Text style={styles.name}>{user?.displayName || 'Pintor Profissional'}</Text>
                <Text style={styles.email}>{user?.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: COLORS.emerald500 }]}>
                    <Text style={styles.roleText}>Pintor Certificado</Text>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: COLORS.blue500 }]}>{stats.active}</Text>
                    <Text style={styles.statLabel}>Obras Ativas</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: COLORS.emerald500 }]}>{stats.completed}</Text>
                    <Text style={styles.statLabel}>Concluídas</Text>
                </View>
            </View>

            {/* Menu Items */}
            <ScrollView style={styles.menuContainer}>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
                    <Text style={styles.menuIcon}>✏️</Text>
                    <Text style={styles.menuText}>Editar Dados Pessoais</Text>
                    <Text style={styles.menuChevron}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuIcon}>📊</Text>
                    <Text style={styles.menuText}>Relatório de Desempenho</Text>
                    <Text style={styles.menuChevron}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuIcon}>⭐</Text>
                    <Text style={styles.menuText}>Avaliações</Text>
                    <Text style={styles.menuChevron}>›</Text>
                </TouchableOpacity>
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
        height: 180,
        paddingTop: 50,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    backBtn: {
        padding: 8,
        marginLeft: -8,
    },
    backText: {
        color: '#94a3b8',
        fontWeight: '600',
    },
    settingsBtn: {
        width: 44,
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    settingsText: {
        fontSize: 20,
    },
    profileSection: {
        alignItems: 'center',
        marginTop: -60,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    avatarText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
    },
    name: {
        marginTop: 16,
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: -0.5,
    },
    email: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 12,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    roleText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#334155',
        margin: 24,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    divider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    menuContainer: {
        paddingHorizontal: 24,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 18,
        borderRadius: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    menuIcon: {
        fontSize: 22,
        marginRight: 16,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#f1f5f9',
        fontWeight: '600',
    },
    menuChevron: {
        fontSize: 22,
        color: '#475569',
    }
});
