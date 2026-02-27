import { checkFoodSafety } from '../foodSafetyHelper';

// Mock food safety data
jest.mock('../../data/foodSafety', () => ({
    foodSafetyData: [
        {
            name: 'Sushi',
            category: 'avoid',
            reason: 'Raw fish risk',
            safeAlternative: 'Cooked rolls',
        },
        {
            name: 'Coffee',
            category: 'limited',
            reason: 'Caffeine limit',
        },
        {
            name: 'Apple',
            category: 'safe',
            reason: 'Healthy',
        },
    ],
}));

describe('foodSafetyHelper', () => {
    it('returns null for empty input', () => {
        expect(checkFoodSafety('')).toBeNull();
    });

    it('identifies exact match', () => {
        const result = checkFoodSafety('Sushi');
        expect(result).toEqual({
            status: 'avoid',
            reason: 'Raw fish risk Alternative: Cooked rolls',
        });
    });

    it('identifies case-insensitive match', () => {
        const result = checkFoodSafety('sushi');
        expect(result).toEqual({
            status: 'avoid',
            reason: 'Raw fish risk Alternative: Cooked rolls',
        });
    });

    it('identifies partial match (input contains item)', () => {
        const result = checkFoodSafety('Spicy Tuna Sushi Roll');
        expect(result).toEqual({
            status: 'avoid',
            reason: 'Raw fish risk Alternative: Cooked rolls',
        });
    });

    it('identifies partial match (item contains input)', () => {
        // "Sushi" contains "sush" - wait, logic check
        // Logic: normalizedItemName.includes(normalizedInput)
        // "sushi".includes("sush") -> true
        const result = checkFoodSafety('sush');
        expect(result).toEqual({
            status: 'avoid',
            reason: 'Raw fish risk Alternative: Cooked rolls',
        });
    });

    it('returns null for safe/unknown food (if not in list)', () => {
        const result = checkFoodSafety('Water');
        expect(result).toBeNull();
    });

    it('handles limited items', () => {
        const result = checkFoodSafety('Coffee');
        expect(result).toEqual({
            status: 'limited',
            reason: 'Caffeine limit',
        });
    });
});
