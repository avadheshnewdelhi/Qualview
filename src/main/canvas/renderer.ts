/// <reference types="@figma/plugin-typings" />

import { getLayoutConfig, getNextPosition, findQualviewNodes } from './layout';

interface ResearchObject {
    id: string;
    type: string;
    content: Record<string, unknown>;
    confidence: string;
    improvementSuggestions: string[];
}

interface InsertResult {
    objectId: string;
    nodeId: string;
}

// Colors for different confidence levels
const CONFIDENCE_COLORS = {
    low: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
    medium: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
    high: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
};

// Colors for different research object types
const TYPE_COLORS: Record<string, string> = {
    framing: '#8B5CF6',
    plan: '#3B82F6',
    screener: '#10B981',
    participants: '#F59E0B',
    'interview-guide': '#EC4899',
    insights: '#6366F1',
};

// Default frame width
const FRAME_WIDTH = 400;

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex: string): RGB {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 0, g: 0, b: 0 };
    return {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
    };
}

/**
 * Create a styled text node that fills parent width (responsive)
 */
function createText(
    text: string,
    options: {
        fontSize?: number;
        fontWeight?: 'normal' | 'bold';
        color?: RGB;
        fillWidth?: boolean; // If true, text will stretch to fill parent
    } = {}
): TextNode {
    const textNode = figma.createText();
    textNode.characters = text || '';

    const fontName = options.fontWeight === 'bold'
        ? { family: 'Inter', style: 'Bold' }
        : { family: 'Inter', style: 'Regular' };

    textNode.fontName = fontName;
    textNode.fontSize = options.fontSize || 14;

    if (options.color) {
        textNode.fills = [{ type: 'SOLID', color: options.color }];
    }

    // Make text responsive - fill parent width, auto height
    if (options.fillWidth !== false) {
        textNode.layoutAlign = 'STRETCH';
        textNode.textAutoResize = 'HEIGHT';
    }

    return textNode;
}

/**
 * Create a section header (non-stretching label)
 */
function createSectionHeader(title: string, color?: RGB): TextNode {
    const text = createText(title, {
        fontSize: 12,
        fontWeight: 'bold',
        color: color || { r: 0.4, g: 0.4, b: 0.4 },
        fillWidth: false, // Headers don't need to stretch
    });
    return text;
}

/**
 * Create a bullet list from an array of strings (responsive)
 */
function createBulletList(items: string[], options: { color?: RGB } = {}): TextNode {
    const bulletText = items.map(item => `• ${item}`).join('\n');
    return createText(bulletText, {
        fontSize: 14,
        color: options.color || { r: 0.1, g: 0.1, b: 0.1 },
        fillWidth: true,
    });
}

/**
 * Create the main container frame with proper auto-layout
 */
function createMainFrame(name: string, typeColor: string): FrameNode {
    const frame = figma.createFrame();
    frame.name = name;
    frame.layoutMode = 'VERTICAL';
    frame.primaryAxisSizingMode = 'AUTO'; // Hug content vertically
    frame.counterAxisSizingMode = 'FIXED'; // Fixed width initially
    frame.resize(FRAME_WIDTH, 100);
    frame.paddingTop = 20;
    frame.paddingBottom = 20;
    frame.paddingLeft = 20;
    frame.paddingRight = 20;
    frame.itemSpacing = 16;
    frame.cornerRadius = 8;
    frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    frame.strokes = [{ type: 'SOLID', color: hexToRgb(typeColor) }];
    frame.strokeWeight = 2;
    return frame;
}

/**
 * Create header with type label and confidence badge
 */
