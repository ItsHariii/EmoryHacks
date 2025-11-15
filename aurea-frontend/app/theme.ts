export const theme = {
  colors: {
    primary: '#800000', // Maroon
    accent: '#A52A2A', // Burgundy
    background: '#FFFFFF',
    surface: '#f5f5f5',
    text: {
      primary: '#333333',
      secondary: '#666666',
      light: '#FFFFFF',
      muted: '#999999',
    },
    border: '#E0E0E0',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#dc3545',
    info: '#2196F3',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  shadows: {
    sm: {
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: 'rgba(0, 0, 0, 0.15)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 8,
    },
  },
} as const;

export type Theme = typeof theme;
