/// <reference types="@figma/plugin-typings" />

import { getSelectionData } from '../canvas/selection';
import { loadState, saveState, clearState } from '../persistence/storage';
import { insertResearchObject } from '../canvas/renderer';
import { renderVisualization } from '../canvas/vizRenderer';

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
            const selectionData = await getSelectionData();
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

        case 'INSERT_VISUALIZATION': {
            try {
                const { vizType, data } = msg.payload as { vizType: string; data: unknown };
                const result = await renderVisualization(vizType, data);
                figma.ui.postMessage({
                    type: 'VIZ_INSERTED',
                    payload: result,
                });
            } catch (error) {
                figma.ui.postMessage({
                    type: 'ERROR',
                    payload: {
                        code: 'VIZ_INSERT_FAILED',
                        message: error instanceof Error ? error.message : 'Failed to insert visualization',
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
            // Enforce minimum dimensions
            const MIN_WIDTH = 400;
            const MIN_HEIGHT = 600;
            const finalWidth = Math.max(width, MIN_WIDTH);
            const finalHeight = Math.max(height, MIN_HEIGHT);
            figma.ui.resize(finalWidth, finalHeight);
            break;
        }

        case 'SAVE_AUTH': {
            try {
                const { idToken } = msg.payload as { idToken: string };
                await figma.clientStorage.setAsync('qualview_auth_token', idToken);
                figma.ui.postMessage({ type: 'AUTH_SAVED' });
            } catch (err) {
                console.error('Failed to save auth to clientStorage', err);
            }
            break;
        }

        case 'GET_AUTH': {
            try {
                const idToken = await figma.clientStorage.getAsync('qualview_auth_token');
                figma.ui.postMessage({
                    type: 'AUTH_LOADED',
                    payload: idToken ? { idToken } : null,
                });
            } catch (err) {
                console.error('Failed to get auth from clientStorage', err);
                figma.ui.postMessage({ type: 'AUTH_LOADED', payload: null });
            }
            break;
        }

        case 'CLEAR_AUTH': {
            try {
                await figma.clientStorage.deleteAsync('qualview_auth_token');
            } catch (err) {
                console.error('Failed to clear auth from clientStorage', err);
            }
            break;
        }

        default:
            console.warn('Unknown message type:', msg.type);
    }
}
