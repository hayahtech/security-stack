import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ScrollView,
    Keyboard
} from 'react-native';
import { Room, RoomType } from '../../types';
import { useTheme } from '../../theme/ThemeContext';

interface RoomSelectorProps {
    onRoomsChange: (rooms: Room[]) => void;
    initialRooms?: Room[];
}

const ROOM_TYPES: RoomType[] = [
    'Sala', 'Quarto', 'Banheiro', 'Cozinha', 'Sacada',
    'Hall', 'Corredor', 'Teto', 'Fachada', 'Garagem',
    'Piscina', 'Outros'
];

export const RoomSelector: React.FC<RoomSelectorProps> = ({ onRoomsChange, initialRooms = [] }) => {
    const { theme, isDark } = useTheme();
    const [selectedType, setSelectedType] = useState<RoomType>('Sala');
    const [roomName, setRoomName] = useState('');
    const [area, setArea] = useState('');
    const [addedRooms, setAddedRooms] = useState<Room[]>(initialRooms);

    const handleAddRoom = () => {
        if (!area) return;

        // Auto-generate name if empty
        const count = addedRooms.filter(r => r.type === selectedType).length + 1;
        const finalName = roomName || `${selectedType} ${count}`;

        const newRoom: Room = {
            id: Math.random().toString(36).substr(2, 9),
            name: finalName,
            type: selectedType,
            areaSqm: parseFloat(area.replace(',', '.')),
            progress: 0,
            completed: false,
            photosBefore: [],
            photosAfter: []
        };

        const updatedRooms = [...addedRooms, newRoom];
        setAddedRooms(updatedRooms);
        onRoomsChange(updatedRooms);

        // Reset specific fields
        setRoomName('');
        setArea('');
        Keyboard.dismiss();
    };

    const handleRemoveRoom = (id: string) => {
        const updatedRooms = addedRooms.filter(r => r.id !== id);
        setAddedRooms(updatedRooms);
        onRoomsChange(updatedRooms);
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Ambientes da Obra</Text>
            <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>Selecione o tipo, defina a área e adicione à lista.</Text>

            {/* Type Selector */}
            <View style={styles.typeScrollContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {ROOM_TYPES.map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.typeChip,
                                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                                selectedType === type && { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary }
                            ]}
                            onPress={() => setSelectedType(type)}
                        >
                            <Text style={[
                                styles.typeText,
                                { color: theme.colors.textSecondary },
                                selectedType === type && { color: '#FFFFFF', fontWeight: 'bold' }
                            ]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Inputs */}
            <View style={styles.formRow}>
                <View style={{ flex: 2 }}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Nome (Opcional)</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, color: theme.colors.text }]}
                        placeholder={`Ex: ${selectedType} Principal`}
                        placeholderTextColor={theme.colors.placeholder}
                        value={roomName}
                        onChangeText={setRoomName}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Área (m²)</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, color: theme.colors.text }]}
                        placeholder="0.0"
                        placeholderTextColor={theme.colors.placeholder}
                        value={area}
                        onChangeText={setArea}
                        keyboardType="numeric"
                    />
                </View>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}
                    onPress={handleAddRoom}
                >
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            {addedRooms.length > 0 && (
                <View style={[styles.listContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <Text style={[styles.listTitle, { color: theme.colors.textSecondary }]}>Lista de Ambientes ({addedRooms.length})</Text>
                    {addedRooms.map((item) => (
                        <View key={item.id} style={[styles.roomItem, { borderBottomColor: theme.colors.border }]}>
                            <View style={styles.roomInfo}>
                                <Text style={[styles.roomName, { color: theme.colors.text }]}>{item.name}</Text>
                                <Text style={[styles.roomMeta, { color: theme.colors.textSecondary }]}>{item.type} • {item.areaSqm} m²</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleRemoveRoom(item.id)} style={[styles.removeBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2' }]}>
                                <Text style={styles.removeText}>🗑️</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    helperText: {
        fontSize: 14,
        marginBottom: 16,
    },
    typeScrollContainer: {
        marginBottom: 20,
    },
    typeChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        marginRight: 10,
        borderWidth: 1,
    },
    typeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    formRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 12,
        marginBottom: 8,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        height: 54,
    },
    addButton: {
        width: 54,
        height: 54,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
    },
    listContainer: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
    },
    listTitle: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    roomItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    roomInfo: {
        flex: 1,
    },
    roomName: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    roomMeta: {
        fontSize: 13,
        marginTop: 4,
    },
    removeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeText: {
        fontSize: 16,
    }
});
