import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
// import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'; // For compression
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../config/firebase';
import { Room, Photo } from '../../types';

export const PhotoCaptureScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { workId, roomId, roomName } = route.params || {};

    const [loading, setLoading] = useState(false);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [type, setType] = useState<'BEFORE' | 'AFTER'>('BEFORE');

    const pickImage = async (useCamera: boolean) => {
        let result;
        if (useCamera) {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (permission.status !== 'granted') {
                Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera.');
                return;
            }
            result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.7, // Basic compression
            });
        } else {
            result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.7,
            });
        }

        if (!result.canceled) {
            handleImageCaptured(result.assets[0].uri);
        }
    };

    const handleImageCaptured = async (uri: string) => {
        // Here we would compress the image further using expo-image-manipulator if needed
        // const manipResult = await manipulateAsync(uri, [{ resize: { width: 1080 } }], { compress: 0.7, format: SaveFormat.JPEG });

        const newPhoto: Photo = {
            id: Math.random().toString(36).substr(2, 9),
            url: uri, // Currently local, upload later or immediately depending on strategy
            type: type,
            createdAt: new Date().toISOString(),
            workId,
            roomId,
            userId: auth.currentUser?.uid || 'unknown',
            uploaded: false
        };

        setPhotos([...photos, newPhoto]);
    };

    const uploadPhotos = async () => {
        if (photos.filter(p => !p.uploaded).length === 0) return;

        setLoading(true);
        try {
            const uploadPromises = photos.map(async (photo) => {
                if (photo.uploaded) return photo;

                // Create blob from URL (which is local uri at this point)
                const response = await fetch(photo.url);
                const blob = await response.blob();

                const storageRef = ref(storage, `works/${workId}/${roomId}/${photo.id}.jpg`);
                await uploadBytes(storageRef, blob);
                const downloadUrl = await getDownloadURL(storageRef);

                // Save reference to Firestore
                await addDoc(collection(db, 'photos'), {
                    ...photo,
                    url: downloadUrl,
                    uploaded: true
                });

                return { ...photo, url: downloadUrl, uploaded: true };
            });

            const uploadedPhotos = await Promise.all(uploadPromises);
            setPhotos(uploadedPhotos);
            Alert.alert('Sucesso', 'Fotos enviadas com sucesso!');
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Falha ao enviar fotos. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Fotos: {roomName}</Text>
                <TouchableOpacity onPress={uploadPhotos} disabled={loading}>
                    <Text style={styles.uploadText}>{loading ? 'Enviando...' : 'Salvar Nuvem'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, type === 'BEFORE' && styles.activeTab]}
                    onPress={() => setType('BEFORE')}
                >
                    <Text style={[styles.tabText, type === 'BEFORE' && styles.activeTabText]}>ANTES</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, type === 'AFTER' && styles.activeTab]}
                    onPress={() => setType('AFTER')}
                >
                    <Text style={[styles.tabText, type === 'AFTER' && styles.activeTabText]}>DEPOIS</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={photos.filter(p => p.type === type)}
                keyExtractor={item => item.id}
                numColumns={3}
                renderItem={({ item }) => (
                    <View style={styles.photoContainer}>
                        <Image source={{ uri: item.url }} style={styles.photo} />
                        {!item.uploaded && <View style={styles.pendingIndicator} />}
                    </View>
                )}
                ListFooterComponent={
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.actionButton} onPress={() => pickImage(true)}>
                            <Text style={styles.actionText}>📷 Câmera</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={() => pickImage(false)}>
                            <Text style={styles.actionText}>🖼️ Galeria</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    uploadText: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#f9f9f9',
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    tabText: {
        color: '#666',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#007AFF',
    },
    photoContainer: {
        width: '33.33%',
        padding: 2,
        position: 'relative',
    },
    photo: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#eee',
    },
    pendingIndicator: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'orange',
        borderWidth: 1,
        borderColor: '#fff',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
    },
    actionButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#f0f0f0',
        borderRadius: 30,
    },
    actionText: {
        fontSize: 16,
        color: '#333',
    }
});