function createHeader(typeName: string, typeColor: string, confidence: string): FrameNode {
    const confidenceColors = CONFIDENCE_COLORS[confidence as keyof typeof CONFIDENCE_COLORS] || CONFIDENCE_COLORS.medium;

    const header = figma.createFrame();
    header.name = 'Header';
    header.layoutMode = 'HORIZONTAL';
    header.primaryAxisSizingMode = 'AUTO';
    header.counterAxisSizingMode = 'AUTO';
    header.itemSpacing = 12;
    header.fills = [];
    header.layoutAlign = 'STRETCH'; // Fill parent width

    // Type label
    const typeLabel = createText(typeName.toUpperCase().replace('-', ' '), {
        fontSize: 12,
        fontWeight: 'bold',
        color: hexToRgb(typeColor),
        fillWidth: false,
    });
    header.appendChild(typeLabel);

    // Confidence badge
    const badge = figma.createFrame();
    badge.name = 'Confidence Badge';
    badge.layoutMode = 'HORIZONTAL';
    badge.primaryAxisSizingMode = 'AUTO';
    badge.counterAxisSizingMode = 'AUTO';
    badge.paddingTop = 4;
    badge.paddingBottom = 4;
    badge.paddingLeft = 8;
    badge.paddingRight = 8;
    badge.cornerRadius = 4;
    badge.fills = [{ type: 'SOLID', color: hexToRgb(confidenceColors.bg) }];

    const badgeText = createText(`${confidence.toUpperCase()} CONFIDENCE`, {
        fontSize: 10,
        fontWeight: 'bold',
        color: hexToRgb(confidenceColors.text),
        fillWidth: false,
    });
    badge.appendChild(badgeText);
    header.appendChild(badge);

    return header;
}

/**
 * Create suggestions box - FULLY RESPONSIVE (fill width, hug height)
 */
function createSuggestionsBox(suggestions: string[]): FrameNode {
    const box = figma.createFrame();
    box.name = 'Suggestions';
    box.layoutMode = 'VERTICAL';
    box.primaryAxisSizingMode = 'AUTO'; // Hug height
    box.counterAxisSizingMode = 'AUTO'; // Will stretch via layoutAlign
    box.layoutAlign = 'STRETCH'; // Fill parent width
    box.paddingTop = 12;
    box.paddingBottom = 12;
    box.paddingLeft = 12;
    box.paddingRight = 12;
    box.itemSpacing = 6;
    box.cornerRadius = 6;
    box.fills = [{ type: 'SOLID', color: hexToRgb('#FEF3C7') }];

    const label = createText('💡 To improve confidence:', {
        fontSize: 12,
        fontWeight: 'bold',
        color: hexToRgb('#92400E'),
        fillWidth: false,
    });
    box.appendChild(label);

    for (const suggestion of suggestions.slice(0, 3)) {
        const text = createText(`• ${suggestion}`, {
            fontSize: 12,
            color: hexToRgb('#92400E'),
            fillWidth: true, // Stretch to fill
        });
        box.appendChild(text);
    }

    return box;
}

/**
 * Create content section - FULLY RESPONSIVE
 */
function createContentSection(): FrameNode {
    const section = figma.createFrame();
    section.name = 'Content';
    section.layoutMode = 'VERTICAL';
    section.primaryAxisSizingMode = 'AUTO'; // Hug height
    section.counterAxisSizingMode = 'AUTO'; // Will stretch
    section.layoutAlign = 'STRETCH'; // Fill parent width
    section.itemSpacing = 12;
    section.fills = [];
    return section;
}

/**
 * Create a responsive card frame (for questions, themes, participants, etc.)
 */
function createCard(name: string, bgColor?: string): FrameNode {
    const card = figma.createFrame();
    card.name = name;
    card.layoutMode = 'VERTICAL';
    card.primaryAxisSizingMode = 'AUTO'; // Hug height
    card.counterAxisSizingMode = 'AUTO'; // Will stretch
    card.layoutAlign = 'STRETCH'; // Fill parent width
    card.paddingTop = 8;
    card.paddingBottom = 8;
    card.paddingLeft = 12;
    card.paddingRight = 12;
    card.itemSpacing = 4;
    card.cornerRadius = 4;
    card.fills = [{ type: 'SOLID', color: bgColor ? hexToRgb(bgColor) : { r: 0.97, g: 0.97, b: 0.97 } }];
    return card;
}

// ==================== TYPE-SPECIFIC RENDERERS ====================

/**
 * Render Framing content
 */
