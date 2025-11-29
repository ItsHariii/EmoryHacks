import { Platform } from 'react-native';

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
    if (Platform.OS === 'web') {
        return config.apiUrl;
    }

    if (Platform.OS === 'ios') {
        return config.apiUrl;
    }

    if (Platform.OS === 'android') {
        const isEmulator = Platform.constants?.Brand === 'generic' ||
            Platform.constants?.Model?.includes('sdk') ||
            Platform.constants?.Model?.includes('Emulator');

        if (isEmulator) {
            return config.androidEmulatorUrl;
        } else {
            return config.apiUrl; // Physical device usually needs real IP or tunnel
        }
    }

    return config.apiUrl;
};
