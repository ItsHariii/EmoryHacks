import 'react-native-gesture-handler/jestSetup';

import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';
jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
    cancelAllScheduledNotificationsAsync: jest.fn(),
    addNotificationResponseReceivedListener: jest.fn(),
    removeNotificationSubscription: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    notificationAsync: jest.fn(),
    selectionAsync: jest.fn(),
}));

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('expo-linear-gradient', () => ({
    LinearGradient: ({ children }) => children,
}));

jest.mock('@expo/vector-icons', () => ({
    MaterialCommunityIcons: 'MaterialCommunityIcons',
    Ionicons: 'Ionicons',
}));

jest.mock('react-native-svg', () => ({
    __esModule: true,
    default: 'Svg',
    Circle: 'Circle',
    G: 'G',
    Defs: 'Defs',
    LinearGradient: 'LinearGradient',
    Stop: 'Stop',
    Rect: 'Rect',
    Path: 'Path',
}));

jest.mock('react-native-gifted-charts', () => ({
    BarChart: () => null,
    LineChart: () => null,
    PieChart: () => null,
}));
