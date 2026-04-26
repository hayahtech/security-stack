import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { format } from 'date-fns';

// Mock Data Type for History
interface BudgetHistoryItem {
    id: string;
    clientName: string;
    date: string;
    totalValue: number;
    regionName: string;
}

// Mock Data (Temporary)
const MOCK_HISTORY: BudgetHistoryItem[] = [
    { id: '1', clientName: 'João Silva', date: '2025-10-10', totalValue: 1250.00, regionName: 'Uberlândia/MG' },
    { id: '2', clientName: 'Maria Oliveira', date: '2025-10-12', totalValue: 3400.50, regionName: 'Litoral SC' },
];

export const BudgetHistoryScreen: React.FC = () => {
    const { theme, isDark } = useTheme();
    const navigation = useNavigation<any>();
    const [searchQuery, setSearchQuery] = useState('');
    const [history, setHistory] = useState<BudgetHistoryItem[]>(MOCK_HISTORY);

    const filteredHistory = history.filter(item =>
        item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.regionName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: BudgetHistoryItem }) => (
        <TouchableOpacity style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.cardHeader}>
                <Text style={[styles.clientName, { color: theme.colors.text }]}>{item.clientName}</Text>
                <Text style={[styles.date, { color: theme.colors.textSecondary }]}>{format(new Date(item.date), 'dd/MM/yyyy')}</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={[styles.region, { color: theme.colors.textSecondary }]}>{item.regionName}</Text>
                <Text style={[styles.value, { color: theme.colors.primary }]}>R$ {item.totalValue.toFixed(2)}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.colors.text }]}>Meus Orçamentos</Text>
            </View>

            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.placeholder} style={{ marginRight: 8 }} />
                <TextInput
                    style={[styles.searchInput, { color: theme.colors.text }]}
                    placeholder="Buscar por cliente, região..."
                    placeholderTextColor={theme.colors.placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* List */}
            <FlatList
                data={filteredHistory}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={{ color: theme.colors.textSecondary }}>Nenhum orçamento encontrado.</Text>
                    </View>
                }
            />

            {/* FAB - New Budget */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('NewBudget')}
            >
                <MaterialCommunityIcons name="plus" size={32} color="#FFF" />
            </TouchableOpacity>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backButton: {
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        paddingHorizontal: 12,
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    listContent: {
        padding: 16,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    clientName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 12,
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    region: {
        fontSize: 14,
    },
    value: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
});
