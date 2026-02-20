import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
    ResearchContext,
    ResearchObject,
    PersistedState,
    Settings,
    ContextSource,
    SelectionData,
    ResearchObjectType,
    ResearchObjectContent,
    ConfidenceLevel,
    Transcript,
} from '@/types';
import type { BiasCheckResult } from '@/lib/prompts/bias';
import { postMessage } from '@/lib/figma';
import { MOCK_PROJECT } from '@/lib/mockProject';

// Workflow steps
export const STEPS = [
    { id: 0, name: 'Context', description: 'Gather research context' },
    { id: 1, name: 'Framing', description: 'Define research approach' },
    { id: 2, name: 'Plan', description: 'Create research plan' },
    { id: 3, name: 'Screener', description: 'Generate screener questions' },
    { id: 4, name: 'Evaluate', description: 'Evaluate responses' },
    { id: 5, name: 'Interview', description: 'Create interview guide' },
    { id: 6, name: 'Synthesis', description: 'Synthesize insights' },
] as const;

interface UIState {
    currentStep: number;
    isLoading: boolean;
    loadingMessage: string;
    error: string | null;
    settingsOpen: boolean;
    fileType: 'figma' | 'figjam';
}

// Uploaded response for evaluation
export interface UploadedResponse {
    participantId: string;
    answers: Record<string, string>;
}

interface StoreState {
    // UI State
    ui: UIState;

    // Context
    context: ResearchContext;
    canvasSelection: SelectionData;

    // Research Objects
    researchObjects: ResearchObject[];

    // Transcripts
    transcripts: Transcript[];

    // Uploaded Responses for Evaluation
    uploadedResponses: UploadedResponse[];

    // Step-level context (additional context per step, persisted across tab switches)
    stepContexts: Record<string, string>;

    // Settings
    settings: Settings | null;

    // Bias check results (persisted across tab switches)
    biasCheckResults: Record<string, BiasCheckResult>;

    // Previous versions for version diff / restore
    previousVersions: Record<string, { content: ResearchObjectContent; diffs: Array<{ questionId: string; biasType: string; before: string; after: string; rationale: string }> }>;

    // Actions
    setCurrentStep: (step: number) => void;
    setLoading: (loading: boolean, message?: string) => void;
    setError: (error: string | null) => void;
    setSettingsOpen: (open: boolean) => void;
    setFileType: (type: 'figma' | 'figjam') => void;

    // Context Actions
    setCanvasSelection: (selection: SelectionData) => void;
    addContextSource: (source: Omit<ContextSource, 'id'>) => void;
    removeContextSource: (id: string) => void;
    updateNormalizedSummary: (summary: string) => void;

    // Research Object Actions
    addResearchObject: <T extends ResearchObjectContent>(
        type: ResearchObjectType,
        content: T,
        confidence: ConfidenceLevel,
        suggestions: string[]
    ) => ResearchObject<T>;
    updateResearchObject: (id: string, updates: Partial<ResearchObject>) => void;
    getResearchObject: (type: ResearchObjectType) => ResearchObject | undefined;

    // Transcript Actions
    addTranscripts: (transcripts: Omit<Transcript, 'id'>[]) => void;
    removeTranscript: (id: string) => void;

    // Uploaded Response Actions
    addUploadedResponse: (response: UploadedResponse) => void;
    clearUploadedResponses: () => void;

    // Settings Actions
    setSettings: (settings: Settings) => void;

    // Step Context Actions
    setStepContext: (stepKey: string, value: string) => void;
    getStepContext: (stepKey: string) => string;

    // Bias Check Actions
    setBiasCheckResult: (artifactType: string, result: BiasCheckResult) => void;
    clearBiasCheckResult: (artifactType: string) => void;
    setPreviousVersion: (artifactType: string, content: ResearchObjectContent, diffs: Array<{ questionId: string; biasType: string; before: string; after: string; rationale: string }>) => void;
    clearPreviousVersion: (artifactType: string) => void;

    // Persistence
    initializeFromFigma: (state: PersistedState) => void;
    saveToFigma: () => void;

    // Canvas
    insertToCanvas: (objectId: string) => void;
    insertAllToCanvas: () => void;

    // Project Management
    resetProject: () => void;
    loadDemoProject: () => void;
}

const initialContext: ResearchContext = {
    sources: [],
    normalizedSummary: '',
    lastUpdated: Date.now(),
};

const initialUI: UIState = {
    currentStep: 0,
    isLoading: false,
    loadingMessage: '',
    error: null,
    settingsOpen: false,
    fileType: 'figma',
};

