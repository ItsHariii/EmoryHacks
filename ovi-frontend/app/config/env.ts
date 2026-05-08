import { Platform } from 'react-native';

/** If set (e.g. http://10.0.2.2:8000 for Android emulator), overrides auto URL selection. */
const API_URL_OVERRIDE =
    typeof process.env.EXPO_PUBLIC_API_URL === 'string' && process.env.EXPO_PUBLIC_API_URL.length > 0
        ? process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '')
        : null;

const ENV = {
    dev: {
        apiUrl: 'http://localhost:8000',
        androidEmulatorUrl: 'http://10.0.2.2:8000',
    },
    staging: {
        apiUrl: 'https://staging-api.ovi.com', // Placeholder
        androidEmulatorUrl: 'https://staging-api.ovi.com',
    },
    prod: {
        apiUrl: 'https://api.ovi.com', // Placeholder
        androidEmulatorUrl: 'https://api.ovi.com',
    },
};

const getEnvVars = (env = 'dev') => {
    // In a real app, you might use Constants.manifest.releaseChannel
    // or an environment variable injected at build time.
    if (env === 'prod') {
        return ENV.prod;
    } else if (env === 'staging') {
        return ENV.staging;
    } else {
        return ENV.dev;
    }
};

export const config = getEnvVars();

export const getApiBaseUrl = () => {
    if (API_URL_OVERRIDE) {
        return API_URL_OVERRIDE;
    }

    // Block prod builds from silently calling the placeholder host.
    // Set EXPO_PUBLIC_API_URL at build time to point at the real backend.
    if (!__DEV__) {
        throw new Error(
            'EXPO_PUBLIC_API_URL is required for production builds. ' +
            'Set it to the real backend URL before building.'
        );
    }

    if (Platform.OS === 'web') {
        return config.apiUrl;
    }

    if (Platform.OS === 'ios') {
        return config.apiUrl;
    }

    if (Platform.OS === 'android') {
        // Default to emulator URL in dev. Physical device: set EXPO_PUBLIC_API_URL to LAN IP.
        return config.androidEmulatorUrl;
    }

    return config.apiUrl;
};
