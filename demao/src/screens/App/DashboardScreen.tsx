import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Work } from '../../types';
import { WorkCard } from '../../components/molecules/WorkCard';

export const DashboardScreen = () => {
    const navigation = useNavigation<any>();
    const [works, setWorks] = useState<Work[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchWorks = async () => {
        try {
            const worksRef = collection(db, 'works');
            // In a real app, you might filter by user ID or company ID
            const q = query(worksRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const worksData: Work[] = [];
            querySnapshot.forEach((doc) => {
                worksData.push(doc.data() as Work);
            });

            setWorks(worksData);
        } catch (error) {
            console.error("Error fetching works: ", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchWorks();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchWorks();
    };

    const navigateToCreate = () => {
        navigation.navigate('CreateWork');
    };

    const navigateToDetails = (work: Work) => {
        navigation.navigate('DailyLog', { workId: work.id, workTitle: work.title }); // Simplified flow
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f2f2f7" />
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Olá, Pintor</Text>
                    <Text style={styles.headerTitle}>Suas Obras</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={navigateToCreate}>
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={works}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <WorkCard
                        work={item}
                        onPress={() => navigateToDetails(item)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Nenhuma obra encontrada.</Text>
                            <Text style={styles.emptySubText}>Toque em + para começar.</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f2f7',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60, // Safe area filler roughly
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    greeting: {
        fontSize: 14,
        color: '#666',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1c1c1e',
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    addButtonText: {
        fontSize: 28,
        color: '#fff',
        lineHeight: 30,
        marginTop: -2,
    },
    listContent: {
        padding: 16,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    }
});
