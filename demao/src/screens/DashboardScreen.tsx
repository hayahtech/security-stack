import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    StatusBar,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { Work } from '../types';
import { WorkCard } from '../components/molecules/WorkCard';
import { useTheme } from '../theme/ThemeContext';

// Define Filters
type FilterType = 'ALL' | 'ACTIVE' | 'COMPLETED';

export const DashboardScreen = () => {
    const navigation = useNavigation<any>();
    const { theme, toggleTheme, isDark } = useTheme();
    const [works, setWorks] = useState<Work[]>([]);
    const [filteredWorks, setFilteredWorks] = useState<Work[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('ACTIVE');

    // User Info
    const user = auth.currentUser;

    const fetchWorks = useCallback(async () => {
        if (!user) return;

        try {
            const worksRef = collection(db, 'works');
            const q = query(worksRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const worksData: Work[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data() as Work;
                worksData.push(data);
            });

            setWorks(worksData);
            applyFilters(worksData, activeFilter, searchQuery);

        } catch (error) {
            console.error("Error fetching works: ", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, activeFilter, searchQuery]); // Correct dependencies

    useEffect(() => {
        fetchWorks();
    }, [fetchWorks]); // Now fetchWorks is stable

    // Filter Logic
    const applyFilters = (data: Work[], filter: FilterType, search: string) => {
        let result = data;

        // Tipo filter
        if (filter === 'ACTIVE') {
            result = result.filter(w => w.status === 'Em andamento' || w.status === 'Pausada');
        } else if (filter === 'COMPLETED') {
            result = result.filter(w => w.status === 'Concluida');
        }

        // Search filter
        if (search) {
            const lower = search.toLowerCase();
            result = result.filter(w =>
                w.title.toLowerCase().includes(lower) ||
                w.numberId.toLowerCase().includes(lower) ||
                w.propertyType.toLowerCase().includes(lower)
            );
        }

        setFilteredWorks(result);
    };

    // Effect to re-apply filter when state changes
    useEffect(() => {
        applyFilters(works, activeFilter, searchQuery);
    }, [activeFilter, searchQuery, works]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchWorks();
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.headerTop}>
                <View>
                    <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
                        Olá, {user?.displayName || 'Pintor'}
                    </Text>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                        Minhas Obras
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                        onPress={toggleTheme}
                        style={[styles.iconBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBg }]}
                    >
                        <Text style={{ fontSize: 20 }}>{isDark ? '☀️' : '🌙'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={[styles.iconBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBg }]}>
                        <Text style={{ fontSize: 20 }}>⚙️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Profile')}
                        style={[styles.profileBtn, { backgroundColor: theme.colors.secondary, borderColor: theme.colors.surface }]}
                    >
                        <Text style={styles.profileAvatarText}>
                            {user?.displayName?.charAt(0).toUpperCase() || 'P'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Quick Actions - Budget */}
            <TouchableOpacity
                style={[styles.budgetBanner, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('BudgetHistory')}
            >
                <View style={styles.budgetContent}>
                    <Text style={styles.budgetTitle}>Orçamentos</Text>
                    <Text style={styles.budgetSubtitle}>Criar novo ou ver histórico</Text>
                </View>
                <Text style={styles.budgetIcon}>💰</Text>
            </TouchableOpacity>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={[styles.searchInput, { color: theme.colors.text }]}
                    placeholder="Buscar por #id, descrição..."
                    placeholderTextColor={theme.colors.placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {['ACTIVE', 'COMPLETED', 'ALL'].map((filter) => (
                    <TouchableOpacity
                        key={filter}
                        style={[
                            styles.tab,
                            { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border },
                            activeFilter === filter && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                        ]}
                        onPress={() => setActiveFilter(filter as FilterType)}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: theme.colors.textSecondary },
                            activeFilter === filter && { color: '#FFFFFF' }
                        ]}>
                            {filter === 'ACTIVE' ? 'Ativas' : filter === 'COMPLETED' ? 'Concluídas' : 'Todas'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor={theme.colors.background}
            />

            {/* Content List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredWorks}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <WorkCard
                            work={item}
                            onPress={() => navigation.navigate('DailyLog', { workId: item.id })}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={renderHeader()}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📋</Text>
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                Nenhuma obra encontrada.
                            </Text>
                        </View>
                    }
                />
            )}

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('CreateWork')}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        paddingTop: 50,
        paddingBottom: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    greeting: {
        fontSize: 14,
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    profileBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    profileAvatarText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        borderRadius: 16,
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 20,
        borderWidth: 1,
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    tabsContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 24,
        marginRight: 10,
        borderWidth: 1,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
        opacity: 0.3,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    fabText: {
        fontSize: 36,
        color: '#ffffff',
        marginTop: -2,
    },
    budgetBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        elevation: 4,
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    budgetContent: {
        flex: 1,
    },
    budgetTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    budgetSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
    },
    budgetIcon: {
        fontSize: 24,
        marginLeft: 12,
    }
});
