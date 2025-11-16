export const theme = {
  colors: {
    // Primary Colors (Soft and Warm)
    primary: '#E8B4B8', // Soft rose pink
    primaryDark: '#D89BA0',
    primaryLight: '#F5D5D8',
    
    // Secondary Colors
    secondary: '#B8D4E8', // Soft sky blue
    secondaryDark: '#9ABFD6',
    secondaryLight: '#D5E8F5',
    
    // Accent Colors
    accent: '#F4D9A6', // Warm cream
    accentDark: '#E8C78A',
    accentLight: '#F9ECD4',
    
    // Semantic Colors
    success: '#A8D5BA', // Soft green
    warning: '#F4C790', // Soft orange
    error: '#E8A4A4', // Soft red
    info: '#A4C4E8', // Soft blue
    
    // Neutral Colors
    background: '#FAF9F7', // Warm off-white
    surface: '#FFFFFF',
    border: '#E8E6E3',
    
    // Text Colors
    text: {
      primary: '#4A4A4A',
      secondary: '#7A7A7A',
      muted: '#A8A8A8',
      inverse: '#FFFFFF',
    },
    
    // Safety Status Colors
    safe: '#A8D5BA',
    limited: '#F4C790',
    avoid: '#E8A4A4',
    
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
