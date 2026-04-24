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

function isAndroidEmulator(): boolean {
    if (Platform.OS !== 'android') return false;
    const model = String(Platform.constants?.Model ?? '');
    const brand = String(Platform.constants?.Brand ?? '');
    const fingerprint = String(Platform.constants?.Fingerprint ?? '');
    return (
        brand === 'generic' ||
        /sdk|emulator|gphone|Emulator/i.test(model) ||
        /generic|google_sdk|unknown/i.test(fingerprint)
    );
}

export const getApiBaseUrl = () => {
    if (API_URL_OVERRIDE) {
        return API_URL_OVERRIDE;
    }

    if (Platform.OS === 'web') {
        return config.apiUrl;
    }

    if (Platform.OS === 'ios') {
        return config.apiUrl;
    }

    if (Platform.OS === 'android') {
        if (isAndroidEmulator()) {
            return config.androidEmulatorUrl;
        }
        return config.apiUrl; // Physical device: set EXPO_PUBLIC_API_URL to your LAN IP if needed
    }

    return config.apiUrl;
};
