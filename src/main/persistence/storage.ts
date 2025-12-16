/// <reference types="@figma/plugin-typings" />

const FILE_STATE_KEY = 'qualview_state';
const LEGACY_STATE_KEY = 'qualview_state'; // Same key used in old clientStorage
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
 * Load persisted state from the current Figma FILE (document-scoped)
 * This ensures each file has its own research project
 * 
 * MIGRATION: If no file-scoped data exists, check for legacy global data
 * and migrate it to this file
 */
export async function loadState(): Promise<PersistedState | null> {
    try {
        // First, check file-scoped storage
        const fileData = figma.root.getPluginData(FILE_STATE_KEY);
        if (fileData) {
            return JSON.parse(fileData) as PersistedState;
        }

        // No file-scoped data - check for legacy global storage
        const legacyData = await figma.clientStorage.getAsync(LEGACY_STATE_KEY);
        if (legacyData && typeof legacyData === 'object') {
            console.log('Migrating legacy data from global storage to file storage');

            // Migrate to file-scoped storage
            const state = legacyData as PersistedState;
            figma.root.setPluginData(FILE_STATE_KEY, JSON.stringify(state));

            // Clear the legacy global storage so it doesn't pollute other files
            await figma.clientStorage.deleteAsync(LEGACY_STATE_KEY);

            return state;
        }

        return null;
    } catch (error) {
        console.error('Failed to load state:', error);
        return null;
    }
}

/**
 * Save state to the current Figma FILE (document-scoped)
 * Each file maintains its own research project
 */
export async function saveState(state: PersistedState): Promise<boolean> {
    try {
        figma.root.setPluginData(FILE_STATE_KEY, JSON.stringify(state));
        return true;
    } catch (error) {
        console.error('Failed to save state:', error);
        return false;
    }
}

/**
 * Clear project state for the current file only
 */
export async function clearState(): Promise<boolean> {
    try {
        figma.root.setPluginData(FILE_STATE_KEY, '');
        return true;
    } catch (error) {
        console.error('Failed to clear state:', error);
        return false;
    }
}

/**
 * Load settings from Figma client storage (GLOBAL - persists across all files)
 * Settings like API key should be available in all files
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
 * Save settings to Figma client storage (GLOBAL)
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
export async function clearAllStorage(): Promise<void> {
    figma.root.setPluginData(FILE_STATE_KEY, '');
    await figma.clientStorage.deleteAsync(SETTINGS_KEY);
    await figma.clientStorage.deleteAsync(LEGACY_STATE_KEY);
}
