/// <reference types="@figma/plugin-typings" />

import { getSelectionData } from '../canvas/selection';
import { loadState, saveState, loadSettings, saveSettings, clearState } from '../persistence/storage';
import { insertResearchObject } from '../canvas/renderer';

interface UIMessage {
    type: string;
    payload?: unknown;
}

/**
 * Handle messages from the UI
 */
export async function handleMessage(msg: UIMessage): Promise<void> {
    switch (msg.type) {
        case 'GET_SELECTION': {
            const selectionData = getSelectionData();
            figma.ui.postMessage({
                type: 'SELECTION_CHANGED',
                payload: selectionData,
            });
            break;
        }

        case 'GET_PERSISTED_STATE': {
            const state = await loadState();
            figma.ui.postMessage({
                type: 'STATE_LOADED',
                payload: state,
            });
            break;
        }

        case 'SAVE_STATE': {
            const success = await saveState(msg.payload as Parameters<typeof saveState>[0]);
            if (success) {
                figma.ui.postMessage({ type: 'STATE_SAVED' });
            } else {
                figma.ui.postMessage({
                    type: 'ERROR',
                    payload: { code: 'SAVE_FAILED', message: 'Failed to save state' },
                });
            }
            break;
        }

        case 'GET_FILE_TYPE': {
            const fileType = figma.editorType === 'figjam' ? 'figjam' : 'figma';
            figma.ui.postMessage({
                type: 'FILE_TYPE',
                payload: fileType,
            });
            break;
        }

        case 'GET_SETTINGS': {
            const settings = await loadSettings();
            figma.ui.postMessage({
                type: 'SETTINGS_LOADED',
                payload: settings,
            });
            break;
        }

        case 'SAVE_SETTINGS': {
            const success = await saveSettings(msg.payload as Parameters<typeof saveSettings>[0]);
            if (success) {
                figma.ui.postMessage({ type: 'SETTINGS_SAVED' });
            } else {
                figma.ui.postMessage({
                    type: 'ERROR',
                    payload: { code: 'SAVE_FAILED', message: 'Failed to save settings' },
                });
            }
            break;
        }

        case 'INSERT_RESEARCH_OBJECT': {
            try {
                const result = await insertResearchObject(msg.payload as Parameters<typeof insertResearchObject>[0]);
                figma.ui.postMessage({
                    type: 'OBJECT_INSERTED',
                    payload: result,
                });
            } catch (error) {
                figma.ui.postMessage({
                    type: 'ERROR',
                    payload: {
                        code: 'INSERT_FAILED',
                        message: error instanceof Error ? error.message : 'Failed to insert object',
                    },
                });
            }
            break;
        }

        case 'CLEAR_STATE': {
            const success = await clearState();
            if (success) {
                figma.ui.postMessage({ type: 'STATE_CLEARED' });
            } else {
                figma.ui.postMessage({
                    type: 'ERROR',
                    payload: { code: 'CLEAR_FAILED', message: 'Failed to clear state' },
                });
            }
            break;
        }

        case 'RESIZE': {
            const { width, height } = msg.payload as { width: number; height: number };
            figma.ui.resize(width, height);
            break;
        }

        default:
            console.warn('Unknown message type:', msg.type);
    }
}
