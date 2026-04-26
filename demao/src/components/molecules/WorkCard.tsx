import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Work } from '../../types';
import { useTheme } from '../../theme/ThemeContext';

interface WorkCardProps {
    work: Work;
    onPress: () => void;
}

export const WorkCard: React.FC<WorkCardProps> = ({ work, onPress }) => {
    const { theme } = useTheme();
    const isCompleted = work.status === 'Concluida';

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={onPress}
        >
            <View style={styles.header}>
                <Text style={[styles.numberId, { color: theme.colors.textSecondary }]}>{work.numberId}</Text>
                <View style={[
                    styles.statusBadge,
                    isCompleted
                        ? { backgroundColor: 'rgba(59, 130, 246, 0.2)' } // Blue alpha
                        : { backgroundColor: 'rgba(16, 185, 129, 0.2)' } // Green alpha
                ]}>
                    <Text style={[
                        styles.statusText,
                        isCompleted
                            ? { color: theme.colors.secondary }
                            : { color: theme.colors.success }
                    ]}>{work.status}</Text>
                </View>
            </View>

            <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>{work.title}</Text>
            <Text style={[styles.propertyType, { color: theme.colors.textSecondary }]}>{work.propertyType}</Text>

            <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
                <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Área Total</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.text }]}>{work.totalAreaSqm} m²</Text>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Progresso (m²)</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.text }]}>{work.progressPercentageByArea.toFixed(1)}%</Text>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Cômodos</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.text }]}>{Math.round(work.progressPercentageByRoom)}%</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    numberId: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    propertyType: {
        fontSize: 14,
        marginBottom: 16,
    },
    footer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        paddingTop: 16,
        justifyContent: 'space-between',
    },
    infoItem: {
        alignItems: 'center',
        flex: 1,
    },
    infoLabel: {
        fontSize: 10,
        marginBottom: 6,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    divider: {
        width: 1,
        height: '80%',
        alignSelf: 'center',
    }
});
