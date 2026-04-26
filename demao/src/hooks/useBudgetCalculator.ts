import { useMemo } from 'react';
import { BudgetItem, ComplexityAddon, RegionalProfile, ServiceBasePrice } from '../types';
import { INITIAL_SEED_DATA } from '../data/budgetData';

export const useBudgetCalculator = () => {
    const { REGIONAL_PROFILES, SERVICES, COMPLEXITY_ADDONS, ROOM_PACKAGES } = INITIAL_SEED_DATA;

    const calculateItemPrice = (
        areaSqm: number,
        serviceId: string,
        selectedAddonIds: string[],
        regionId: string
    ): number => {
        const service = SERVICES.find(s => s.id === serviceId);
        const region = REGIONAL_PROFILES.find(r => r.id === regionId);

        if (!service || !region) return 0;

        const baseLaborCost = areaSqm * service.pricePerSqm;

        let totalAddonsCost = 0;
        let percentageMultiplier = 1;

        selectedAddonIds.forEach(addonId => {
            const addon = COMPLEXITY_ADDONS.find(a => a.id === addonId);
            if (addon) {
                if (addon.type === 'FIXED') {
                    totalAddonsCost += addon.value;
                } else if (addon.type === 'PER_SQM') {
                    totalAddonsCost += addon.value * areaSqm;
                } else if (addon.type === 'PERCENTAGE') {
                    percentageMultiplier += addon.value;
                }
            }
        });

        const subtotal = baseLaborCost + totalAddonsCost;
        const totalWithPercentage = subtotal * percentageMultiplier;

        return totalWithPercentage * region.multiplier;
    };

    const calculateTotalBudget = (items: BudgetItem[], regionId: string): number => {
        // Note: If items already have calculatedPrice, we could just sum them.
        // However, ensuring re-calculation with the current region is safer.
        return items.reduce((acc, item) => {
            return acc + calculateItemPrice(item.areaSqm, item.serviceId, item.selectedAddons, regionId);
        }, 0);
    };

    return {
        calculateItemPrice,
        calculateTotalBudget,
        data: {
            regionalProfiles: REGIONAL_PROFILES,
            services: SERVICES,
            complexityAddons: COMPLEXITY_ADDONS,
            roomPackages: ROOM_PACKAGES
        }
    };
};
