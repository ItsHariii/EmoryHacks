import {
    calculatePregnancyWeek,
    getWeekTip,
    getTrimesterName,
    getSizeComparison,
    getWeekMilestones,
} from '../pregnancyCalculations';

// Mock fetusDevelopment constants
jest.mock('../../constants/fetusDevelopment', () => ({
    getWeekData: (week: number) => {
        if (week === 10) {
            return {
                sizeComparison: 'Strawberry',
                milestones: ['Fingernails forming'],
            };
        }
        return null;
    },
}));

describe('pregnancyCalculations', () => {
    describe('calculatePregnancyWeek', () => {
        beforeAll(() => {
            // Mock current date to 2023-06-01
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2023-06-01'));
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        it('calculates week 1 correctly (due date ~40 weeks away)', () => {
            // Due date: 2023-06-01 + 280 days = 2024-03-07 (approx)
            // Actually, 280 days from now.
            const dueDate = new Date('2023-06-01');
            dueDate.setDate(dueDate.getDate() + 279); // 279 days away -> day 1 passed -> week 1?
            // Logic: daysPassed = 280 - daysUntilDue
            // If due date is 280 days away, daysPassed = 0. Week = 1.

            const result = calculatePregnancyWeek(dueDate);
            expect(result.week).toBe(1);
            expect(result.trimester).toBe(1);
        });

        it('calculates week 20 correctly (due date ~20 weeks away)', () => {
            const dueDate = new Date('2023-06-01');
            dueDate.setDate(dueDate.getDate() + 140); // 140 days away
            // daysPassed = 280 - 140 = 140.
            // week = floor(140/7) + 1 = 20 + 1 = 21?
            // Wait, if 140 days passed (20 weeks), it should be week 20 or 21 depending on logic.
            // Logic: floor(daysPassed / 7) + 1
            // 140 / 7 = 20. + 1 = 21.

            const result = calculatePregnancyWeek(dueDate);
            expect(result.week).toBe(21);
            expect(result.trimester).toBe(2);
        });

        it('calculates week 40 correctly (due date is today)', () => {
            const dueDate = new Date('2023-06-01');
            const result = calculatePregnancyWeek(dueDate);
            expect(result.week).toBe(40); // Max is 40 in logic?
            // Logic: daysUntilDue = 0. daysPassed = 280.
            // week = floor(280/7) + 1 = 40 + 1 = 41.
            // But logic has Math.min(40, ...). So it should be 40.
            expect(result.week).toBe(40);
            expect(result.trimester).toBe(3);
        });

        it('handles string dates', () => {
            const result = calculatePregnancyWeek('2024-03-07'); // Some future date
            expect(result.week).toBeGreaterThan(0);
        });
    });

    describe('getWeekTip', () => {
        it('returns specific tip for defined week', () => {
            expect(getWeekTip(4)).toContain("Your baby's neural tube is forming");
        });

        it('returns closest tip for undefined week', () => {
            // Week 5 is not defined, closest is 4
            expect(getWeekTip(5)).toContain("Your baby's neural tube is forming");
        });
    });

    describe('getTrimesterName', () => {
        it('returns correct names', () => {
            expect(getTrimesterName(1)).toBe('First Trimester');
            expect(getTrimesterName(2)).toBe('Second Trimester');
            expect(getTrimesterName(3)).toBe('Third Trimester');
            expect(getTrimesterName(4)).toBe('Unknown');
        });
    });

    describe('getSizeComparison', () => {
        it('returns mocked size comparison', () => {
            expect(getSizeComparison(10)).toBe('Strawberry');
        });

        it('returns default for unknown week', () => {
            expect(getSizeComparison(5)).toBe('developing');
        });
    });

    describe('getWeekMilestones', () => {
        it('returns mocked milestones', () => {
            expect(getWeekMilestones(10)).toEqual(['Fingernails forming']);
        });

        it('returns empty array for unknown week', () => {
            expect(getWeekMilestones(5)).toEqual([]);
        });
    });
});