function renderFramingContent(content: Record<string, unknown>, section: FrameNode): void {
    const { researchType, rationale, willAnswer, willNotAnswer, assumptions } = content as {
        researchType?: string;
        rationale?: string;
        willAnswer?: string[];
        willNotAnswer?: string[];
        assumptions?: string[];
    };

    if (researchType) {
        section.appendChild(createSectionHeader('Research Type'));
        section.appendChild(createText(researchType, { fontSize: 16, fontWeight: 'bold', fillWidth: true }));
    }

    if (rationale) {
        section.appendChild(createSectionHeader('Rationale'));
        section.appendChild(createText(rationale, { fontSize: 14, fillWidth: true }));
    }

    if (willAnswer && willAnswer.length > 0) {
        section.appendChild(createSectionHeader('This research will answer', hexToRgb('#059669')));
        section.appendChild(createBulletList(willAnswer));
    }

    if (willNotAnswer && willNotAnswer.length > 0) {
        section.appendChild(createSectionHeader('This research will NOT answer', hexToRgb('#DC2626')));
        section.appendChild(createBulletList(willNotAnswer));
    }

    if (assumptions && assumptions.length > 0) {
        section.appendChild(createSectionHeader('Key Assumptions'));
        section.appendChild(createBulletList(assumptions));
    }
}

/**
 * Render Plan content
 */
function renderPlanContent(content: Record<string, unknown>, section: FrameNode): void {
    const { goal, approach, focusAreas, risksAndLimitations } = content as {
        goal?: string;
        approach?: string;
        focusAreas?: string[];
        risksAndLimitations?: string[];
    };

    if (goal) {
        section.appendChild(createSectionHeader('Goal'));
        section.appendChild(createText(goal, { fontSize: 14, fontWeight: 'bold', fillWidth: true }));
    }

    if (approach) {
        section.appendChild(createSectionHeader('Approach'));
        section.appendChild(createText(approach, { fontSize: 14, fillWidth: true }));
    }

    if (focusAreas && focusAreas.length > 0) {
        section.appendChild(createSectionHeader('Focus Areas'));
        section.appendChild(createBulletList(focusAreas));
    }

    if (risksAndLimitations && risksAndLimitations.length > 0) {
        section.appendChild(createSectionHeader('Risks & Limitations', hexToRgb('#DC2626')));
        section.appendChild(createBulletList(risksAndLimitations));
    }
}

/**
 * Render Screener content
 */
function renderScreenerContent(content: Record<string, unknown>, section: FrameNode): void {
    const { questions } = content as {
        questions?: Array<{
            id?: string;
            question?: string;
            questionType?: string;
            options?: string[];
            knockoutLogic?: string;
        }>;
    };

    if (!questions || questions.length === 0) {
        section.appendChild(createText('No questions generated', { fontSize: 14 }));
        return;
    }

    section.appendChild(createSectionHeader('Questions'));

    const typeColors: Record<string, string> = {
        scenario: '#3B82F6',
        indirect: '#8B5CF6',
        validation: '#10B981',
        knockout: '#EF4444',
    };

    for (const q of questions) {
        const card = createCard(`Question ${q.id || ''}`);
        const typeColor = typeColors[q.questionType || ''] || '#6B7280';

        card.appendChild(createText(`[${(q.questionType || 'question').toUpperCase()}]`, {
            fontSize: 10,
            fontWeight: 'bold',
            color: hexToRgb(typeColor),
            fillWidth: false,
        }));

        card.appendChild(createText(q.question || '', { fontSize: 13, fillWidth: true }));

        if (q.options && q.options.length > 0) {
            card.appendChild(createText(`Options: ${q.options.join(' | ')}`, {
                fontSize: 11,
                color: { r: 0.5, g: 0.5, b: 0.5 },
                fillWidth: true,
            }));
        }

        if (q.knockoutLogic) {
            card.appendChild(createText(`⚠️ Knockout: ${q.knockoutLogic}`, {
                fontSize: 11,
                color: hexToRgb('#DC2626'),
                fillWidth: true,
            }));
        }

        section.appendChild(card);
    }
}

/**
 * Render Participants content
 */
