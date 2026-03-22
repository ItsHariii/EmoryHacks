export const theme = {
  colors: {
    // Primary Colors - Soft Red/Pink
    primary: '#D65A5A', // Softer Red
    primaryDark: '#B04040',
    primaryLight: '#FF8F8F',
    primarySoft: 'rgba(214, 90, 90, 0.1)',
    primaryGlow: 'rgba(214, 90, 90, 0.25)',

    // Secondary Colors - Soft Pastels
    secondary: '#FFD6C9', // Peach
    secondaryPeach: '#FFD6C9',
    secondaryLavender: '#DCD6FF', // Lavender
    secondaryPeachLight: '#FFF0E6',
    secondaryLavenderLight: '#F2F0FF',

    // Neutrals
    background: '#FFF5F2', // Warm Cream Background
    backgroundDark: '#F9EBE6',
    surface: '#FFFFFF',
    surfaceHighlight: '#FFFFFF',
    surfaceTint: 'rgba(255, 255, 255, 0.6)',
    border: '#F0E6E0',
    borderLight: '#F7F0EB',
    borderDark: '#E6D6CE',

    // Accents
    accent: '#A8D5BA', // Soft Green
    accentGold: '#FFE5A0', // Soft Gold
    accentGoldLight: '#FFF5D6',
    accentGreenLight: '#E6F5EB',

    // Text Colors
    text: {
      primary: '#4A3B32', // Dark Brown/Grey
      secondary: '#8C7B70', // Muted Brown
      muted: '#B0A096',
      light: '#D6C6BC',
      inverse: '#FFFFFF',
      link: '#D65A5A',
      onPrimary: '#FFFFFF',
      onSecondary: '#4A3B32',
    },

    // Semantic Colors
    success: '#A8D5BA', // Soft Green
    successDark: '#86B396',
    warning: '#FFE5A0', // Soft Gold
    warningDark: '#E6CC8A',
    error: '#D65A5A', // Soft Red
    errorLight: '#FF8F8F',
    info: '#DCD6FF', // Soft Lavender
    infoDark: '#B8B0E6',

    // Safety Status Colors
    safe: '#A8D5BA',
    safeBg: 'rgba(168, 213, 186, 0.15)',
    limited: '#FFE5A0',
    limitedBg: 'rgba(255, 229, 160, 0.15)',
    avoid: '#D65A5A',
    avoidBg: 'rgba(214, 90, 90, 0.1)',

    // Macro Card Colors
    macroProtein: '#FFD6C9', // Peach
    macroProteinBg: '#FFF0E6',
    macroCarbs: '#E6D6CE', // Taupe/Beige
    macroCarbsBg: '#F7F0EB',
    macroFats: '#DCD6FF', // Lavender
    macroFatsBg: '#F2F0FF',

    // Button & UI
    secondaryButtonText: '#4A3B32', // For outline/secondary buttons
    cameraOverlay: 'rgba(0, 0, 0, 0.6)', // Camera overlay background

    // Overlay & Effects
    shadow: 'rgba(74, 59, 50, 0.08)', // Brownish shadow
    shadowSoft: 'rgba(74, 59, 50, 0.04)',
    shadowHard: 'rgba(74, 59, 50, 0.12)',
    overlay: 'rgba(74, 59, 50, 0.4)',
    overlayLight: 'rgba(74, 59, 50, 0.2)',
    overlayHeavy: 'rgba(74, 59, 50, 0.6)',
    shimmer: 'rgba(255, 255, 255, 0.5)',
  },

  // Gradient Presets - Enhanced for Pastel Aesthetic
  gradients: {
    primary: ['#FF9A9E', '#FECFEF'] as const, // Pink/Rose
    primaryReverse: ['#FECFEF', '#FF9A9E'] as const,
    header: ['#FFF5F2', '#FFD6C9'] as const,
    headerReverse: ['#FFD6C9', '#FFF5F2'] as const,
    babyCard: ['#FFD6C9', '#DCD6FF'] as const, // Peach to Lavender
    babyCardReverse: ['#DCD6FF', '#FFD6C9'] as const,
    nutritionRing: ['#FFD6C9', '#DCD6FF'] as const,
    surface: ['#FFFFFF', '#FFF5F2'] as const,
    magicalGlow: ['#DCD6FF', '#FFD6C9'] as const,
    peachGlow: ['#FFD6C9', '#FFF0E6'] as const,
    lavenderGlow: ['#DCD6FF', '#F2F0FF'] as const,
    warmBackground: ['#FFF5F2', '#F9EBE6'] as const,
    sunset: ['#FFD6C9', '#FECFEF', '#DCD6FF'] as const,
    // New gradients for progress bars
    protein: ['#FFD6C9', '#FFB09C'] as const,
    carbs: ['#E6D6CE', '#D6C6BC'] as const,
    fats: ['#DCD6FF', '#B8B0E6'] as const,
  },

  // Glassmorphism Presets
  glass: {
    default: {
      intensity: 20,
      tint: 'light' as const,
      style: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
      },
    },
    heavy: {
      intensity: 40,
      tint: 'light' as const,
      style: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.6)',
        borderWidth: 1,
      },
    },
    light: {
      intensity: 10,
      tint: 'light' as const,
      style: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
      },
    },
    blur: {
      intensity: 30,
      tint: 'light' as const,
      style: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1,
      },
    },
    warm: {
      intensity: 15,
      tint: 'light' as const,
      style: {
        backgroundColor: 'rgba(255, 245, 242, 0.7)',
        borderColor: 'rgba(255, 214, 201, 0.3)',
        borderWidth: 1,
      },
    },
  },

  // Typography System – DM Sans (loaded via expo-font in App.tsx)
  typography: {
    fontFamily: {
      regular: 'DMSans_400Regular',
      medium: 'DMSans_500Medium',
      bold: 'DMSans_700Bold',
      semibold: 'DMSans_600SemiBold',
      serif: 'DMSans_400Regular',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
      display: 40,
      hero: 48,
    },
    fontWeight: {
      light: '300' as const,
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extrabold: '800' as const,
    },
    lineHeight: {
      tight: 1.2,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
    letterSpacing: {
      tighter: -1,
      tight: -0.5,
      normal: 0,
      wide: 0.5,
      wider: 1,
    },
    // Named presets for consistent text styling (fontFamily matches loaded DM Sans weights)
    presets: {
      heading1: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 48,
        fontWeight: '700' as const,
        lineHeight: 52,
        letterSpacing: -1,
      },
      heading2: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 24,
        fontWeight: '700' as const,
        lineHeight: 30,
        letterSpacing: -0.5,
      },
      heading3: {
        fontFamily: 'DMSans_600SemiBold',
        fontSize: 20,
        fontWeight: '600' as const,
        lineHeight: 26,
      },
      body: {
        fontFamily: 'DMSans_400Regular',
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
      },
      bodyLarge: {
        fontFamily: 'DMSans_400Regular',
        fontSize: 18,
        fontWeight: '400' as const,
        lineHeight: 26,
      },
      caption: {
        fontFamily: 'DMSans_400Regular',
        fontSize: 14,
        fontWeight: '400' as const,
        lineHeight: 20,
      },
      captionBold: {
        fontFamily: 'DMSans_600SemiBold',
        fontSize: 14,
        fontWeight: '600' as const,
        lineHeight: 20,
      },
      sectionTitle: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 18,
        fontWeight: '700' as const,
        lineHeight: 24,
      },
      sectionSubtitle: {
        fontFamily: 'DMSans_500Medium',
        fontSize: 14,
        fontWeight: '500' as const,
        lineHeight: 20,
      },
    },
  },

  // Spacing System
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    huge: 32,
    massive: 48,
    screenMargin: 20,
    cardPadding: 24,
    sectionSpacing: 28,
    sectionTitleTop: 18,
    sectionTitleBottom: 8,
  },

  // Border Radius
  borderRadius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    pill: 100,
    card: 24, // Slightly reduced for cleaner look
    button: 16,
    chip: 20,
    full: 9999,
  },

  // Shadow Styles - Soft & Diffused
  shadows: {
    card: {
      shadowColor: 'rgba(74, 59, 50, 0.08)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    xs: {
      shadowColor: 'rgba(74, 59, 50, 0.04)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    sm: {
      shadowColor: 'rgba(74, 59, 50, 0.06)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: 'rgba(74, 59, 50, 0.08)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    lg: {
      shadowColor: 'rgba(74, 59, 50, 0.1)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 6,
    },
    xl: {
      shadowColor: 'rgba(74, 59, 50, 0.12)',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 32,
      elevation: 8,
    },
    soft: {
      shadowColor: 'rgba(214, 90, 90, 0.1)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 5,
    },
    glow: {
      shadowColor: 'rgba(220, 214, 255, 0.4)',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 4,
    },
    glowLavender: {
      shadowColor: 'rgba(220, 214, 255, 0.5)',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
      elevation: 6,
    },
    glowPeach: {
      shadowColor: 'rgba(255, 214, 201, 0.4)',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 5,
    },
    inner: {
      shadowColor: 'rgba(74, 59, 50, 0.05)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 0,
    },
  },

  // Animation Timings
  animations: {
    duration: {
      instant: 100,
      fast: 200,
      normal: 300,
      slow: 400,
      slower: 500,
      long: 600,
      extraLong: 800,
    },
    easing: {
      linear: 'linear' as const,
      easeIn: 'ease-in' as const,
      easeOut: 'ease-out' as const,
      easeInOut: 'ease-in-out' as const,
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' as const,
      bounce: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)' as const,
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)' as const,
    },
    presets: {
      fadeIn: {
        duration: 300,
        easing: 'ease-out' as const,
      },
      slideUp: {
        duration: 400,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)' as const,
      },
      bounce: {
        duration: 500,
        easing: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)' as const,
      },
      spring: {
        duration: 600,
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' as const,
      },
    },
  },

  // Layout constants
  layout: {
    screenPadding: 20,
    screenPaddingLarge: 24,
    cardPadding: 24,
    cardPaddingSmall: 16,
    headerHeight: 60,
    tabBarHeight: 70, // Taller for floating effect
    maxContentWidth: 1200,
    minTouchTarget: 44,
  },

  // Icon Sizes
  iconSize: {
    xxs: 10,
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    xxl: 40,
    huge: 48,
    massive: 64,
  },

  // Z-Index Layers
  zIndex: {
    base: 0,
    below: -1,
    card: 10,
    dropdown: 50,
    sticky: 100,
    header: 100,
    overlay: 500,
    modal: 1000,
    popover: 1500,
    toast: 2000,
    tooltip: 3000,
  },

  // Opacity levels
  opacity: {
    disabled: 0.4,
    muted: 0.6,
    medium: 0.8,
    high: 0.9,
    full: 1,
  },

  // Legacy support
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export type Theme = typeof theme;

// Utility functions for theme
export const themeUtils = {
  // Get color with opacity
  withOpacity: (color: string, opacity: number): string => {
    // Convert hex to rgba
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },

  // Get spacing value
  spacing: (...values: Array<keyof typeof theme.spacing>): number[] => {
    return values.map(key => theme.spacing[key]);
  },

  // Combine shadows
  combineShadows: (...shadows: Array<keyof typeof theme.shadows>) => {
    // For React Native, we can only use one shadow, so return the largest
    return theme.shadows[shadows[shadows.length - 1]];
  },
};
