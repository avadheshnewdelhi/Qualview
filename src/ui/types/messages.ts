import type { PersistedState, ResearchObject, Settings } from './research';
import type { SelectionData } from './context';

// UI → Main Thread Messages
export type UIMessage =
    | { type: 'GET_SELECTION' }
    | { type: 'GET_PERSISTED_STATE' }
    | { type: 'SAVE_STATE'; payload: PersistedState }
    | { type: 'INSERT_RESEARCH_OBJECT'; payload: ResearchObject }
    | { type: 'GET_FILE_TYPE' }
    | { type: 'GET_SETTINGS' }
    | { type: 'SAVE_SETTINGS'; payload: Settings }
    | { type: 'RESIZE'; payload: { width: number; height: number } };

// Main Thread → UI Messages
export type MainMessage =
    | { type: 'SELECTION_CHANGED'; payload: SelectionData }
    | { type: 'STATE_LOADED'; payload: PersistedState | null }
    | { type: 'STATE_SAVED' }
    | { type: 'OBJECT_INSERTED'; payload: { objectId: string; nodeId: string } }
    | { type: 'FILE_TYPE'; payload: 'figma' | 'figjam' }
    | { type: 'SETTINGS_LOADED'; payload: Settings | null }
    | { type: 'SETTINGS_SAVED' }
    | { type: 'ERROR'; payload: { code: string; message: string } };

// Wrapper type for postMessage
export interface PluginMessage {
    pluginMessage: UIMessage | MainMessage;
}