function renderParticipantsContent(content: Record<string, unknown>, section: FrameNode): void {
    const { qualified, disqualified } = content as {
        qualified?: Array<{ id?: string; score?: number; reasoning?: string; flags?: string[] }>;
        disqualified?: Array<{ id?: string; score?: number; reasoning?: string; flags?: string[] }>;
    };

    const renderParticipant = (p: { id?: string; score?: number; reasoning?: string; flags?: string[] }, isQualified: boolean) => {
        const card = createCard(`Participant ${p.id || ''}`, isQualified ? '#D1FAE5' : '#FEE2E2');

        card.appendChild(createText(`${isQualified ? '✓' : '✗'} ${p.id || 'Unknown'} — Score: ${p.score || 0}`, {
            fontSize: 13,
            fontWeight: 'bold',
            color: hexToRgb(isQualified ? '#065F46' : '#991B1B'),
            fillWidth: false,
        }));

        if (p.reasoning) {
            card.appendChild(createText(p.reasoning, {
                fontSize: 12,
                color: { r: 0.3, g: 0.3, b: 0.3 },
                fillWidth: true,
            }));
        }

        if (p.flags && p.flags.length > 0) {
            card.appendChild(createText(`Flags: ${p.flags.join(', ')}`, {
                fontSize: 11,
                color: hexToRgb('#92400E'),
                fillWidth: false,
            }));
        }

        section.appendChild(card);
    };

    if (qualified && qualified.length > 0) {
        section.appendChild(createSectionHeader('Qualified', hexToRgb('#059669')));
        for (const p of qualified) renderParticipant(p, true);
    }

    if (disqualified && disqualified.length > 0) {
        section.appendChild(createSectionHeader('Disqualified', hexToRgb('#DC2626')));
        for (const p of disqualified) renderParticipant(p, false);
    }
}

/**
 * Render Interview Guide content
 */
function renderInterviewGuideContent(content: Record<string, unknown>, section: FrameNode): void {
    const { sections } = content as {
        sections?: Array<{
            type?: string;
            questions?: Array<{
                id?: string;
                question?: string;
                probes?: string[];
                notes?: string;
            }>;
        }>;
    };

    if (!sections || sections.length === 0) {
        section.appendChild(createText('No interview guide generated', { fontSize: 14 }));
        return;
    }

    const sectionColors: Record<string, string> = {
        warmup: '#10B981',
        core: '#3B82F6',
        wrapup: '#8B5CF6',
    };

    for (const s of sections) {
        const sColor = sectionColors[s.type || ''] || '#6B7280';
        section.appendChild(createSectionHeader((s.type || 'Section').toUpperCase(), hexToRgb(sColor)));

        if (s.questions) {
            for (const q of s.questions) {
                const card = createCard(`Question ${q.id || ''}`);

                card.appendChild(createText(q.question || '', {
                    fontSize: 13,
                    fontWeight: 'bold',
                    fillWidth: true,
                }));

                if (q.probes && q.probes.length > 0) {
                    card.appendChild(createText('Probes:', {
                        fontSize: 11,
                        fontWeight: 'bold',
                        color: { r: 0.5, g: 0.5, b: 0.5 },
                        fillWidth: false,
                    }));

                    for (const probe of q.probes) {
                        card.appendChild(createText(`→ ${probe}`, {
                            fontSize: 11,
                            color: { r: 0.4, g: 0.4, b: 0.4 },
                            fillWidth: true,
                        }));
                    }
                }

                if (q.notes) {
                    card.appendChild(createText(`📝 ${q.notes}`, {
                        fontSize: 11,
                        color: { r: 0.5, g: 0.5, b: 0.5 },
                        fillWidth: true,
                    }));
                }

                section.appendChild(card);
            }
        }
    }
}

/**
 * Render Insights content
 */
