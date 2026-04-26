import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    StatusBar,
    Modal,
    TextInput
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { doc, getDoc, updateDoc, collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { Work, Room, DailyLog } from '../../types';
import { RoomProgressInput } from '../../components/molecules/RoomProgressInput';
import { useTheme } from '../../theme/ThemeContext';

// Mock chart component
const SimpleProgressChart = ({ percent }: { percent: number }) => {
    const { theme } = useTheme();
    return (
        <View style={styles.chartContainer}>
            <View style={[styles.chartOutterCircle, { borderColor: theme.colors.border, backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                <View style={[styles.chartInnerCircle, { height: `${percent}%`, backgroundColor: theme.colors.success }]} />
                <Text style={[styles.chartText, { color: theme.colors.text }]}>{percent.toFixed(0)}%</Text>
            </View>
            <Text style={[styles.chartLabel, { color: theme.colors.textSecondary }]}>Progresso Total (m²)</Text>
        </View>
    );
};

const PREDEFINED_TASKS = [
    {
        category: 'Preparação da superfície',
        tasks: ['Lixar o reboco', 'Aplicar selador', 'Aplicar manta líquida (quando necessário)']
    },
    {
        category: 'Regularização',
        tasks: ['Aplicar massa corrida', 'Riscar as paredes', 'Lixar a massa corrida', 'Aplicar fundo preparador']
    },
    {
        category: 'Texturização (opcional)',
        tasks: ['Aplicar textura', 'Pintar a textura']
    },
    {
        category: 'Pintura',
        tasks: ['Pintar – primeira demão de tinta', 'Fazer catação (correção de imperfeições)', 'Pintar – demão final de acabamento', 'Executar recortes e arremates finais']
    }
];

export const DailyLogScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { workId } = route.params || {};
    const { theme, isDark } = useTheme();

    const [work, setWork] = useState<Work | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showLogModal, setShowLogModal] = useState(false);
    const [logNote, setLogNote] = useState('');
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

    useEffect(() => {
        fetchWork();
        const unsubscribeLogs = fetchLogs();
        return () => unsubscribeLogs();
    }, [workId]);

    const fetchWork = async () => {
        const docRef = doc(db, 'works', workId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data() as Work;
            setWork(data);
            setRooms(data.rooms);
        }
        setLoading(false);
    };

    const fetchLogs = () => {
        const logsRef = collection(db, `works/${workId}/daily_logs`);
        const q = query(logsRef, orderBy('date', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const logsData: DailyLog[] = [];
            snapshot.forEach(doc => logsData.push({ id: doc.id, ...doc.data() } as DailyLog));
            setLogs(logsData);
        });
    };

    const handleUpdateRoom = async (updatedRoom: Room) => {
        // Optimistic Update
        const newRooms = rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r);
        setRooms(newRooms);

        // Recalculate Totals
        const totalArea = newRooms.reduce((sum, r) => sum + r.areaSqm, 0);
        const completedArea = newRooms.reduce((sum, r) => sum + ((r.progress / 100) * r.areaSqm), 0);
        const progressArea = totalArea > 0 ? (completedArea / totalArea) * 100 : 0;

        const completedRoomsCount = newRooms.filter(r => r.progress === 100).length;
        const progressRooms = (completedRoomsCount / newRooms.length) * 100;

        // Persist
        try {
            const workRef = doc(db, 'works', workId);
            await updateDoc(workRef, {
                rooms: newRooms,
                progressPercentageByArea: progressArea,
                progressPercentageByRoom: progressRooms,
                ...(progressArea >= 99.9 ? { status: 'Concluida' } : {})
            });
        } catch (error) {
            console.error("Failed to sync", error);
        }
    };

    const currentProgress = () => {
        if (!rooms.length) return 0;
        const totalArea = rooms.reduce((sum, r) => sum + r.areaSqm, 0);
        const completedArea = rooms.reduce((sum, r) => sum + ((r.progress / 100) * r.areaSqm), 0);
        return totalArea > 0 ? (completedArea / totalArea) * 100 : 0;
    };

    const toggleTask = (task: string) => {
        if (selectedTasks.includes(task)) {
            setSelectedTasks(selectedTasks.filter(t => t !== task));
        } else {
            setSelectedTasks([...selectedTasks, task]);
        }
    };

    const handleCreateLog = async () => {
        if (!logNote.trim() && selectedTasks.length === 0) {
            Alert.alert("Erro", "Adicione uma nota ou selecione as tarefas feitas hoje.");
            return;
        }

        const user = auth.currentUser;
        if (!user) return;

        try {
            await addDoc(collection(db, `works/${workId}/daily_logs`), {
                workId,
                userId: user.uid,
                date: new Date().toISOString(),
                checkInTime: new Date().toISOString(),
                roomsWorkedIds: [], // Future: Select rooms
                notes: logNote,
                tasks: selectedTasks
            });

            setLogNote('');
            setSelectedTasks([]);
            setShowLogModal(false);
            Alert.alert("Sucesso", "Diário registrado!");
        } catch (e) {
            Alert.alert("Erro", "Falha ao registrar diário.");
        }
    };

    const handleEditWork = () => {
        navigation.navigate('CreateWork', { editMode: true, workId: work?.id });
    };

    if (loading) return <View style={[styles.center, { backgroundColor: theme.colors.background }]}><ActivityIndicator color={theme.colors.primary} /></View>;
    if (!work) return <View style={[styles.center, { backgroundColor: theme.colors.background }]}><Text style={{ color: theme.colors.text }}>Obra não encontrada</Text></View>;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar backgroundColor={theme.colors.background} barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={[styles.backText, { color: theme.colors.textSecondary }]}>← Voltar</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>{work.title}</Text>
                <TouchableOpacity onPress={handleEditWork} style={[styles.editBtn, { backgroundColor: theme.colors.inputBg }]}>
                    <Text style={{ fontSize: 18 }}>✏️</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Dashboard Cards */}
                <View style={[styles.statsContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <SimpleProgressChart percent={currentProgress()} />
                    <View style={[styles.statGrid, { borderTopColor: theme.colors.border }]}>
                        <View style={[styles.statCard, { borderRightColor: theme.colors.border }]}>
                            <Text style={[styles.statNumber, { color: theme.colors.text }]}>{work.totalAreaSqm.toFixed(0)}m²</Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Área Total</Text>
                        </View>
                        <View style={[styles.statCard, { borderRightWidth: 0 }]}>
                            <Text style={[styles.statNumber, { color: theme.colors.success }]}>
                                {(work.totalAreaSqm * (currentProgress() / 100)).toFixed(0)}m²
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Concluído</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions Grid */}
                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                        onPress={() => navigation.navigate('Expenses', { workId })}
                    >
                        <Text style={styles.actionIcon}>🧾</Text>
                        <Text style={[styles.actionLabel, { color: theme.colors.text }]}>Compras & Notas</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                        onPress={() => navigation.navigate('PhotoCapture', { workId })}
                    >
                        <Text style={styles.actionIcon}>📷</Text>
                        <Text style={[styles.actionLabel, { color: theme.colors.text }]}>Galeria de Fotos</Text>
                    </TouchableOpacity>
                </View>

                {/* History Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Histórico Diário</Text>
                    <TouchableOpacity onPress={() => setShowLogModal(true)} style={[styles.addLogButton, { backgroundColor: theme.colors.secondary }]}>
                        <Text style={styles.addLogButtonText}>+ Check-in</Text>
                    </TouchableOpacity>
                </View>

                {logs.length === 0 ? (
                    <Text style={[styles.emptyLogs, { color: theme.colors.textSecondary }]}>Nenhum registro ainda.</Text>
                ) : (
                    <View style={styles.logsList}>
                        {logs.slice(0, 5).map(log => (
                            <View key={log.id} style={[styles.logCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                                <View style={styles.logHeader}>
                                    <Text style={[styles.logDate, { color: theme.colors.textSecondary }]}>
                                        {new Date(log.date).toLocaleDateString('pt-BR')}
                                    </Text>
                                    <View style={[styles.timeTag, { backgroundColor: theme.colors.inputBg }]}>
                                        <Text style={[styles.timeTagText, { color: theme.colors.textSecondary }]}>{new Date(log.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </View>
                                </View>
                                {log.tasks && log.tasks.length > 0 && (
                                    <View style={styles.logTasksContainer}>
                                        {log.tasks.map((task, index) => (
                                            <View key={index} style={[styles.taskTag, { backgroundColor: theme.colors.primary + '20' }]}>
                                                <Text style={[styles.taskTagText, { color: theme.colors.primary }]}>✓ {task}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                                <Text style={[styles.logNote, { color: theme.colors.text, marginTop: log.tasks && log.tasks.length > 0 ? 8 : 0 }]}>{log.notes}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Room List */}
                <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12, color: theme.colors.text }]}>Progresso por Ambiente</Text>
                <View style={styles.roomList}>
                    {rooms.map(room => (
                        <RoomProgressInput
                            key={room.id}
                            room={room}
                            workId={work.id}
                            onUpdate={handleUpdateRoom}
                        />
                    ))}
                </View>
            </ScrollView>

            {/* Modal for Check-in */}
            <Modal visible={showLogModal} transparent animationType="slide">
                <View style={[styles.modalBg, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, maxHeight: '85%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Novo Registro Diário</Text>
                            <TouchableOpacity onPress={() => setShowLogModal(false)}>
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>Fechar</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.modalLabel, { color: theme.colors.textSecondary }]}>O que foi feito hoje?</Text>

                            {PREDEFINED_TASKS.map((category) => (
                                <View key={category.category} style={styles.taskCategory}>
                                    <Text style={[styles.categoryTitle, { color: theme.colors.primary }]}>{category.category}</Text>
                                    <View style={styles.tasksGrid}>
                                        {category.tasks.map((task) => {
                                            const isSelected = selectedTasks.includes(task);
                                            return (
                                                <TouchableOpacity
                                                    key={task}
                                                    style={[
                                                        styles.taskOption,
                                                        {
                                                            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                                                            backgroundColor: isSelected ? theme.colors.primary + '15' : 'transparent'
                                                        }
                                                    ]}
                                                    onPress={() => toggleTask(task)}
                                                >
                                                    <Text style={[
                                                        styles.taskOptionText,
                                                        {
                                                            color: isSelected ? theme.colors.primary : theme.colors.text,
                                                            fontWeight: isSelected ? '700' : '400'
                                                        }
                                                    ]}>
                                                        {task}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            ))}

                            <Text style={[styles.modalLabel, { color: theme.colors.textSecondary, marginTop: 10 }]}>Notas (opcional):</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, color: theme.colors.text }]}
                                multiline
                                numberOfLines={3}
                                placeholder="Descreva detalhes adicionais..."
                                placeholderTextColor={theme.colors.placeholder}
                                value={logNote}
                                onChangeText={setLogNote}
                            />
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setShowLogModal(false)} style={styles.modalBtnCancel}>
                                <Text style={[styles.modalBtnTextCancel, { color: theme.colors.textSecondary }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleCreateLog}
                                style={[styles.modalBtnConfirm, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}
                            >
                                <Text style={styles.modalBtnTextConfirm}>Registrar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 8,
        marginLeft: -8,
    },
    backText: {
        fontSize: 16,
    },
    editBtn: {
        padding: 8,
        marginRight: -8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 10,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    statsContainer: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
        alignItems: 'center',
        borderWidth: 1,
    },
    chartContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    chartOutterCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 12,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    chartInnerCircle: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        opacity: 0.4,
    },
    chartText: {
        fontSize: 32,
        fontWeight: 'bold',
        zIndex: 10,
    },
    chartLabel: {
        marginTop: 10,
        fontSize: 14,
        fontWeight: '600',
    },
    statGrid: {
        flexDirection: 'row',
        width: '100%',
        borderTopWidth: 1,
        paddingTop: 20,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        borderRightWidth: 1,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 11,
        marginTop: 6,
        textTransform: 'uppercase',
        fontWeight: '700',
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    actionCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    actionIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    addLogButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        shadowColor: '#3b82f6',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 3,
    },
    addLogButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    emptyLogs: {
        fontStyle: 'italic',
        marginBottom: 20,
        textAlign: 'center',
        paddingVertical: 20,
    },
    logsList: {
        marginBottom: 10,
    },
    logCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    logDate: {
        fontSize: 13,
        fontWeight: '700',
    },
    timeTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    timeTagText: {
        fontSize: 11,
        fontWeight: '600',
    },
    logTasksContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginVertical: 4,
        gap: 6,
    },
    taskTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    taskTagText: {
        fontSize: 12,
        fontWeight: '600',
    },
    logNote: {
        fontSize: 15,
        lineHeight: 22,
    },
    roomList: {
        gap: 16,
    },
    modalBg: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: 40,
        borderWidth: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    modalLabel: {
        fontSize: 14,
        marginBottom: 12,
        fontWeight: '600',
    },
    taskCategory: {
        marginBottom: 18,
    },
    categoryTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    tasksGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    taskOption: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
    },
    taskOptionText: {
        fontSize: 13,
    },
    modalInput: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        textAlignVertical: 'top',
        fontSize: 16,
        marginBottom: 24,
        minHeight: 80,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
        marginTop: 10,
    },
    modalBtnCancel: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    modalBtnTextCancel: {
        fontWeight: '700',
        fontSize: 16,
    },
    modalBtnConfirm: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 16,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    modalBtnTextConfirm: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
