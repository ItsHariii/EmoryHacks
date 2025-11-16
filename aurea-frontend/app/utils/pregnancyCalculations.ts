/**
 * Pregnancy calculation utilities
 */

export interface PregnancyWeekInfo {
  week: number;
  trimester: number;
  daysUntilDue: number;
  daysPassed: number;
}

/**
 * Calculate current pregnancy week and trimester from due date
 * @param dueDate - The expected due date
 * @returns Pregnancy week information
 */
export function calculatePregnancyWeek(dueDate: Date | string): PregnancyWeekInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  due.setHours(0, 0, 0, 0);
  
  // Calculate days until due date
  const daysUntilDue = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Total pregnancy is 280 days (40 weeks)
  const totalDays = 280;
  const daysPassed = totalDays - daysUntilDue;
  
  // Calculate week (add 1 because week 1 starts at day 0)
  const week = Math.max(1, Math.min(40, Math.floor(daysPassed / 7) + 1));
  
  // Calculate trimester
  let trimester: number;
  if (week <= 13) {
    trimester = 1;
  } else if (week <= 27) {
    trimester = 2;
  } else {
    trimester = 3;
  }
  
  return {
    week,
    trimester,
    daysUntilDue: Math.max(0, daysUntilDue),
    daysPassed: Math.max(0, daysPassed),
  };
}

/**
 * Get week-specific tip or milestone
 * @param week - Current pregnancy week
 * @returns Tip or milestone text
 */
export function getWeekTip(week: number): string {
  const tips: { [key: number]: string } = {
    1: "Your pregnancy journey begins! Focus on folic acid intake.",
    4: "Your baby's neural tube is forming. Keep taking prenatal vitamins.",
    8: "Baby's major organs are developing. Stay hydrated!",
    12: "End of first trimester! Morning sickness may start to ease.",
    13: "Welcome to the second trimester! Energy levels often improve.",
    16: "You might start feeling baby's movements soon!",
    20: "Halfway there! Baby can hear sounds now.",
    24: "Baby's lungs are developing. Keep up with iron intake.",
    27: "Third trimester begins! Baby is growing rapidly.",
    28: "Baby's eyes can open and close. Rest when you can.",
    32: "Baby is gaining weight. Focus on protein and calcium.",
    36: "Almost there! Baby is getting into position for birth.",
    37: "Full term! Baby could arrive any day now.",
    40: "Due date week! Stay calm and prepared.",
  };
  
  // Find the closest week with a tip
  const availableWeeks = Object.keys(tips).map(Number).sort((a, b) => a - b);
  const closestWeek = availableWeeks.reduce((prev, curr) => 
    Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev
  );
  
  return tips[closestWeek] || "Every week brings you closer to meeting your baby!";
}

/**
 * Get trimester name
 * @param trimester - Trimester number (1, 2, or 3)
 * @returns Trimester name
 */
export function getTrimesterName(trimester: number): string {
  const names = {
    1: 'First Trimester',
    2: 'Second Trimester',
    3: 'Third Trimester',
  };
  return names[trimester as keyof typeof names] || 'Unknown';
}