function renderInsightsContent(content: Record<string, unknown>, section: FrameNode): void {
    const { themes, insights, opportunities, hmwPrompts } = content as {
        themes?: Array<{ id?: string; name?: string; description?: string }>;
        insights?: Array<{ id?: string; statement?: string; evidence?: string[]; strength?: string }>;
        opportunities?: string[];
        hmwPrompts?: string[];
    };

    // Themes
    if (themes && themes.length > 0) {
        section.appendChild(createSectionHeader('Themes', hexToRgb('#6366F1')));
        for (const theme of themes) {
            const card = createCard(`Theme ${theme.id || ''}`, '#EEF2FF');

            card.appendChild(createText(theme.name || 'Untitled Theme', {
                fontSize: 13,
                fontWeight: 'bold',
                color: hexToRgb('#4338CA'),
                fillWidth: false,
            }));

            if (theme.description) {
                card.appendChild(createText(theme.description, { fontSize: 12, fillWidth: true }));
            }

            section.appendChild(card);
        }
    }

    // Insights
    if (insights && insights.length > 0) {
        section.appendChild(createSectionHeader('Key Insights', hexToRgb('#F59E0B')));

        const strengthColors: Record<string, string> = {
            weak: '#F59E0B',
            moderate: '#3B82F6',
            strong: '#10B981',
        };

        for (const insight of insights) {
            const card = createCard(`Insight ${insight.id || ''}`);
            const strengthColor = strengthColors[insight.strength || 'moderate'] || '#6B7280';

            card.appendChild(createText(`[${(insight.strength || 'moderate').toUpperCase()}]`, {
                fontSize: 10,
                fontWeight: 'bold',
                color: hexToRgb(strengthColor),
                fillWidth: false,
            }));

            card.appendChild(createText(insight.statement || '', { fontSize: 13, fillWidth: true }));

            if (insight.evidence && insight.evidence.length > 0) {
                for (const ev of insight.evidence.slice(0, 2)) {
                    card.appendChild(createText(`"${ev}"`, {
                        fontSize: 11,
                        color: { r: 0.5, g: 0.5, b: 0.5 },
                        fillWidth: true,
                    }));
                }
            }

            section.appendChild(card);
        }
    }

    // Opportunities
    if (opportunities && opportunities.length > 0) {
        section.appendChild(createSectionHeader('Opportunities', hexToRgb('#10B981')));
        section.appendChild(createBulletList(opportunities));
    }

    // HMW Prompts
    if (hmwPrompts && hmwPrompts.length > 0) {
        section.appendChild(createSectionHeader('How Might We...', hexToRgb('#8B5CF6')));
        section.appendChild(createBulletList(hmwPrompts));
    }
}

/**
 * Route to type-specific renderer
 */
function renderContent(obj: ResearchObject, section: FrameNode): void {
    switch (obj.type) {
        case 'framing':
            renderFramingContent(obj.content, section);
            break;
        case 'plan':
            renderPlanContent(obj.content, section);
            break;
        case 'screener':
            renderScreenerContent(obj.content, section);
            break;
        case 'participants':
            renderParticipantsContent(obj.content, section);
            break;
        case 'interview-guide':
            renderInterviewGuideContent(obj.content, section);
            break;
        case 'insights':
            renderInsightsContent(obj.content, section);
            break;
        default:
            // Fallback: render as key-value pairs
            for (const [key, value] of Object.entries(obj.content)) {
                section.appendChild(createSectionHeader(
                    key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
                ));
                if (Array.isArray(value)) {
                    section.appendChild(createBulletList(value.map(v =>
                        typeof v === 'object' ? JSON.stringify(v) : String(v)
                    )));
                } else if (typeof value === 'object' && value !== null) {
                    section.appendChild(createText(JSON.stringify(value, null, 2), { fontSize: 12, fillWidth: true }));
                } else {
                    section.appendChild(createText(String(value), { fontSize: 14, fillWidth: true }));
                }
            }
    }
}

/**
 * Create a research object frame
 */
async function createResearchObjectFrame(obj: ResearchObject): Promise<FrameNode> {
    // Load required fonts
    await Promise.all([
        figma.loadFontAsync({ family: 'Inter', style: 'Bold' }),
        figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
    ]);

    const typeColor = TYPE_COLORS[obj.type] || '#6B7280';
    const typeName = obj.type.charAt(0).toUpperCase() + obj.type.slice(1);

    // Create main frame
    const frame = createMainFrame(typeName, typeColor);

    // Add header
    frame.appendChild(createHeader(obj.type, typeColor, obj.confidence));

    // Add content section
    const contentSection = createContentSection();
    renderContent(obj, contentSection);
    frame.appendChild(contentSection);

    // Add suggestions if any
    if (obj.improvementSuggestions && obj.improvementSuggestions.length > 0) {
        frame.appendChild(createSuggestionsBox(obj.improvementSuggestions));
    }

    return frame;
}

/**
 * Insert a research object onto the canvas with intelligent positioning
 */
export async function insertResearchObject(obj: ResearchObject): Promise<InsertResult> {
    const frame = await createResearchObjectFrame(obj);

    // Find existing Qualview nodes for intelligent positioning
    const existingNodes = findQualviewNodes();

    // Get next position based on existing nodes
    const position = getNextPosition(existingNodes, frame.width, frame.height);
    frame.x = position.x;
    frame.y = position.y;

    // Add to page
    figma.currentPage.appendChild(frame);

    // Select and zoom to the new frame
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    return {
        objectId: obj.id,
        nodeId: frame.id,
    };
}
