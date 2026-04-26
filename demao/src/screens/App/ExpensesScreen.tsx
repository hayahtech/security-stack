import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    TextInput,
    Modal,
    Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../../config/firebase';
import { Expense } from '../../types';
import { useTheme } from '../../theme/ThemeContext';

export const ExpensesScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { workId } = route.params || {};
    const { theme, isDark } = useTheme();

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form inputs
    const [item, setItem] = useState('');
    const [amount, setAmount] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);

    useEffect(() => {
        const expensesRef = collection(db, `works/${workId}/expenses`);
        const q = query(expensesRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: Expense[] = [];
            snapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Expense);
            });
            setExpenses(data);
            setLoading(false);
        });

        return unsubscribe;
    }, [workId]);

    const pickImage = async () => {
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        const filename = `invoices/${workId}/${Date.now()}.jpg`;
        const storageRef = ref(storage, filename);

        await uploadBytes(storageRef, blob);
        return await getDownloadURL(storageRef);
    };

    const handleSaveExpense = async () => {
        if (!item.trim() || !amount.trim()) {
            Alert.alert("Erro", "Preencha o nome do item e o valor.");
            return;
        }

        setUploading(true);
        try {
            let photoUrl = '';
            if (imageUri) {
                photoUrl = await uploadImage(imageUri);
            }

            const newExpense: Omit<Expense, 'id'> = {
                workId,
                userId: auth.currentUser?.uid || '',
                date: new Date().toISOString(),
                item,
                amount: parseFloat(amount.replace(',', '.')),
                photoUrl,
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, `works/${workId}/expenses`), newExpense);

            setModalVisible(false);
            resetForm();
            Alert.alert("Sucesso", "Compra registrada!");
        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Falha ao salvar. Tente novamente.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert("Excluir", "Deseja remover este registro?", [
            { text: "Cancelar" },
            {
                text: "Excluir",
                style: "destructive",
                onPress: async () => {
                    await deleteDoc(doc(db, `works/${workId}/expenses`, id));
                }
            }
        ]);
    };

    const resetForm = () => {
        setItem('');
        setAmount('');
        setImageUri(null);
    };

    const calculateTotal = () => {
        return expenses.reduce((acc, curr) => acc + curr.amount, 0);
    };

    const renderItem = ({ item }: { item: Expense }) => (
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.itemDate, { color: theme.colors.textSecondary }]}>
                        {new Date(item.date).toLocaleDateString('pt-BR')}
                    </Text>
                    <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.item}</Text>
                </View>
                <Text style={[styles.itemAmount, { color: theme.colors.danger }]}>
                    R$ {item.amount.toFixed(2)}
                </Text>
            </View>

            {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={styles.invoiceThumb} />
            ) : null}

            <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
            >
                <Text style={styles.deleteText}>Remover</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={[styles.backText, { color: theme.colors.textSecondary }]}>← Voltar</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.colors.text }]}>Compras & Notas</Text>
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
                >
                    <Text style={styles.addBtnText}>+</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.summary, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Total de Gastos</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                    R$ {calculateTotal().toFixed(2)}
                </Text>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
            ) : (
                <FlatList
                    data={expenses}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                            Nenhuma compra registrada.
                        </Text>
                    }
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Nova Compra</Text>

                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Item / Produto</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.inputBg, color: theme.colors.text, borderColor: theme.colors.border }]}
                            placeholder="Ex: 2 Galões de Tinta"
                            placeholderTextColor={theme.colors.placeholder}
                            value={item}
                            onChangeText={setItem}
                        />

                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Valor (R$)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.inputBg, color: theme.colors.text, borderColor: theme.colors.border }]}
                            placeholder="0,00"
                            placeholderTextColor={theme.colors.placeholder}
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />

                        <TouchableOpacity
                            style={[styles.cameraBtn, { borderColor: theme.colors.primary }]}
                            onPress={pickImage}
                        >
                            <Text style={{ color: theme.colors.primary }}>
                                {imageUri ? '📸 Foto Selecionada (Trocar)' : '📸 Tirar Foto da Nota Fiscal'}
                            </Text>
                        </TouchableOpacity>

                        {imageUri && (
                            <Image source={{ uri: imageUri }} style={styles.previewImage} />
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                onPress={() => {
                                    setModalVisible(false);
                                    resetForm();
                                }}
                                style={[styles.actionBtn, { backgroundColor: theme.colors.inputBg }]}
                            >
                                <Text style={{ color: theme.colors.text }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSaveExpense}
                                disabled={uploading}
                                style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
                            >
                                {uploading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Salvar</Text>
                                )}
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
    header: {
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 5,
    },
    backText: {
        fontSize: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    addBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addBtnText: {
        color: '#fff',
        fontSize: 24,
        marginTop: -2,
    },
    summary: {
        padding: 20,
        alignItems: 'center',
        marginBottom: 10,
    },
    summaryLabel: {
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    summaryValue: {
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 5,
    },
    list: {
        padding: 20,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemDate: {
        fontSize: 12,
        marginBottom: 4,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
    },
    itemAmount: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    invoiceThumb: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginTop: 12,
        resizeMode: 'cover',
    },
    deleteBtn: {
        marginTop: 12,
        alignSelf: 'flex-end',
    },
    deleteText: {
        fontSize: 12,
        color: '#ef4444',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontStyle: 'italic',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 20,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 12,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    cameraBtn: {
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 10,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 16,
        resizeMode: 'contain'
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
