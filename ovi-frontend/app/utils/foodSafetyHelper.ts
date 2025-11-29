import { foodSafetyData, FoodSafetyItem } from '../data/foodSafety';

export const checkFoodSafety = (foodName: string): { status: 'safe' | 'limited' | 'avoid'; reason: string } | null => {
    if (!foodName) return null;

    const normalizedInput = foodName.toLowerCase().trim();

    // Find a match where the safety item name is contained in the input (e.g., "Sushi" in "Spicy Tuna Sushi Roll")
    // or the input is contained in the safety item name (e.g., "Raw Egg" in "Raw / Runny Eggs")
    const match = foodSafetyData.find((item) => {
        const normalizedItemName = item.name.toLowerCase();

        // Check for exact word matches to avoid false positives (e.g., "tea" in "steak")
        // This is a simple implementation; for production, a more robust fuzzy search or keyword matching would be better.

        // 1. Check if item name is in input
        if (normalizedInput.includes(normalizedItemName)) return true;

        // 2. Check if input is in item name (for shorter inputs like "sushi")
        if (normalizedItemName.includes(normalizedInput)) return true;

        // 3. Check keywords from item name
        const keywords = normalizedItemName.split(/[\s/(),]+/).filter(k => k.length > 3);
        return keywords.some(keyword => normalizedInput.includes(keyword));
    });

    if (match) {
        return {
            status: match.category,
            reason: match.reason + (match.safeAlternative ? ` Alternative: ${match.safeAlternative}` : ''),
        };
    }

    return null;
};
