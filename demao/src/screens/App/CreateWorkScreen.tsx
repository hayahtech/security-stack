import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StatusBar
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { Room, PropertyType, Work } from '../../types';
import { RoomSelector } from '../../components/molecules/RoomSelector';
import { useTheme } from '../../theme/ThemeContext';

export const CreateWorkScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { editMode, workId } = route.params || {};
    const { theme, isDark } = useTheme();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(!!editMode);

    // Form Fields
    const [propertyType, setPropertyType] = useState<PropertyType>('Apartamento');
    const [description, setDescription] = useState('');
    const [clientName, setClientName] = useState('');
    const [address, setAddress] = useState('');
    const [rooms, setRooms] = useState<Room[]>([]);

    // Date Fields
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [estimatedDate, setEstimatedDate] = useState<Date | undefined>(undefined);
    const [showEstPicker, setShowEstPicker] = useState(false);

    // User Role State
    const [userRole, setUserRole] = useState<'admin' | 'painter'>('painter');

    const PROPERTY_TYPES: PropertyType[] = [
        'Apartamento', 'Casa', 'Sobrado', 'Predio', 'Estacionamento', 'Galpao'
    ];

    React.useEffect(() => {
        checkUserRole();
        if (editMode && workId) {
            fetchWorkData();
        }
    }, [editMode, workId]);

    const checkUserRole = async () => {
        const user = auth.currentUser;
        if (user) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                setUserRole(userDoc.data().role || 'painter');
            }
        }
    };

    const fetchWorkData = async () => {
        try {
            const docRef = doc(db, 'works', workId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data() as Work;
                setDescription(data.title);
                setClientName(data.clientName || '');
                setAddress(data.address || '');
                setPropertyType(data.propertyType);
                setRooms(data.rooms);
                if (data.startDate) setStartDate(new Date(data.startDate));
                if (data.estimatedCompletionDate) setEstimatedDate(new Date(data.estimatedCompletionDate));
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Falha ao carregar dados da obra.');
        } finally {
            setFetching(false);
        }
    };

    const calculateTotalArea = (roomsList: Room[]) => {
        return roomsList.reduce((acc, room) => acc + room.areaSqm, 0);
    };

    const handleCreateWork = async () => {
        // Validação
        if (!description.trim() || !clientName.trim() || rooms.length === 0) {
            Alert.alert(
                'Campos Obrigatórios',
                'Por favor, preencha a descrição, o nome do cliente e adicione pelo menos um ambiente.'
            );
            return;
        }

        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Usuário não autenticado");

            const totalArea = calculateTotalArea(rooms);

            if (editMode && workId) {
                // UPDATE
                await updateDoc(doc(db, "works", workId), {
                    title: description,
                    propertyType,
                    address,
                    clientName,
                    rooms,
                    totalAreaSqm: totalArea,
                    startDate: startDate?.toISOString(),
                    estimatedCompletionDate: estimatedDate?.toISOString()
                });
                Alert.alert('Sucesso', 'Obra atualizada!');
            } else {
                // CREATE
                const newId = Math.random().toString(36).substr(2, 9);
                const numberId = Math.floor(1000 + Math.random() * 9000).toString();

                const newWork: Work = {
                    id: newId,
                    numberId: `#${numberId}`,
                    title: description,
                    propertyType,
                    address,
                    clientName,
                    status: 'Em andamento',
                    createdAt: new Date().toISOString(),
                    rooms: rooms,
                    painters: [user.uid],
                    totalAreaSqm: totalArea,
                    progressPercentageByRoom: 0,
                    progressPercentageByArea: 0,
                    startDate: startDate?.toISOString(),
                    estimatedCompletionDate: estimatedDate?.toISOString()
                };

                await setDoc(doc(db, "works", newId), newWork);
                Alert.alert('Sucesso', 'Obra criada com sucesso!');
            }

            navigation.goBack();

        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível salvar a obra. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteWork = () => {
        if (userRole !== 'admin') {
            Alert.alert('Acesso Negado', 'Apenas supervisores podem excluir obras.');
            return;
        }

        Alert.alert(
            'Excluir Obra',
            'ATENÇÃO: Esta ação não pode ser desfeita. Deseja realmente excluir esta obra e todos os seus dados?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir Definitivamente',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await deleteDoc(doc(db, "works", workId));
                            Alert.alert('Excluído', 'A obra foi removida.');
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Dashboard' }],
                            });
                        } catch (e) {
                            Alert.alert('Erro', 'Falha ao excluir.');
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    if (fetching) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor={theme.colors.background}
            />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
                    <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{editMode ? 'Editar Obra' : 'Nova Obra'}</Text>
                <TouchableOpacity onPress={handleCreateWork} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                        <Text style={[styles.saveText, { color: theme.colors.primary }]}>Salvar</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Section: Basic Info */}
                <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>Informações Básicas</Text>
                <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Título / Descrição da Obra</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, color: theme.colors.text }]}
                            placeholder="Ex: Pintura Apt. Centro"
                            placeholderTextColor={theme.colors.placeholder}
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Nome do Cliente</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, color: theme.colors.text }]}
                            placeholder="Nome Completo"
                            placeholderTextColor={theme.colors.placeholder}
                            value={clientName}
                            onChangeText={setClientName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Endereço (Opcional)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, color: theme.colors.text }]}
                            placeholder="Rua, Número, Bairro"
                            placeholderTextColor={theme.colors.placeholder}
                            value={address}
                            onChangeText={setAddress}
                        />
                    </View>

                    {/* Date Fields */}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Início do Serviço</Text>
                            <TouchableOpacity
                                style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border }]}
                                onPress={() => setShowStartPicker(true)}
                            >
                                <Text style={{ color: startDate ? theme.colors.text : theme.colors.placeholder }}>
                                    {startDate ? startDate.toLocaleDateString() : 'DD/MM/AAAA'}
                                </Text>
                            </TouchableOpacity>
                            {showStartPicker && (
                                <DateTimePicker
                                    value={startDate || new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={(event: any, date?: Date) => {
                                        setShowStartPicker(false);
                                        if (date) setStartDate(date);
                                    }}
                                />
                            )}
                        </View>

                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Previsão de Término</Text>
                            <TouchableOpacity
                                style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border }]}
                                onPress={() => setShowEstPicker(true)}
                            >
                                <Text style={{ color: estimatedDate ? theme.colors.text : theme.colors.placeholder }}>
                                    {estimatedDate ? estimatedDate.toLocaleDateString() : 'DD/MM/AAAA'}
                                </Text>
                            </TouchableOpacity>
                            {showEstPicker && (
                                <DateTimePicker
                                    value={estimatedDate || new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={(event: any, date?: Date) => {
                                        setShowEstPicker(false);
                                        if (date) setEstimatedDate(date);
                                    }}
                                    minimumDate={startDate}
                                />
                            )}
                        </View>
                    </View>
                </View>

                {/* Section: Type */}
                <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>Tipo de Imóvel</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.typeRow}
                    contentContainerStyle={{ paddingHorizontal: 4 }}
                >
                    {PROPERTY_TYPES.map(t => (
                        <TouchableOpacity
                            key={t}
                            style={[
                                styles.typeChip,
                                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                                propertyType === t && { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary }
                            ]}
                            onPress={() => setPropertyType(t)}
                        >
                            <Text style={[
                                styles.typeText,
                                { color: theme.colors.textSecondary },
                                propertyType === t && { color: '#FFFFFF', fontWeight: 'bold' }
                            ]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Section: Rooms */}
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                <RoomSelector onRoomsChange={setRooms} initialRooms={rooms} />

                {/* Delete Button (Only in Edit Mode) */}
                {editMode && (
                    <TouchableOpacity
                        style={[styles.deleteButton, { borderColor: theme.colors.danger, backgroundColor: isDark ? 'rgba(239, 68, 68, 0.05)' : '#fee2e2' }]}
                        onPress={handleDeleteWork}
                    >
                        <Text style={[styles.deleteText, { color: theme.colors.danger }]}>
                            {userRole === 'admin' ? '🗑 Excluir Obra' : '🔒 Excluir (Apenas Supervisor)'}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Footer Padding */}
                <View style={{ height: 60 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    cancelButton: {
        padding: 8,
    },
    cancelText: {
        fontSize: 16,
    },
    saveText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 12,
        textTransform: 'uppercase',
        marginTop: 10,
        letterSpacing: 1,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
    },
    typeRow: {
        marginBottom: 24,
    },
    typeChip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 24,
        marginRight: 10,
        borderWidth: 1,
    },
    typeText: {
        fontSize: 14,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        marginVertical: 15,
    },
    deleteButton: {
        marginTop: 40,
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    deleteText: {
        fontWeight: 'bold',
        fontSize: 15,
    }
});
