export const theme = {
  colors: {
    // Primary Colors - Terracotta (warm editorial)
    primary: '#B84C3F', // deep terracotta
    primaryDark: '#8F3A31',
    primaryLight: '#F4E4DF', // warm tint wash (replaces bright pink)
    primarySoft: 'rgba(184, 76, 63, 0.10)',
    primaryGlow: 'rgba(184, 76, 63, 0.20)',

    // Secondary Colors - Soft Pastels (kept for compatibility)
    secondary: '#FFD6C9',
    secondaryPeach: '#FFD6C9',
    secondaryLavender: '#DCD6FF',
    secondaryPeachLight: '#FFF0E6',
    secondaryLavenderLight: '#F2F0FF',

    // Neutrals - Warm bone palette
    background: '#F6F1EA', // warm bone canvas
    backgroundDark: '#EFE7DC', // secondary surface
    surface: '#FFFFFF',
    surfaceHighlight: '#FFFFFF',
    surfaceTint: 'rgba(255, 255, 255, 0.6)',
    border: '#E8DFD2', // hairline on bone
    borderLight: '#F0E8DC', // lighter hairline on white
    borderDark: '#D9CEBF',

    // Accents
    accent: '#8A9A7B', // muted sage (kept for non-primary accents)
    accentLight: '#F5EAD7', // warm ochre tint (legacy alias for accentGoldLight)
    accentGold: '#D19B4E', // warm ochre
    accentGoldLight: '#F5EAD7',
    accentGreenLight: '#E9EEE2',
    secondaryLight: '#EFE7DC', // warm bone tint (legacy alias)

    // Text Colors - warm ink
    text: {
      primary: '#2B221B', // deep ink
      secondary: '#6A5D52', // inkSoft
      muted: '#9C8E80', // inkMute
      light: '#D9CEBF', // inkLine
      inverse: '#FFFFFF',
      link: '#B84C3F',
      onPrimary: '#FFFFFF',
      onSecondary: '#2B221B',
    },

    // Semantic Colors
    success: '#6F8C6F', // muted sage green
    successDark: '#4F6148',
    warning: '#C69348', // warm amber
    warningDark: '#A07835',
    error: '#C0392B',
    errorLight: '#E88080',
    info: '#DCD6FF',
    infoDark: '#B8B0E6',
    notification: '#B84C3F',

    // Safety Status Colors
    safe: '#8A9A7B',
    safeBg: 'rgba(138, 154, 123, 0.15)',
    limited: '#D19B4E',
    limitedBg: 'rgba(209, 155, 78, 0.15)',
    avoid: '#B84C3F',
    avoidBg: 'rgba(184, 76, 63, 0.10)',

    // Macro progress fill — cohesive earth tri-tone
    macroProtein: '#B84C3F', // terracotta (anchors to brand)
    macroCarbs:   '#D19B4E', // warm ochre
    macroFats:    '#8A9A7B', // muted sage

    // Button & UI
    secondaryButtonText: '#4A3B32', // For outline/secondary buttons
    cameraOverlay: 'rgba(0, 0, 0, 0.6)', // Camera overlay background
    // Third-party brand colors (Google OAuth button)
    googleBorderColor: '#747775',
    googleTextColor: '#1F1F1F',
    // Glassmorphism tab bar surface
    surfaceGlass: 'rgba(255, 255, 255, 0.92)',
    surfaceGlassBorder: 'rgba(255, 255, 255, 0.5)',

    // Overlay & Effects
    shadow: 'rgba(74, 59, 50, 0.08)', // Brownish shadow
    shadowSoft: 'rgba(74, 59, 50, 0.04)',
    shadowHard: 'rgba(74, 59, 50, 0.12)',
    overlay: 'rgba(74, 59, 50, 0.4)',
    overlayLight: 'rgba(74, 59, 50, 0.2)',
    overlayHeavy: 'rgba(74, 59, 50, 0.6)',
    shimmer: 'rgba(255, 255, 255, 0.5)',
  },

  // Gradient Presets — kept for API compatibility but all flat (no visible gradient)
  gradients: {
    primary: ['#B84C3F', '#B84C3F'] as const,
    primaryReverse: ['#B84C3F', '#B84C3F'] as const,
    header: ['#F6F1EA', '#F6F1EA'] as const,
    headerReverse: ['#F6F1EA', '#F6F1EA'] as const,
    babyCard: ['#EFE7DC', '#EFE7DC'] as const,
    babyCardReverse: ['#EFE7DC', '#EFE7DC'] as const,
    nutritionRing: ['#EFE7DC', '#EFE7DC'] as const,
    surface: ['#FFFFFF', '#FFFFFF'] as const,
    magicalGlow: ['#EFE7DC', '#EFE7DC'] as const,
    peachGlow: ['#F4E4DF', '#F4E4DF'] as const,
    lavenderGlow: ['#EFE7DC', '#EFE7DC'] as const,
    warmBackground: ['#F6F1EA', '#F6F1EA'] as const,
    sunset: ['#F4E4DF', '#EFE7DC', '#E9EEE2'] as const,
    protein: ['#B84C3F', '#B84C3F'] as const,
    carbs: ['#D19B4E', '#D19B4E'] as const,
    fats: ['#8A9A7B', '#8A9A7B'] as const,
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

  // Typography System — Instrument Sans (body) + Fraunces (display)
  typography: {
    fontFamily: {
      regular: 'InstrumentSans_400Regular',
      medium: 'InstrumentSans_500Medium',
      bold: 'InstrumentSans_700Bold',
      semibold: 'InstrumentSans_600SemiBold',
      // Display serif (Fraunces) — for headings, wordmark, editorial moments
      display: 'Fraunces_400Regular',
      displayItalic: 'Fraunces_400Regular_Italic',
      displayLight: 'Fraunces_300Light',
      displayMediumItalic: 'Fraunces_500Medium_Italic',
      // Legacy alias
      serif: 'InstrumentSans_400Regular',
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
    // Named presets for consistent text styling
    presets: {
      heading1: {
        fontFamily: 'Fraunces_400Regular',
        fontSize: 48,
        fontWeight: '700' as const,
        lineHeight: 52,
        letterSpacing: -1,
      },
      heading2: {
        fontFamily: 'Fraunces_400Regular',
        fontSize: 24,
        fontWeight: '700' as const,
        lineHeight: 30,
        letterSpacing: -0.5,
      },
      heading3: {
        fontFamily: 'Fraunces_400Regular',
        fontSize: 20,
        fontWeight: '600' as const,
        lineHeight: 26,
      },
      body: {
        fontFamily: 'InstrumentSans_400Regular',
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
      },
      bodyLarge: {
        fontFamily: 'InstrumentSans_400Regular',
        fontSize: 18,
        fontWeight: '400' as const,
        lineHeight: 26,
      },
      caption: {
        fontFamily: 'InstrumentSans_400Regular',
        fontSize: 14,
        fontWeight: '400' as const,
        lineHeight: 20,
      },
      captionBold: {
        fontFamily: 'InstrumentSans_600SemiBold',
        fontSize: 14,
        fontWeight: '600' as const,
        lineHeight: 20,
      },
      sectionTitle: {
        fontFamily: 'InstrumentSans_700Bold',
        fontSize: 18,
        fontWeight: '700' as const,
        lineHeight: 24,
      },
      sectionSubtitle: {
        fontFamily: 'InstrumentSans_500Medium',
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
