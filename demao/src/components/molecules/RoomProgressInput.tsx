import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '../../config/firebase';
import { Room, Photo } from '../../types';
import { useTheme } from '../../theme/ThemeContext';

interface RoomProgressInputProps {
    room: Room;
    onUpdate: (updatedRoom: Room) => void;
    workId: string;
}

// Limites de fotos
const MAX_PHOTOS_BEFORE = 15;
const MAX_PHOTOS_AFTER = 15;

export const RoomProgressInput: React.FC<RoomProgressInputProps> = ({ room, onUpdate, workId }) => {
    const { theme } = useTheme();
    const [uploading, setUploading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [localProgress, setLocalProgress] = useState(room.progress);

    // Update local state when prop changes
    React.useEffect(() => {
        setLocalProgress(room.progress);
    }, [room.progress]);

    const handleSliderChange = (val: number) => {
        setLocalProgress(val);
    };

    const saveProgress = () => {
        onUpdate({
            ...room,
            progress: localProgress,
            completed: localProgress === 100
        });
        Alert.alert("Sucesso", "Progresso salvo!");
    };

    // Solicita permissões e escolhe origem da imagem
    const handlePhotoAction = async (type: 'BEFORE' | 'AFTER') => {
        const currentPhotos = type === 'BEFORE' ? room.photosBefore : room.photosAfter;
        const maxPhotos = type === 'BEFORE' ? MAX_PHOTOS_BEFORE : MAX_PHOTOS_AFTER;

        if (currentPhotos.length >= maxPhotos) {
            Alert.alert(
                'Limite atingido',
                `Você já tem ${maxPhotos} fotos ${type === 'BEFORE' ? 'ANTES' : 'DEPOIS'}. Delete alguma para adicionar nova.`
            );
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão negada', 'Precisamos acessar suas fotos.');
            return;
        }

        Alert.alert(
            'Adicionar Foto',
            'Como deseja adicionar a foto?',
            [
                { text: '📷 Tirar Foto', onPress: () => takePhoto(type) },
                { text: '🖼️ Escolher da Galeria', onPress: () => pickImage(type) },
                { text: 'Cancelar', style: 'cancel' }
            ]
        );
    };

    const takePhoto = async (type: 'BEFORE' | 'AFTER') => {
        try {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (permission.status !== 'granted') {
                Alert.alert('Permissão negada', 'Precisamos acessar sua câmera.');
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.6,
            });
            if (!result.canceled && result.assets[0]) {
                uploadImage(result.assets[0].uri, type);
            }
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível abrir a câmera.');
        }
    };

    const pickImage = async (type: 'BEFORE' | 'AFTER') => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.6,
            });
            if (!result.canceled && result.assets[0]) {
                uploadImage(result.assets[0].uri, type);
            }
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
        }
    };

    const uploadImage = async (uri: string, type: 'BEFORE' | 'AFTER') => {
        if (!auth.currentUser) {
            Alert.alert('Erro', 'Usuário não autenticado.');
            return;
        }
        setUploading(true);
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(7);
            const filename = `${workId}/${room.id}/${type}/${timestamp}_${randomId}.jpg`;
            const storageRef = ref(storage, `photos/${filename}`);

            await uploadBytes(storageRef, blob);
            const url = await getDownloadURL(storageRef);

            const newPhoto: Photo = {
                id: randomId,
                url: url,
                userId: auth.currentUser.uid,
                createdAt: new Date().toISOString(),
                type: type,
                workId: workId,
                roomId: room.id,
                uploaded: true
            };

            const updatedPhotos = type === 'BEFORE'
                ? [...room.photosBefore, newPhoto]
                : [...room.photosAfter, newPhoto];

            const updatedRoom = {
                ...room,
                ...(type === 'BEFORE' ? { photosBefore: updatedPhotos } : { photosAfter: updatedPhotos })
            };

            onUpdate(updatedRoom);
            Alert.alert('✅ Sucesso', `Foto ${type === 'BEFORE' ? 'ANTES' : 'DEPOIS'} enviada!`);
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('❌ Erro', 'Falha no upload. Tente novamente.');
        } finally {
            setUploading(false);
        }
    };

    const deletePhoto = (photo: Photo, type: 'BEFORE' | 'AFTER') => {
        Alert.alert(
            'Deletar Foto',
            'Tem certeza que deseja remover esta foto?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Deletar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            try {
                                const storageRef = ref(storage, photo.url);
                                await deleteObject(storageRef);
                            } catch (e) {
                                console.warn("Erro ao deletar do storage", e);
                            }
                            const updatedPhotos = type === 'BEFORE'
                                ? room.photosBefore.filter(p => p.id !== photo.id)
                                : room.photosAfter.filter(p => p.id !== photo.id);

                            const updatedRoom = {
                                ...room,
                                ...(type === 'BEFORE' ? { photosBefore: updatedPhotos } : { photosAfter: updatedPhotos })
                            };
                            onUpdate(updatedRoom);
                            Alert.alert('✅', 'Foto removida');
                        } catch (error) {
                            Alert.alert('❌ Erro', 'Falha ao deletar foto.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <TouchableOpacity
                style={styles.header}
                onPress={() => setExpanded(!expanded)}
            >
                <View style={styles.roomInfo}>
                    <Text style={[styles.roomName, { color: theme.colors.text }]}>{room.name}</Text>
                    <Text style={[styles.roomMeta, { color: theme.colors.textSecondary }]}>{room.type} • {room.areaSqm}m²</Text>
                </View>
                <View style={[styles.progressBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: theme.colors.success }]}>
                    <Text style={[styles.progressText, { color: theme.colors.success }]}>{room.progress}%</Text>
                </View>
            </TouchableOpacity>

            <View style={[styles.progressBarBg, { backgroundColor: theme.colors.border }]}>
                <View style={[styles.progressBarFill, { width: `${room.progress}%`, backgroundColor: theme.colors.success }]} />
            </View>

            {expanded && (
                <View style={[styles.details, { backgroundColor: theme.colors.inputBg, borderTopColor: theme.colors.border }]}>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                        Atualizar Progresso: {localProgress}%
                    </Text>
                    <View style={styles.sliderContainer}>
                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={0}
                            maximumValue={100}
                            step={5}
                            value={localProgress}
                            onValueChange={handleSliderChange}
                            minimumTrackTintColor={theme.colors.success}
                            maximumTrackTintColor={theme.colors.border}
                            thumbTintColor={theme.colors.success}
                        />
                    </View>

                    {localProgress !== room.progress && (
                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}
                            onPress={saveProgress}
                        >
                            <Text style={styles.saveBtnText}>💾 Salvar Progresso</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.statsRow}>
                        <View style={[styles.statBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Área Pintada</Text>
                            <Text style={[styles.statValue, { color: theme.colors.text }]}>
                                {((localProgress / 100) * room.areaSqm).toFixed(1)} m²
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                        Fotos ANTES ({room.photosBefore.length}/{MAX_PHOTOS_BEFORE})
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoGallery}>
                        {room.photosBefore.map((photo) => (
                            <TouchableOpacity
                                key={photo.id}
                                style={[styles.photoThumb, { borderColor: theme.colors.border }]}
                                onLongPress={() => deletePhoto(photo, 'BEFORE')}
                            >
                                <Image source={{ uri: photo.url }} style={styles.photoImage} />
                                <View style={styles.photoDeleteHint}>
                                    <Text style={styles.photoDeleteText}>🗑️</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        {room.photosBefore.length < MAX_PHOTOS_BEFORE && (
                            <TouchableOpacity
                                style={[styles.photoAddBtn, { borderColor: theme.colors.secondary, backgroundColor: 'rgba(59, 130, 246, 0.05)' }]}
                                onPress={() => handlePhotoAction('BEFORE')}
                                disabled={uploading}
                            >
                                <Text style={[styles.photoAddText, { color: theme.colors.secondary }]}>+ Foto</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>

                    <Text style={[styles.label, { marginTop: 16, color: theme.colors.textSecondary }]}>
                        Fotos DEPOIS ({room.photosAfter.length}/{MAX_PHOTOS_AFTER})
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoGallery}>
                        {room.photosAfter.map((photo) => (
                            <TouchableOpacity
                                key={photo.id}
                                style={[styles.photoThumb, { borderColor: theme.colors.border }]}
                                onLongPress={() => deletePhoto(photo, 'AFTER')}
                            >
                                <Image source={{ uri: photo.url }} style={styles.photoImage} />
                                <View style={styles.photoDeleteHint}>
                                    <Text style={styles.photoDeleteText}>🗑️</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        {room.photosAfter.length < MAX_PHOTOS_AFTER && (
                            <TouchableOpacity
                                style={[styles.photoAddBtn, { backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: theme.colors.success }]}
                                onPress={() => handlePhotoAction('AFTER')}
                                disabled={uploading}
                            >
                                <Text style={[styles.photoAddText, { color: theme.colors.success }]}>+ Foto</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>

                    {uploading && (
                        <View style={styles.uploadingContainer}>
                            <ActivityIndicator color={theme.colors.primary} />
                            <Text style={styles.uploadingText}>Enviando foto...</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    roomInfo: {
        flex: 1,
    },
    roomName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    roomMeta: {
        fontSize: 13,
        marginTop: 2,
    },
    progressBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    progressText: {
        fontWeight: '800',
        fontSize: 14,
    },
    progressBarBg: {
        height: 6,
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
    },
    details: {
        padding: 16,
        borderTopWidth: 1,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sliderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 8,
    },
    saveBtn: {
        marginBottom: 20,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    percentBtn: {
        flex: 1,
        paddingVertical: 10,
        borderWidth: 1,
        borderRadius: 10,
        alignItems: 'center',
    },
    percentBtnText: {
        fontSize: 13,
        fontWeight: '700',
    },
    statsRow: {
        marginBottom: 20,
    },
    statBox: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 14,
    },
    statValue: {
        fontWeight: '700',
        fontSize: 16,
    },
    photoGallery: {
        marginBottom: 16,
    },
    photoThumb: {
        width: 110,
        height: 110,
        marginRight: 10,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    photoDeleteHint: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        borderRadius: 14,
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    photoDeleteText: {
        fontSize: 14,
    },
    photoAddBtn: {
        width: 110,
        height: 110,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoAddText: {
        fontWeight: '700',
        fontSize: 14,
    },
    uploadingContainer: {
        marginTop: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 12,
        borderRadius: 12,
    },
    uploadingText: {
        fontSize: 14,
        fontWeight: '600',
    }
});
