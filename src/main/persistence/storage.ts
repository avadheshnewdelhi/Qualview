/// <reference types="@figma/plugin-typings" />

const STORAGE_KEY = 'qualview_state';
const SETTINGS_KEY = 'qualview_settings';

interface PersistedState {
    version: 1;
    context: unknown;
    researchObjects: unknown[];
    currentStep: number;
    transcripts: unknown[];
    lastSaved: number;
}

interface Settings {
    apiKey: string;
    model: 'gpt-4o' | 'gpt-4-turbo';
}

/**
 * Load persisted state from Figma file storage
 */
export async function loadState(): Promise<PersistedState | null> {
    try {
        const data = await figma.clientStorage.getAsync(STORAGE_KEY);
        if (data && typeof data === 'object') {
            return data as PersistedState;
        }
        return null;
    } catch (error) {
        console.error('Failed to load state:', error);
        return null;
    }
}

/**
 * Save state to Figma file storage
 */
export async function saveState(state: PersistedState): Promise<boolean> {
    try {
        await figma.clientStorage.setAsync(STORAGE_KEY, state);
        return true;
    } catch (error) {
        console.error('Failed to save state:', error);
        return false;
    }
}

/**
 * Load settings from Figma client storage (not file-scoped)
 */
export async function loadSettings(): Promise<Settings | null> {
    try {
        const data = await figma.clientStorage.getAsync(SETTINGS_KEY);
        if (data && typeof data === 'object') {
            return data as Settings;
        }
        return null;
    } catch (error) {
        console.error('Failed to load settings:', error);
        return null;
    }
}

/**
 * Save settings to Figma client storage
 */
export async function saveSettings(settings: Settings): Promise<boolean> {
    try {
        await figma.clientStorage.setAsync(SETTINGS_KEY, settings);
        return true;
    } catch (error) {
        console.error('Failed to save settings:', error);
        return false;
    }
}

/**
 * Clear all stored data (for debugging)
 */
export async function clearStorage(): Promise<void> {
    await figma.clientStorage.deleteAsync(STORAGE_KEY);
    await figma.clientStorage.deleteAsync(SETTINGS_KEY);
}