export const useStore = create<StoreState>((set, get) => ({
    // Initial State
    ui: initialUI,
    context: initialContext,
    canvasSelection: { nodes: [], extractedText: '', hasImages: false },
    researchObjects: [],
    transcripts: [],
    uploadedResponses: [],
    stepContexts: {},
    biasCheckResults: {},
    previousVersions: {},
    settings: null,

    // UI Actions
    setCurrentStep: (step) =>
        set((state) => ({
            ui: { ...state.ui, currentStep: step },
        })),

    setLoading: (loading, message = '') =>
        set((state) => ({
            ui: { ...state.ui, isLoading: loading, loadingMessage: message },
        })),

    setError: (error) =>
        set((state) => ({
            ui: { ...state.ui, error },
        })),

    setSettingsOpen: (open) =>
        set((state) => ({
            ui: { ...state.ui, settingsOpen: open },
        })),

    setFileType: (type) =>
        set((state) => ({
            ui: { ...state.ui, fileType: type },
        })),

    // Context Actions
    setCanvasSelection: (selection) => set({ canvasSelection: selection }),

    addContextSource: (source) =>
        set((state) => ({
            context: {
                ...state.context,
                sources: [
                    ...state.context.sources,
                    { ...source, id: uuidv4() },
                ],
                lastUpdated: Date.now(),
            },
        })),

    removeContextSource: (id) =>
        set((state) => ({
            context: {
                ...state.context,
                sources: state.context.sources.filter((s) => s.id !== id),
                lastUpdated: Date.now(),
            },
        })),

    updateNormalizedSummary: (summary) =>
        set((state) => ({
            context: {
                ...state.context,
                normalizedSummary: summary,
                lastUpdated: Date.now(),
            },
        })),

    // Research Object Actions
    addResearchObject: (type, content, confidence, suggestions) => {
        const newObject: ResearchObject = {
            id: uuidv4(),
            type,
            content,
            confidence,
            improvementSuggestions: suggestions,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        set((state) => ({
            researchObjects: [
                ...state.researchObjects.filter((o) => o.type !== type),
                newObject,
            ],
        }));

        // Auto-save after adding
        setTimeout(() => get().saveToFigma(), 100);

        return newObject;
    },

    updateResearchObject: (id, updates) =>
        set((state) => ({
            researchObjects: state.researchObjects.map((o) =>
                o.id === id ? { ...o, ...updates, updatedAt: Date.now() } : o
            ),
        })),

    getResearchObject: (type) => {
        return get().researchObjects.find((o) => o.type === type);
    },

    // Transcript Actions
    addTranscripts: (newTranscripts) => {
        const currentCount = get().transcripts.length;
        const remaining = 25 - currentCount;
        const toAdd = newTranscripts.slice(0, remaining);

        set((state) => ({
            transcripts: [
                ...state.transcripts,
                ...toAdd.map((t) => ({ ...t, id: uuidv4() })),
            ],
        }));
    },

    removeTranscript: (id) =>
        set((state) => ({
            transcripts: state.transcripts.filter((t) => t.id !== id),
        })),

    // Uploaded Response Actions
    addUploadedResponse: (response) =>
        set((state) => {
            // Avoid duplicates
            if (state.uploadedResponses.some(r => r.participantId === response.participantId)) {
                console.warn('Duplicate participant:', response.participantId);
                return state;
            }
            console.log('Store: Added response, total count:', state.uploadedResponses.length + 1);
            return {
                uploadedResponses: [...state.uploadedResponses, response],
            };
        }),

    clearUploadedResponses: () => set({ uploadedResponses: [] }),

    // Settings Actions
    setSettings: (settings) => {
        set({ settings });
        postMessage({ type: 'SAVE_SETTINGS', payload: settings });
    },

    // Step Context Actions
    setStepContext: (stepKey, value) =>
        set((state) => ({
            stepContexts: { ...state.stepContexts, [stepKey]: value },
        })),
    getStepContext: (stepKey) => get().stepContexts[stepKey] || '',

    // Bias Check Actions
    setBiasCheckResult: (artifactType, result) =>
        set((state) => ({
            biasCheckResults: { ...state.biasCheckResults, [artifactType]: result },
        })),
    clearBiasCheckResult: (artifactType) =>
        set((state) => {
            const { [artifactType]: _, ...rest } = state.biasCheckResults;
            return { biasCheckResults: rest };
        }),
    setPreviousVersion: (artifactType, content, diffs) =>
        set((state) => ({
            previousVersions: { ...state.previousVersions, [artifactType]: { content, diffs } },
        })),
    clearPreviousVersion: (artifactType) =>
        set((state) => {
            const { [artifactType]: _, ...rest } = state.previousVersions;
            return { previousVersions: rest };
        }),

    // Persistence
    initializeFromFigma: (state) => {
        set({
            context: state.context,
            researchObjects: state.researchObjects,
            transcripts: state.transcripts,
            ui: {
                ...get().ui,
                currentStep: state.currentStep,
            },
        });
    },

    saveToFigma: () => {
        const state = get();
        const persistedState: PersistedState = {
            version: 1,
            context: state.context,
            researchObjects: state.researchObjects,
            currentStep: state.ui.currentStep,
            transcripts: state.transcripts,
            lastSaved: Date.now(),
        };
        postMessage({ type: 'SAVE_STATE', payload: persistedState });
    },

    // Canvas
    insertToCanvas: (objectId) => {
        const object = get().researchObjects.find((o) => o.id === objectId);
        if (object) {
            postMessage({ type: 'INSERT_RESEARCH_OBJECT', payload: object });
        }
    },

    insertAllToCanvas: () => {
        const objects = get().researchObjects;
        // Insert each object with a small delay to avoid overwhelming Figma
        objects.forEach((object, index) => {
            setTimeout(() => {
                postMessage({ type: 'INSERT_RESEARCH_OBJECT', payload: object });
            }, index * 300); // 300ms delay between each insertion
        });
    },

    // Project Management
    resetProject: () => {
        // Clear state in Figma storage
        postMessage({ type: 'CLEAR_STATE' });

        // Reset local state
        set({
            context: initialContext,
            canvasSelection: { nodes: [], extractedText: '', hasImages: false },
            researchObjects: [],
            transcripts: [],
            ui: {
                ...get().ui,
                currentStep: 0,
                error: null,
            },
        });
    },

    loadDemoProject: () => {
        set({
            context: MOCK_PROJECT.context,
            researchObjects: MOCK_PROJECT.researchObjects,
            transcripts: MOCK_PROJECT.transcripts,
            stepContexts: {},
            biasCheckResults: {},
            previousVersions: {},
            ui: {
                ...get().ui,
                currentStep: 6, // Jump to Synthesis
                error: null,
            },
        });
    },
}));
