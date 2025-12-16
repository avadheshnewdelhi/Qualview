// Research Object Types
export type ResearchObjectType =
    | 'framing'
    | 'plan'
    | 'screener'
    | 'participants'
    | 'interview-guide'
    | 'insights';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

// Context Types
export interface ContextSource {
    id: string;
    type: 'canvas' | 'manual' | 'file';
    content: string;
    metadata: {
        fileName?: string;
        fileType?: string;
        nodeIds?: string[];
        timestamp: number;
    };
}

export interface ResearchContext {
    sources: ContextSource[];
    normalizedSummary: string;
    lastUpdated: number;
}

// Research Object Content Types
export interface FramingContent {
    researchType: string;
    rationale: string;
    willAnswer: string[];
    willNotAnswer: string[];
    assumptions: string[];
}

export interface PlanContent {
    goal: string;
    approach: string;
    focusAreas: string[];
    risksAndLimitations: string[];
}

export interface ScreenerQuestion {
    id: string;
    question: string;
    questionType: 'scenario' | 'indirect' | 'validation' | 'knockout';
    options?: string[];
    knockoutLogic?: string;
}

export interface ScreenerContent {
    questions: ScreenerQuestion[];
}

export interface Participant {
    id: string;
    responses: Record<string, string>;
    score: number;
    flags: string[];
    reasoning: string;
}

export interface ParticipantsContent {
    qualified: Participant[];
    disqualified: Participant[];
}

export interface InterviewQuestion {
    id: string;
    question: string;
    probes: string[];
    notes?: string;
}

export interface InterviewSection {
    type: 'warmup' | 'core' | 'wrapup';
    questions: InterviewQuestion[];
}

export interface InterviewGuideContent {
    sections: InterviewSection[];
}

export interface Theme {
    id: string;
    name: string;
    description: string;
    insightIds: string[];
}

export interface Insight {
    id: string;
    statement: string;
    evidence: string[];
    strength: 'weak' | 'moderate' | 'strong';
}

export interface InsightsContent {
    themes: Theme[];
    insights: Insight[];
    opportunities: string[];
    hmwPrompts: string[];
}

export type ResearchObjectContent =
    | FramingContent
    | PlanContent
    | ScreenerContent
    | ParticipantsContent
    | InterviewGuideContent
    | InsightsContent;

// Research Object
export interface ResearchObject<T extends ResearchObjectContent = ResearchObjectContent> {
    id: string;
    type: ResearchObjectType;
    content: T;
    confidence: ConfidenceLevel;
    improvementSuggestions: string[];
    canvasMetadata?: {
        nodeId?: string;
        position?: { x: number; y: number };
    };
    createdAt: number;
    updatedAt: number;
}

// Transcript
export interface Transcript {
    id: string;
    name: string;
    content: string;
    participantId?: string;
}

// Persisted State
export interface PersistedState {
    version: 1;
    context: ResearchContext;
    researchObjects: ResearchObject[];
    currentStep: number;
    transcripts: Transcript[];
    lastSaved: number;
}

// Settings
export interface Settings {
    apiKey: string;
    model: 'gpt-4o' | 'gpt-4-turbo';
}
