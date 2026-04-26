import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RoomPackage } from '../../types';
import { useTheme } from '../../theme/ThemeContext';

interface RoomPackageListProps {
    packages: RoomPackage[];
    onSelect: (pkg: RoomPackage) => void;
}

export const RoomPackageList: React.FC<RoomPackageListProps> = ({ packages, onSelect }) => {
    const { theme } = useTheme();

    const renderItem = ({ item }: { item: RoomPackage }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => onSelect(item)}
        >
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.background }]}>
                <MaterialCommunityIcons
                    name={item.icon as any || 'home'}
                    size={32}
                    color={theme.colors.primary}
                />
            </View>
            <Text style={[styles.name, { color: theme.colors.text }]}>
                {item.name}
            </Text>
            <Text style={[styles.area, { color: theme.colors.textSecondary }]}>
                ~{item.defaultAreaSqm} m²
            </Text>
        </TouchableOpacity>
    );

    return (
        <FlatList
            data={packages}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.container}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 8,
    },
    card: {
        flex: 1,
        margin: 8,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        elevation: 2,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    name: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    area: {
        fontSize: 12,
    },
});
