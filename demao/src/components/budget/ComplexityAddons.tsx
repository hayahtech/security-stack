import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ComplexityAddon } from '../../types';
import { useTheme } from '../../theme/ThemeContext';

interface ComplexityAddonsProps {
    addons: ComplexityAddon[];
    selectedAddonIds: string[];
    onToggle: (addonId: string) => void;
}

export const ComplexityAddons: React.FC<ComplexityAddonsProps> = ({ addons, selectedAddonIds, onToggle }) => {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Adicionais de Complexidade</Text>
            {addons.map(addon => {
                const isSelected = selectedAddonIds.includes(addon.id);
                return (
                    <TouchableOpacity
                        key={addon.id}
                        style={[
                            styles.item,
                            {
                                backgroundColor: isSelected ? theme.colors.primary + '15' : theme.colors.surface,
                                borderColor: isSelected ? theme.colors.primary : theme.colors.border
                            }
                        ]}
                        onPress={() => onToggle(addon.id)}
                    >
                        <View style={styles.checkboxContainer}>
                            <MaterialCommunityIcons
                                name={isSelected ? "checkbox-marked" : "checkbox-blank-outline"}
                                size={24}
                                color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                            />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.name, { color: theme.colors.text }]}>{addon.name}</Text>
                            {addon.description && (
                                <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                                    {addon.description}
                                </Text>
                            )}
                        </View>
                        <View style={styles.priceContainer}>
                            <Text style={[styles.price, { color: theme.colors.primary }]}>
                                {addon.type === 'FIXED' && `+ R$ ${addon.value.toFixed(2)}`}
                                {addon.type === 'PER_SQM' && `+ R$ ${addon.value.toFixed(2)}/m²`}
                                {addon.type === 'PERCENTAGE' && `+ ${(addon.value * 100).toFixed(0)}%`}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 8,
    },
    checkboxContainer: {
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
    },
    description: {
        fontSize: 12,
    },
    priceContainer: {
        marginLeft: 8,
    },
    price: {
        fontSize: 12,
        fontWeight: 'bold',
    },
});
