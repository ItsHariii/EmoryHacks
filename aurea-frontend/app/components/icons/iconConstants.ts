import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';

/**
 * Icon mapping constants for all app features using MaterialCommunityIcons
 * Following the visual design guide: use only 2-3 colors from theme
 */

export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

// Trimester Icons
export const TRIMESTER_ICONS: Record<number, IconName> = {
  1: 'sprout',              // T1: Early growth
  2: 'flower-outline',      // T2: Blooming
  3: 'baby-face-outline',   // T3: Near completion
};

// Macronutrient Icons
export const MACRONUTRIENT_ICONS: Record<string, IconName> = {
  calories: 'fire',
  protein: 'food-drumstick',
  carbs: 'bread-slice',
  fat: 'oil',
};

// Micronutrient Icons
export const MICRONUTRIENT_ICONS: Record<string, IconName> = {
  'vitamin_d': 'white-balance-sunny',
  'dha': 'fish',
  'folate': 'leaf',
  'iron': 'weight-lifter',
  'calcium': 'bone',
  'choline': 'brain',
  'vitamin_b12': 'pill',
  'magnesium': 'lightning-bolt',
  'vitamin_c': 'fruit-citrus',
  'vitamin_a': 'carrot',
  'fiber': 'grain',
};

// Safety Status Icons
export const SAFETY_STATUS_ICONS: Record<string, IconName> = {
  safe: 'check-circle-outline',
  limited: 'alert-circle-outline',
  avoid: 'close-circle-outline',
};

// Mood Icons (5 levels)
export const MOOD_ICONS: Record<number, IconName> = {
  1: 'emoticon-sad-outline',
  2: 'emoticon-frown-outline',
  3: 'emoticon-neutral-outline',
  4: 'emoticon-happy-outline',
  5: 'emoticon-excited-outline',
};

// Additional Feature Icons
export const FEATURE_ICONS = {
  // Navigation & Actions
  home: 'home-outline' as IconName,
  food: 'food-apple-outline' as IconName,
  journal: 'book-open-outline' as IconName,
  profile: 'account-outline' as IconName,
  search: 'magnify' as IconName,
  add: 'plus-circle-outline' as IconName,
  edit: 'pencil-outline' as IconName,
  delete: 'delete-outline' as IconName,
  save: 'content-save-outline' as IconName,
  close: 'close' as IconName,
  back: 'arrow-left' as IconName,
  
  // Food Logging
  barcode: 'barcode-scan' as IconName,
  camera: 'camera-outline' as IconName,
  meal: 'silverware-fork-knife' as IconName,
  breakfast: 'coffee-outline' as IconName,
  lunch: 'food-variant' as IconName,
  dinner: 'food-turkey' as IconName,
  snack: 'cookie-outline' as IconName,
  
  // Journal & Wellness
  mood: 'emoticon-outline' as IconName,
  sleep: 'sleep' as IconName,
  energy: 'lightning-bolt-outline' as IconName,
  symptoms: 'clipboard-pulse-outline' as IconName,
  cravings: 'heart-outline' as IconName,
  notes: 'note-text-outline' as IconName,
  calendar: 'calendar-outline' as IconName,
  
  // Progress & Stats
  progress: 'chart-line' as IconName,
  target: 'target' as IconName,
  trophy: 'trophy-outline' as IconName,
  checkmark: 'check' as IconName,
  
  // Information & Help
  info: 'information-outline' as IconName,
  help: 'help-circle-outline' as IconName,
  tip: 'lightbulb-outline' as IconName,
  warning: 'alert-outline' as IconName,
  
  // Settings & Account
  settings: 'cog-outline' as IconName,
  notification: 'bell-outline' as IconName,
  logout: 'logout' as IconName,
  
  // Pregnancy Specific
  baby: 'baby-face-outline' as IconName,
  heart: 'heart-outline' as IconName,
  water: 'water-outline' as IconName,
  weight: 'scale-bathroom' as IconName,
};

// Icon Color Palette (only 2-3 colors as per design guide)
export const ICON_COLORS = {
  primary: theme.colors.text.primary,    // Deep plum for most icons
  accent: theme.colors.primary,          // Soft rose for highlighted/active icons
  secondary: theme.colors.secondary,     // Muted sky blue for secondary actions
  success: theme.colors.success,         // For positive states
  warning: theme.colors.warning,         // For caution states
  error: theme.colors.error,             // For negative states
};

// Icon Background Colors (soft containers)
export const ICON_BACKGROUNDS = {
  paleRose: theme.colors.primaryLight,   // #F5D5D8
  cream: theme.colors.accentLight,       // #F9ECD4
  lightBlue: theme.colors.secondaryLight, // #D5E8F5
  white: theme.colors.surface,           // #FFFFFF
};
