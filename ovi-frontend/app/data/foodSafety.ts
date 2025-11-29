export interface FoodSafetyItem {
    id: string;
    name: string;
    category: 'avoid' | 'caution' | 'safe';
    reason: string;
    safeAlternative?: string;
}

export const foodSafetyData: FoodSafetyItem[] = [
    // Raw or Undercooked Meats & Poultry
    {
        id: 'raw_meat',
        name: 'Raw or Undercooked Meat (Beef, Pork, Lamb)',
        category: 'avoid',
        reason: 'Risk of Salmonella, E. coli, Listeria, and Toxoplasmosis.',
        safeAlternative: 'Cook to 165°F (74°C).',
    },
    {
        id: 'raw_poultry',
        name: 'Raw or Undercooked Poultry',
        category: 'avoid',
        reason: 'Risk of Salmonella and other bacteria.',
        safeAlternative: 'Cook to 165°F (74°C).',
    },
    {
        id: 'steak_tartare',
        name: 'Steak Tartare / Carpaccio',
        category: 'avoid',
        reason: 'Raw meat carries high risk of bacterial contamination.',
        safeAlternative: 'Fully cooked steak.',
    },

    // Raw or Undercooked Seafood
    {
        id: 'raw_sushi',
        name: 'Raw Sushi / Sashimi',
        category: 'avoid',
        reason: 'Risk of Listeria, Salmonella, and parasites.',
        safeAlternative: 'Cooked sushi rolls (e.g., California roll with cooked crab).',
    },
    {
        id: 'raw_shellfish',
        name: 'Raw Oysters / Clams / Mussels',
        category: 'avoid',
        reason: 'High risk of Vibrio and other bacteria.',
        safeAlternative: 'Fully cooked shellfish (145°F/63°C).',
    },

    // Smoked & Cured Fish
    {
        id: 'smoked_salmon',
        name: 'Smoked Salmon (Lox) / Nova',
        category: 'avoid',
        reason: 'Risk of Listeria unless heated.',
        safeAlternative: 'Canned shelf-stable smoked fish or cook until steaming hot.',
    },

    // Deli Meats
    {
        id: 'deli_meat',
        name: 'Deli Meats / Cold Cuts',
        category: 'caution',
        reason: 'Leading cause of Listeria. Can cross placenta.',
        safeAlternative: 'Heat until steaming hot (165°F/74°C).',
    },
    {
        id: 'hot_dogs',
        name: 'Hot Dogs',
        category: 'caution',
        reason: 'Risk of Listeria.',
        safeAlternative: 'Heat until steaming hot.',
    },

    // Organ Meats
    {
        id: 'liver',
        name: 'Liver / Organ Meats',
        category: 'caution',
        reason: 'Extremely high Vitamin A (retinol) can cause birth defects.',
        safeAlternative: 'Limit strictly or avoid.',
    },

    // High Mercury Fish
    {
        id: 'shark',
        name: 'Shark',
        category: 'avoid',
        reason: 'High mercury levels damage fetal nervous system.',
    },
    {
        id: 'swordfish',
        name: 'Swordfish',
        category: 'avoid',
        reason: 'High mercury levels.',
    },
    {
        id: 'king_mackerel',
        name: 'King Mackerel',
        category: 'avoid',
        reason: 'High mercury levels.',
    },
    {
        id: 'tilefish',
        name: 'Tilefish',
        category: 'avoid',
        reason: 'High mercury levels.',
    },

    // Raw Eggs
    {
        id: 'raw_eggs',
        name: 'Raw / Runny Eggs',
        category: 'avoid',
        reason: 'Risk of Salmonella.',
        safeAlternative: 'Cook until firm. Use pasteurized eggs for raw recipes.',
    },
    {
        id: 'homemade_mayo',
        name: 'Homemade Mayonnaise / Aioli',
        category: 'avoid',
        reason: 'Often made with raw eggs.',
        safeAlternative: 'Commercial mayonnaise (pasteurized).',
    },

    // Soft Cheeses
    {
        id: 'brie',
        name: 'Brie / Camembert',
        category: 'caution',
        reason: 'Risk of Listeria if unpasteurized.',
        safeAlternative: 'Choose pasteurized versions or cook until bubbling.',
    },
    {
        id: 'feta',
        name: 'Feta / Blue Cheese',
        category: 'caution',
        reason: 'Risk of Listeria if unpasteurized.',
        safeAlternative: 'Choose pasteurized versions.',
    },
    {
        id: 'queso_fresco',
        name: 'Queso Fresco / Panela',
        category: 'caution',
        reason: 'High risk of Listeria, often unpasteurized.',
        safeAlternative: 'Pasteurized versions only.',
    },

    // Unpasteurized Dairy & Juice
    {
        id: 'raw_milk',
        name: 'Raw (Unpasteurized) Milk',
        category: 'avoid',
        reason: 'Risk of E. coli, Salmonella, Listeria.',
        safeAlternative: 'Pasteurized milk.',
    },
    {
        id: 'unpasteurized_juice',
        name: 'Unpasteurized Juice / Cider',
        category: 'avoid',
        reason: 'Risk of E. coli.',
        safeAlternative: 'Pasteurized juice.',
    },

    // Sprouts
    {
        id: 'raw_sprouts',
        name: 'Raw Sprouts (Alfalfa, Bean)',
        category: 'avoid',
        reason: 'Seeds can harbor bacteria inside; washing doesn\'t remove it.',
        safeAlternative: 'Cook sprouts thoroughly.',
    },

    // Alcohol
    {
        id: 'alcohol',
        name: 'Alcohol',
        category: 'avoid',
        reason: 'No safe amount. Causes Fetal Alcohol Spectrum Disorders.',
        safeAlternative: 'Mocktails, sparkling water.',
    },

    // Caffeine
    {
        id: 'caffeine',
        name: 'Caffeine',
        category: 'caution',
        reason: 'Limit to <200mg/day. High intake linked to miscarriage/low birth weight.',
        safeAlternative: 'Decaf, herbal tea.',
    },
];
