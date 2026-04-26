import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useBudgetCalculator } from '../../hooks/useBudgetCalculator';
import { RoomPackageList } from '../../components/budget/RoomPackageList';
import { ComplexityAddons } from '../../components/budget/ComplexityAddons';
import { BudgetItem, RoomPackage, RegionalProfile, ServiceBasePrice } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type BudgetMode = 'FAST' | 'DETAILED';

export const NewBudgetScreen: React.FC = () => {
    const { theme } = useTheme();
    const { data, calculateItemPrice, calculateTotalBudget } = useBudgetCalculator();

    const [mode, setMode] = useState<BudgetMode>('FAST');
    const [selectedRegionId, setSelectedRegionId] = useState<string>(data.regionalProfiles[0]?.id || '');

    // Current Item State (Being built)
    const [currentPackage, setCurrentPackage] = useState<RoomPackage | null>(null);
    const [currentServiceId, setCurrentServiceId] = useState<string>(data.services[0]?.id || '');
    const [currentAddonIds, setCurrentAddonIds] = useState<string[]>([]);

    // Cart
    const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);

    const selectedRegion = data.regionalProfiles.find(r => r.id === selectedRegionId);

    // Derived Values
    const currentArea = currentPackage ? currentPackage.defaultAreaSqm : 0; // TODO: Implement manual input for Detailed Mode

    const currentItemPrice = useMemo(() => {
        if (!currentArea || !selectedRegion) return 0;
        return calculateItemPrice(currentArea, currentServiceId, currentAddonIds, selectedRegionId);
    }, [currentArea, currentServiceId, currentAddonIds, selectedRegionId]);

    const totalBudget = useMemo(() => {
        return calculateTotalBudget(budgetItems, selectedRegionId);
    }, [budgetItems, selectedRegionId]);

    const handleAddItem = () => {
        if (!currentPackage || !selectedRegion) return;

        const newItem: BudgetItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: currentPackage.name,
            roomPackageId: currentPackage.id,
            areaSqm: currentArea,
            serviceId: currentServiceId,
            selectedAddons: currentAddonIds,
            calculatedPrice: currentItemPrice
        };

        setBudgetItems([...budgetItems, newItem]);

        // Reset selection (optional, or keep generic settings)
        setCurrentPackage(null);
        setCurrentAddonIds([]);
    };

    const handleRemoveItem = (id: string) => {
        setBudgetItems(prev => prev.filter(i => i.id !== id));
    };

    const toggleAddon = (id: string) => {
        setCurrentAddonIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header & Mode Switch */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Novo Orçamento</Text>
                    <View style={styles.modeSwitch}>
                        <Text style={{ color: mode === 'FAST' ? theme.colors.primary : theme.colors.textSecondary }}>Rápido</Text>
                        <Switch
                            value={mode === 'DETAILED'}
                            onValueChange={(val) => setMode(val ? 'DETAILED' : 'FAST')}
                            thumbColor={theme.colors.primary}
                            trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
                        />
                        <Text style={{ color: mode === 'DETAILED' ? theme.colors.primary : theme.colors.textSecondary }}>Detalhado</Text>
                    </View>
                </View>

                {/* Region Selector */}
                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Região da Obra</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                        {data.regionalProfiles.map(region => (
                            <TouchableOpacity
                                key={region.id}
                                style={[
                                    styles.chip,
                                    selectedRegionId === region.id
                                        ? { backgroundColor: theme.colors.primary }
                                        : { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border }
                                ]}
                                onPress={() => setSelectedRegionId(region.id)}
                            >
                                <Text style={{ color: selectedRegionId === region.id ? '#FFF' : theme.colors.text }}>
                                    {region.name} (x{region.multiplier})
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Step 1: Select Room (Fast Mode) */}
                {mode === 'FAST' && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>1. Escolha o Cômodo</Text>
                        <RoomPackageList
                            packages={data.roomPackages}
                            onSelect={setCurrentPackage}
                        />
                    </View>
                )}

                {/* Selected Room Configurator (Shows when room is selected) */}
                {currentPackage && (
                    <View style={[styles.configurator, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}>
                        <View style={styles.configHeader}>
                            <Text style={[styles.configTitle, { color: theme.colors.text }]}>{currentPackage.name}</Text>
                            <Text style={[styles.configArea, { color: theme.colors.textSecondary }]}>{currentPackage.defaultAreaSqm} m²</Text>
                        </View>

                        {/* Service Selection */}
                        <Text style={[styles.subLabel, { color: theme.colors.text }]}>Serviço Base:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                            {data.services.map(service => (
                                <TouchableOpacity
                                    key={service.id}
                                    style={[
                                        styles.chip,
                                        currentServiceId === service.id
                                            ? { backgroundColor: theme.colors.secondary }
                                            : { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border }
                                    ]}
                                    onPress={() => setCurrentServiceId(service.id)}
                                >
                                    <Text style={{ color: currentServiceId === service.id ? '#FFF' : theme.colors.text }}>
                                        {service.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Addons */}
                        <ComplexityAddons
                            addons={data.complexityAddons}
                            selectedAddonIds={currentAddonIds}
                            onToggle={toggleAddon}
                        />

                        {/* Add Button */}
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                            onPress={handleAddItem}
                        >
                            <Text style={styles.addButtonText}>Adicionar por R$ {currentItemPrice.toFixed(2)}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Budget Summary List */}
                {budgetItems.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Resumo do Orçamento</Text>
                        {budgetItems.map((item, index) => (
                            <View key={item.id} style={[styles.summaryItem, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.summaryItemName, { color: theme.colors.text }]}>{item.name}</Text>
                                    <Text style={[styles.summaryItemDetail, { color: theme.colors.textSecondary }]}>
                                        {item.areaSqm}m² - {data.services.find(s => s.id === item.serviceId)?.name}
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.summaryItemPrice, { color: theme.colors.primary }]}>R$ {item.calculatedPrice.toFixed(2)}</Text>
                                    <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                                        <MaterialCommunityIcons name="delete" size={20} color={theme.colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

            </ScrollView>

            {/* Footer Total */}
            <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
                <View>
                    <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>Total Estimado</Text>
                    <Text style={[styles.totalValue, { color: theme.colors.primary }]}>R$ {totalBudget.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={[styles.finishButton, { backgroundColor: theme.colors.secondary }]}>
                    <Text style={styles.finishButtonText}>Finalizar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    modeSwitch: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    section: {
        marginBottom: 24,
        borderRadius: 12,
        padding: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    chipsContainer: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    configurator: {
        borderRadius: 12,
        borderWidth: 2,
        padding: 16,
        marginBottom: 24,
    },
    configHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    configTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    configArea: {
        fontSize: 16,
        fontWeight: '600',
    },
    subLabel: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    addButton: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    addButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    summaryItemName: {
        fontSize: 16,
        fontWeight: '600',
    },
    summaryItemDetail: {
        fontSize: 12,
    },
    summaryItemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: 1,
        elevation: 8,
    },
    totalLabel: {
        fontSize: 12,
    },
    totalValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    finishButton: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    finishButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    }
});
