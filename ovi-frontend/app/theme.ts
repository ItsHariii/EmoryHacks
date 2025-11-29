export const theme = {
  colors: {
    // Primary Colors (Rich Burgundy)
    primary: '#B63439', // Rich burgundy red
    primaryDark: '#8F2629',
    primaryLight: '#D4545A',
    
    // Secondary Colors (Warm Terracotta)
    secondary: '#C97C5D', // Warm terracotta
    secondaryDark: '#A86548',
    secondaryLight: '#E09B7F',
    
    // Accent Colors (Soft Gold)
    accent: '#D4A574', // Soft gold/tan
    accentDark: '#B88A5E',
    accentLight: '#E8C9A3',
    
    // Semantic Colors
    success: '#7A9D7E', // Muted sage green
    warning: '#D4A574', // Soft gold (reusing accent)
    error: '#B63439', // Burgundy (reusing primary)
    info: '#8B9DAF', // Soft slate blue
    
    // Neutral Colors (Off-white palette)
    background: '#FAF8F5', // Warm off-white
    surface: '#FFFFFF',
    border: '#E8E3DD',
    
    // Text Colors
    text: {
      primary: '#2C2C2C',
      secondary: '#5A5A5A',
      muted: '#8C8C8C',
      inverse: '#FAF8F5',
    },
    
    // Safety Status Colors
    safe: '#7A9D7E',
    limited: '#D4A574',
    avoid: '#B63439',
    
    // Legacy support (for gradual migration)
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  
  // Typography System
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
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
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Spacing System (4px, 8px, 16px, 24px, 32px, 48px)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border Radius (4px, 8px, 12px, 16px, 24px)
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
  },
  
  // Shadow Styles for Elevation
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  
  // Animation Timings and Easing Functions
  animations: {
    duration: {
      fast: 200,
      normal: 300,
      slow: 400,
    },
    easing: {
      easeIn: 'ease-in' as const,
      easeOut: 'ease-out' as const,
      easeInOut: 'ease-in-out' as const,
    },
  },
  
  // Legacy support for backward compatibility
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
