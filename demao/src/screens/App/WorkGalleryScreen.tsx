import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Modal,
    ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Work, Photo } from '../../types';

interface GalleryItem extends Photo {
    type: 'BEFORE' | 'AFTER';
    roomName: string;
    uploaderName?: string; // We might fetch this user name later
}

export const WorkGalleryScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { workId } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [photos, setPhotos] = useState<GalleryItem[]>([]);
    const [userNames, setUserNames] = useState<Record<string, string>>({});
    const [filter, setFilter] = useState<'ALL' | 'BEFORE' | 'AFTER'>('ALL');

    // Modal
    const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);

    useEffect(() => {
        fetchPhotos();
    }, [workId]);

    const fetchPhotos = async () => {
        try {
            const docRef = doc(db, 'works', workId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data() as Work;
                const allPhotos: GalleryItem[] = [];
                const uniqueUserIds = new Set<string>();

                data.rooms.forEach(room => {
                    const processPhotos = (list: any[], type: 'BEFORE' | 'AFTER') => {
                        if (!list) return;
                        list.forEach(p => {
                            if (typeof p === 'string') {
                                allPhotos.push({
                                    id: p,
                                    url: p,
                                    userId: 'unknown',
                                    createdAt: new Date().toISOString(),
                                    type,
                                    roomName: room.name,
                                    workId: data.id,
                                    roomId: room.id,
                                    uploaded: true
                                });
                            } else {
                                const photoItem = {
                                    ...p,
                                    type,
                                    roomName: room.name
                                };
                                allPhotos.push(photoItem);
                                if (photoItem.userId) uniqueUserIds.add(photoItem.userId);
                            }
                        });
                    };

                    processPhotos(room.photosBefore, 'BEFORE');
                    processPhotos(room.photosAfter, 'AFTER');
                });

                setPhotos(allPhotos);

                // Fetch User Names
                if (uniqueUserIds.size > 0) {
                    const names: Record<string, string> = {};
                    const userQueries = Array.from(uniqueUserIds).map(uid => getDoc(doc(db, 'users', uid)));
                    const userSnaps = await Promise.all(userQueries);
                    userSnaps.forEach(snap => {
                        if (snap.exists()) {
                            names[snap.id] = snap.data().displayName || snap.data().email;
                        } else {
                            names[snap.id] = 'Usuário';
                        }
                    });
                    setUserNames(names);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredPhotos = photos.filter(p => {
        if (filter === 'ALL') return true;
        return p.type === filter;
    });

    const renderItem = ({ item }: { item: GalleryItem }) => (
        <TouchableOpacity
            style={styles.photoContainer}
            onPress={() => setSelectedPhoto(item)}
        >
            <Image source={{ uri: item.url }} style={styles.thumbnail} />
            <View style={styles.photoOverlay}>
                <Text style={styles.roomName}>{item.roomName}</Text>
                <View style={[
                    styles.tag,
                    { backgroundColor: item.type === 'BEFORE' ? '#3b82f6' : '#10b981' }
                ]}>
                    <Text style={styles.tagText}>{item.type === 'BEFORE' ? 'ANTES' : 'DEPOIS'}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Voltar</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Galeria da Obra</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabs}>
                {['ALL', 'BEFORE', 'AFTER'].map((t) => (
                    <TouchableOpacity
                        key={t}
                        style={[styles.tab, filter === t && styles.activeTab]}
                        onPress={() => setFilter(t as any)}
                    >
                        <Text style={[styles.tabText, filter === t && styles.activeTabText]}>
                            {t === 'ALL' ? 'Todas' : t === 'BEFORE' ? 'Antes' : 'Depois'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} color="#10b981" />
            ) : (
                <FlatList
                    data={filteredPhotos}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Nenhuma foto encontrada nesta obra.</Text>
                    }
                />
            )}

            {/* Modal Viewer */}
            <Modal visible={!!selectedPhoto} transparent={true} animationType="fade">
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.closeArea}
                        onPress={() => setSelectedPhoto(null)}
                    />
                    {selectedPhoto && (
                        <View style={styles.modalContent}>
                            <Image
                                source={{ uri: selectedPhoto.url }}
                                style={styles.fullImage}
                                resizeMode="contain"
                            />
                            <View style={styles.modalFooter}>
                                <Text style={styles.modalTitle}>
                                    {selectedPhoto.roomName} • {selectedPhoto.type === 'BEFORE' ? 'ANTES' : 'DEPOIS'}
                                </Text>
                                <Text style={styles.modalInfo}>
                                    Enviado em {selectedPhoto.createdAt ? new Date(selectedPhoto.createdAt).toLocaleDateString() : '-'}
                                </Text>
                                {selectedPhoto.userId && (
                                    <Text style={styles.modalInfo}>
                                        Por: {userNames[selectedPhoto.userId] || selectedPhoto.userId}
                                    </Text>
                                )}

                                <TouchableOpacity onPress={() => setSelectedPhoto(null)} style={styles.closeBtn}>
                                    <Text style={styles.closeBtnText}>Fechar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e293b',
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1e293b',
    },
    backBtn: {
        padding: 8,
    },
    backText: {
        color: '#fff',
        fontSize: 16,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    tab: {
        marginRight: 10,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#475569',
    },
    activeTab: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    tabText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#fff',
    },
    listContent: {
        padding: 10,
    },
    photoContainer: {
        flex: 1,
        margin: 6,
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#334155',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    photoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    roomName: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        flex: 1,
    },
    tag: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 4,
    },
    tagText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyText: {
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 40,
    },
    // Modal
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
    },
    closeArea: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        width: '100%',
        height: '80%',
        justifyContent: 'center',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    modalFooter: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    modalInfo: {
        color: '#cbd5e1',
        fontSize: 12,
        marginBottom: 4,
    },
    closeBtn: {
        marginTop: 12,
        paddingVertical: 10,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    closeBtnText: {
        color: '#fff',
        fontWeight: '600',
    }
});
