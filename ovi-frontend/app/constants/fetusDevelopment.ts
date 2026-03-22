/**
 * Fetus development data for pregnancy weeks 4-40
 * Contains size comparisons, milestones, and animation metadata
 */

export interface WeekDevelopmentData {
    week: number;
    sizeComparison: string;
    sizeInCm: number;
    weightInGrams: number;
    milestones: string[];
    hasAnimation: boolean; // Whether we have a specific illustration for this week
    animationKeyframe?: number; // Reference to closest keyframe week if no specific animation
}

// Keyframe weeks where we have specific illustrations
export const ANIMATION_KEYFRAMES = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40];

export const FETUS_DEVELOPMENT_DATA: Record<number, WeekDevelopmentData> = {
    4: {
        week: 4,
        sizeComparison: 'poppy seed',
        sizeInCm: 0.2,
        weightInGrams: 0.1,
        milestones: [
            'Neural tube is forming',
            'Heart begins to beat',
            'Amniotic sac is developing'
        ],
        hasAnimation: true,
    },
    5: {
        week: 5,
        sizeComparison: 'sesame seed',
        sizeInCm: 0.3,
        weightInGrams: 0.1,
        milestones: [
            'Heart is pumping blood',
            'Brain and spinal cord developing',
            'Arm and leg buds appear'
        ],
        hasAnimation: false,
        animationKeyframe: 4,
    },
    6: {
        week: 6,
        sizeComparison: 'lentil',
        sizeInCm: 0.6,
        weightInGrams: 0.2,
        milestones: [
            'Facial features beginning to form',
            'Intestines are developing',
            'Lung tissue starts forming'
        ],
        hasAnimation: false,
        animationKeyframe: 8,
    },
    7: {
        week: 7,
        sizeComparison: 'blueberry',
        sizeInCm: 1.3,
        weightInGrams: 0.5,
        milestones: [
            'Hands and feet are forming',
            'Eyelids are developing',
            'Brain is growing rapidly'
        ],
        hasAnimation: false,
        animationKeyframe: 8,
    },
    8: {
        week: 8,
        sizeComparison: 'raspberry',
        sizeInCm: 1.6,
        weightInGrams: 1,
        milestones: [
            'All major organs have begun forming',
            'Fingers and toes are webbed',
            'Tail is disappearing'
        ],
        hasAnimation: true,
    },
    9: {
        week: 9,
        sizeComparison: 'grape',
        sizeInCm: 2.3,
        weightInGrams: 2,
        milestones: [
            'Officially a fetus now',
            'Heart has four chambers',
            'Tiny muscles are forming'
        ],
        hasAnimation: false,
        animationKeyframe: 8,
    },
    10: {
        week: 10,
        sizeComparison: 'kumquat',
        sizeInCm: 3.1,
        weightInGrams: 4,
        milestones: [
            'Vital organs are functioning',
            'Bones are forming',
            'Tiny nails are developing'
        ],
        hasAnimation: false,
        animationKeyframe: 12,
    },
    11: {
        week: 11,
        sizeComparison: 'fig',
        sizeInCm: 4.1,
        weightInGrams: 7,
        milestones: [
            'Baby can open and close fists',
            'Tooth buds are appearing',
            'Hair follicles are forming'
        ],
        hasAnimation: false,
        animationKeyframe: 12,
    },
    12: {
        week: 12,
        sizeComparison: 'lime',
        sizeInCm: 5.4,
        weightInGrams: 14,
        milestones: [
            'Reflexes are developing',
            'Intestines are in abdomen',
            'Bone marrow is making blood cells'
        ],
        hasAnimation: true,
    },
    13: {
        week: 13,
        sizeComparison: 'pea pod',
        sizeInCm: 7.4,
        weightInGrams: 23,
        milestones: [
            'Vocal cords are forming',
            'Head is about 1/3 of body size',
            'Fingerprints are developing'
        ],
        hasAnimation: false,
        animationKeyframe: 12,
    },
    14: {
        week: 14,
        sizeComparison: 'lemon',
        sizeInCm: 8.7,
        weightInGrams: 43,
        milestones: [
            'Facial muscles are developing',
            'Kidneys are producing urine',
            'Baby can make facial expressions'
        ],
        hasAnimation: false,
        animationKeyframe: 16,
    },
    15: {
        week: 15,
        sizeComparison: 'apple',
        sizeInCm: 10.1,
        weightInGrams: 70,
        milestones: [
            'Bones are hardening',
            'Baby can sense light',
            'Taste buds are forming'
        ],
        hasAnimation: false,
        animationKeyframe: 16,
    },
    16: {
        week: 16,
        sizeComparison: 'avocado',
        sizeInCm: 11.6,
        weightInGrams: 100,
        milestones: [
            'Nervous system is functioning',
            'Eyes can move slowly',
            'Baby may start hiccupping'
        ],
        hasAnimation: true,
    },
    17: {
        week: 17,
        sizeComparison: 'pear',
        sizeInCm: 13,
        weightInGrams: 140,
        milestones: [
            'Baby can hear sounds',
            'Skeleton is hardening',
            'Sweat glands are developing'
        ],
        hasAnimation: false,
        animationKeyframe: 16,
    },
    18: {
        week: 18,
        sizeComparison: 'bell pepper',
        sizeInCm: 14.2,
        weightInGrams: 190,
        milestones: [
            'Ears are in final position',
            'Baby is yawning',
            'Myelin forming around nerves'
        ],
        hasAnimation: false,
        animationKeyframe: 20,
    },
    19: {
        week: 19,
        sizeComparison: 'mango',
        sizeInCm: 15.3,
        weightInGrams: 240,
        milestones: [
            'Vernix coating skin',
            'Sensory development accelerating',
            'Baby may be able to hear your voice'
        ],
        hasAnimation: false,
        animationKeyframe: 20,
    },
    20: {
        week: 20,
        sizeComparison: 'banana',
        sizeInCm: 16.4,
        weightInGrams: 300,
        milestones: [
            'Halfway through pregnancy!',
            'Baby can hear and respond to sounds',
            'Fingernails have grown'
        ],
        hasAnimation: true,
    },
    21: {
        week: 21,
        sizeComparison: 'carrot',
        sizeInCm: 26.7,
        weightInGrams: 360,
        milestones: [
            'Eyebrows and lids are present',
            'Baby is swallowing amniotic fluid',
            'Bone marrow is making blood cells'
        ],
        hasAnimation: false,
        animationKeyframe: 20,
    },
    22: {
        week: 22,
        sizeComparison: 'papaya',
        sizeInCm: 27.8,
        weightInGrams: 430,
        milestones: [
            'Lips and eyelids are more developed',
            'Pancreas is developing',
            'Baby has regular sleep cycles'
        ],
        hasAnimation: false,
        animationKeyframe: 24,
    },
    23: {
        week: 23,
        sizeComparison: 'grapefruit',
        sizeInCm: 28.9,
        weightInGrams: 501,
        milestones: [
            'Hearing is well developed',
            'Lungs are developing rapidly',
            'Baby can feel movement'
        ],
        hasAnimation: false,
        animationKeyframe: 24,
    },
    24: {
        week: 24,
        sizeComparison: 'corn',
        sizeInCm: 30,
        weightInGrams: 600,
        milestones: [
            'Lungs are developing air sacs',
            'Skin is translucent',
            'Baby is gaining weight steadily'
        ],
        hasAnimation: true,
    },
    25: {
        week: 25,
        sizeComparison: 'rutabaga',
        sizeInCm: 34.6,
        weightInGrams: 660,
        milestones: [
            'Hair is growing',
            'Hands are fully developed',
            'Baby responds to familiar voices'
        ],
        hasAnimation: false,
        animationKeyframe: 24,
    },
    26: {
        week: 26,
        sizeComparison: 'scallion',
        sizeInCm: 35.6,
        weightInGrams: 760,
        milestones: [
            'Eyes are forming',
            'Lungs are maturing',
            'Baby can open eyes'
        ],
        hasAnimation: false,
        animationKeyframe: 28,
    },
    27: {
        week: 27,
        sizeComparison: 'cauliflower',
        sizeInCm: 36.6,
        weightInGrams: 875,
        milestones: [
            'Third trimester begins!',
            'Baby can recognize your voice',
            'Brain is very active'
        ],
        hasAnimation: false,
        animationKeyframe: 28,
    },
    28: {
        week: 28,
        sizeComparison: 'eggplant',
        sizeInCm: 37.6,
        weightInGrams: 1000,
        milestones: [
            'Eyes can blink',
            'Billions of neurons developing',
            'Baby is dreaming'
        ],
        hasAnimation: true,
    },
    29: {
        week: 29,
        sizeComparison: 'butternut squash',
        sizeInCm: 38.6,
        weightInGrams: 1150,
        milestones: [
            'Bones are fully developed',
            'Baby is getting plumper',
            'Muscles and lungs maturing'
        ],
        hasAnimation: false,
        animationKeyframe: 28,
    },
    30: {
        week: 30,
        sizeComparison: 'cabbage',
        sizeInCm: 39.9,
        weightInGrams: 1320,
        milestones: [
            'Eyes can track light',
            'Bone marrow controls blood production',
            'Lanugo hair is shedding'
        ],
        hasAnimation: false,
        animationKeyframe: 32,
    },
    31: {
        week: 31,
        sizeComparison: 'coconut',
        sizeInCm: 41.1,
        weightInGrams: 1500,
        milestones: [
            'All five senses are working',
            'Baby is gaining about 0.5 lb per week',
            'Brain connections are forming rapidly'
        ],
        hasAnimation: false,
        animationKeyframe: 32,
    },
    32: {
        week: 32,
        sizeComparison: 'jicama',
        sizeInCm: 42.4,
        weightInGrams: 1700,
        milestones: [
            'Baby practices breathing',
            'Toenails have grown in',
            'Digestive system is nearly complete'
        ],
        hasAnimation: false,
        animationKeyframe: 28,
    },
    33: {
        week: 33,
        sizeComparison: 'pineapple',
        sizeInCm: 43.7,
        weightInGrams: 1900,
        milestones: [
            'Skull bones are not fused',
            'Immune system is developing',
            'Baby can detect light and dark'
        ],
        hasAnimation: false,
        animationKeyframe: 36,
    },
    34: {
        week: 34,
        sizeComparison: 'cantaloupe',
        sizeInCm: 45,
        weightInGrams: 2150,
        milestones: [
            'Fingernails reach fingertips',
            'Central nervous system maturing',
            'Lungs are nearly mature'
        ],
        hasAnimation: false,
        animationKeyframe: 36,
    },
    35: {
        week: 35,
        sizeComparison: 'honeydew melon',
        sizeInCm: 46.2,
        weightInGrams: 2380,
        milestones: [
            'Kidneys are fully developed',
            'Liver can process waste',
            'Baby is running out of room'
        ],
        hasAnimation: false,
        animationKeyframe: 36,
    },
    36: {
        week: 36,
        sizeComparison: 'romaine lettuce',
        sizeInCm: 47.4,
        weightInGrams: 2620,
        milestones: [
            'Baby is shedding vernix',
            'Gums are rigid',
            'Getting into head-down position'
        ],
        hasAnimation: false,
        animationKeyframe: 28,
    },
    37: {
        week: 37,
        sizeComparison: 'swiss chard',
        sizeInCm: 48.6,
        weightInGrams: 2860,
        milestones: [
            'Baby is full term!',
            'Practicing breathing and sucking',
            'Gaining about 0.5 oz per day'
        ],
        hasAnimation: false,
        animationKeyframe: 40,
    },
    38: {
        week: 38,
        sizeComparison: 'leek',
        sizeInCm: 49.8,
        weightInGrams: 3080,
        milestones: [
            'Organs are ready for life outside',
            'Toenails reach toe tips',
            'Meconium is accumulating'
        ],
        hasAnimation: false,
        animationKeyframe: 40,
    },
    39: {
        week: 39,
        sizeComparison: 'mini watermelon',
        sizeInCm: 50.7,
        weightInGrams: 3290,
        milestones: [
            'Brain is still developing',
            'Skin is smooth and pink',
            'Baby could arrive any day'
        ],
        hasAnimation: false,
        animationKeyframe: 40,
    },
    40: {
        week: 40,
        sizeComparison: 'small pumpkin',
        sizeInCm: 51.2,
        weightInGrams: 3460,
        milestones: [
            'Due date week!',
            'Baby is ready to meet you',
            'Lungs and brain continue maturing'
        ],
        hasAnimation: false,
        animationKeyframe: 28,
    },
};

/**
 * Get development data for a specific week
 */
export function getWeekData(week: number): WeekDevelopmentData | null {
    return FETUS_DEVELOPMENT_DATA[week] || null;
}

/**
 * Get the closest keyframe week for animation
 */
export function getAnimationKeyframe(week: number): number {
    if (week < 4) return 4;
    if (week > 40) return 40;

    // Find closest keyframe
    return ANIMATION_KEYFRAMES.reduce((prev, curr) =>
        Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev
    );
}

/**
 * Get animation file path for a specific week
 */
export function getAnimationPath(week: number): string {
    const keyframe = getAnimationKeyframe(week);
    return `week_${keyframe.toString().padStart(2, '0')}`;
}

/**
 * Map pregnancy week (4-40) to Ovi stage (1-24).
 * Divides the 37 weeks evenly across all 24 stage images.
 */
export function getOviStage(week: number): number {
    if (week < 4) return 1;
    if (week > 40) return 24;
    const stage = Math.round(((week - 4) / 36) * 23) + 1;
    return Math.min(24, Math.max(1, stage));
}
