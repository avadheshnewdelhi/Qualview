/// <reference types="@figma/plugin-typings" />

import { getLayoutConfig } from './layout';

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
const TYPE_COLORS = {
    framing: '#8B5CF6',
    plan: '#3B82F6',
    screener: '#10B981',
    participants: '#F59E0B',
    'interview-guide': '#EC4899',
    insights: '#6366F1',
};

/**
 * Create a styled text node
 */
function createStyledText(
    text: string,
    options: {
        fontSize?: number;
        fontWeight?: 'normal' | 'bold';
        color?: RGB;
        width?: number;
    } = {}
): TextNode {
    const textNode = figma.createText();
    textNode.characters = text;

    // Load and apply font
    const fontName = options.fontWeight === 'bold'
        ? { family: 'Inter', style: 'Bold' }
        : { family: 'Inter', style: 'Regular' };

    textNode.fontName = fontName;
    textNode.fontSize = options.fontSize || 14;

    if (options.color) {
        textNode.fills = [{ type: 'SOLID', color: options.color }];
    }

    if (options.width) {
        textNode.resize(options.width, textNode.height);
        textNode.textAutoResize = 'HEIGHT';
    }

    return textNode;
}

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
 * Create a research object frame
 */
async function createResearchObjectFrame(
    obj: ResearchObject
): Promise<FrameNode> {
    // Load required fonts
    await Promise.all([
        figma.loadFontAsync({ family: 'Inter', style: 'Bold' }),
        figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
    ]);

    const frame = figma.createFrame();
    frame.name = `Qualview: ${obj.type.charAt(0).toUpperCase() + obj.type.slice(1)}`;
    frame.layoutMode = 'VERTICAL';
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'FIXED';
    frame.resize(400, 100);
    frame.paddingTop = 20;
    frame.paddingBottom = 20;
    frame.paddingLeft = 20;
    frame.paddingRight = 20;
    frame.itemSpacing = 12;
    frame.cornerRadius = 8;

    const typeColor = TYPE_COLORS[obj.type as keyof typeof TYPE_COLORS] || '#6B7280';
    const confidenceColors = CONFIDENCE_COLORS[obj.confidence as keyof typeof CONFIDENCE_COLORS] || CONFIDENCE_COLORS.medium;

    // Background
    frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    frame.strokes = [{ type: 'SOLID', color: hexToRgb(typeColor) }];
    frame.strokeWeight = 2;

    // Header
    const header = figma.createFrame();
    header.name = 'Header';
    header.layoutMode = 'HORIZONTAL';
    header.primaryAxisSizingMode = 'FIXED';
    header.counterAxisSizingMode = 'AUTO';
    header.resize(360, 24);
    header.itemSpacing = 8;
    header.fills = [];

    const typeLabel = createStyledText(
        obj.type.toUpperCase().replace('-', ' '),
        { fontSize: 12, fontWeight: 'bold', color: hexToRgb(typeColor) }
    );
    header.appendChild(typeLabel);

    // Confidence badge
    const confidenceBadge = figma.createFrame();
    confidenceBadge.name = 'Confidence';
    confidenceBadge.layoutMode = 'HORIZONTAL';
    confidenceBadge.primaryAxisSizingMode = 'AUTO';
    confidenceBadge.counterAxisSizingMode = 'AUTO';
    confidenceBadge.paddingTop = 4;
    confidenceBadge.paddingBottom = 4;
    confidenceBadge.paddingLeft = 8;
    confidenceBadge.paddingRight = 8;
    confidenceBadge.cornerRadius = 4;
    confidenceBadge.fills = [{ type: 'SOLID', color: hexToRgb(confidenceColors.bg) }];

    const confidenceText = createStyledText(
        `${obj.confidence.toUpperCase()} CONFIDENCE`,
        { fontSize: 10, fontWeight: 'bold', color: hexToRgb(confidenceColors.text) }
    );
    confidenceBadge.appendChild(confidenceText);
    header.appendChild(confidenceBadge);

    frame.appendChild(header);

    // Content based on type
    const contentFrame = figma.createFrame();
    contentFrame.name = 'Content';
    contentFrame.layoutMode = 'VERTICAL';
    contentFrame.primaryAxisSizingMode = 'AUTO';
    contentFrame.counterAxisSizingMode = 'FIXED';
    contentFrame.resize(360, 100);
    contentFrame.itemSpacing = 8;
    contentFrame.fills = [];

    // Render content based on type
    const content = obj.content;
    const entries = Object.entries(content).slice(0, 5); // Limit to 5 fields

    for (const [key, value] of entries) {
        const label = createStyledText(
            key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
            { fontSize: 12, fontWeight: 'bold', color: { r: 0.4, g: 0.4, b: 0.4 } }
        );
        contentFrame.appendChild(label);

        let valueText: string;
        if (Array.isArray(value)) {
            valueText = value.map((v) => `• ${v}`).join('\n');
        } else if (typeof value === 'object' && value !== null) {
            valueText = JSON.stringify(value, null, 2);
        } else {
            valueText = String(value);
        }

        const valueNode = createStyledText(valueText, {
            fontSize: 14,
            color: { r: 0.1, g: 0.1, b: 0.1 },
            width: 360,
        });
        contentFrame.appendChild(valueNode);
    }

    frame.appendChild(contentFrame);

    // Improvement suggestions if any
    if (obj.improvementSuggestions.length > 0) {
        const suggestionsFrame = figma.createFrame();
        suggestionsFrame.name = 'Suggestions';
        suggestionsFrame.layoutMode = 'VERTICAL';
        suggestionsFrame.primaryAxisSizingMode = 'AUTO';
        suggestionsFrame.counterAxisSizingMode = 'FIXED';
        suggestionsFrame.resize(360, 50);
        suggestionsFrame.paddingTop = 12;
        suggestionsFrame.paddingBottom = 12;
        suggestionsFrame.paddingLeft = 12;
        suggestionsFrame.paddingRight = 12;
        suggestionsFrame.itemSpacing = 4;
        suggestionsFrame.cornerRadius = 6;
        suggestionsFrame.fills = [{ type: 'SOLID', color: hexToRgb('#FEF3C7') }];

        const suggestionLabel = createStyledText('💡 To improve confidence:', {
            fontSize: 12,
            fontWeight: 'bold',
            color: hexToRgb('#92400E'),
        });
        suggestionsFrame.appendChild(suggestionLabel);

        for (const suggestion of obj.improvementSuggestions.slice(0, 3)) {
            const suggestionText = createStyledText(`• ${suggestion}`, {
                fontSize: 12,
                color: hexToRgb('#92400E'),
                width: 336,
            });
            suggestionsFrame.appendChild(suggestionText);
        }

        frame.appendChild(suggestionsFrame);
    }

    return frame;
}

/**
 * Insert a research object onto the canvas
 */
export async function insertResearchObject(
    obj: ResearchObject
): Promise<InsertResult> {
    const frame = await createResearchObjectFrame(obj);
    const layout = getLayoutConfig();

    // Position the frame
    const viewport = figma.viewport.center;
    frame.x = viewport.x + layout.offsetX;
    frame.y = viewport.y + layout.offsetY;

    // Add to page
    figma.currentPage.appendChild(frame);

    // Select the new frame
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    return {
        objectId: obj.id,
        nodeId: frame.id,
    };
}
