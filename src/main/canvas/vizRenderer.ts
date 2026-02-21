/// <reference types="@figma/plugin-typings" />

import { getNextPosition, findQualviewNodes, registerInsertedNode } from './layout';

/**
 * Visualization Canvas Renderer
 *
 * Creates native, editable Figma frames for each dashboard visualization.
 * Uses Figma auto-layout so all frames are resizable.
 */

const VIZ_WIDTH = 480;

// ─── Utilities ─────────────────────────────────────────────────────────────

function hexToRgb(hex: string): RGB {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 0, g: 0, b: 0 };
    return {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
    };
}

function text(
    str: string,
    opts: { size?: number; bold?: boolean; color?: RGB; fill?: boolean; italic?: boolean } = {}
): TextNode {
    const t = figma.createText();
    t.characters = str || '';
    t.fontName = opts.bold
        ? { family: 'Inter', style: 'Bold' }
        : opts.italic
            ? { family: 'Inter', style: 'Italic' }
            : { family: 'Inter', style: 'Regular' };
    t.fontSize = opts.size || 14;
    if (opts.color) t.fills = [{ type: 'SOLID', color: opts.color }];
    if (opts.fill !== false) {
        t.layoutAlign = 'STRETCH';
        t.textAutoResize = 'HEIGHT';
    } else {
        t.textAutoResize = 'WIDTH_AND_HEIGHT';
    }
    return t;
}

function card(name: string, bg?: string): FrameNode {
    const f = figma.createFrame();
    f.name = name;
    f.layoutMode = 'VERTICAL';
    f.primaryAxisSizingMode = 'AUTO';
    f.counterAxisSizingMode = 'FIXED';
    f.layoutAlign = 'STRETCH';
    f.paddingTop = 10;
    f.paddingBottom = 10;
    f.paddingLeft = 14;
    f.paddingRight = 14;
    f.itemSpacing = 6;
    f.cornerRadius = 6;
    f.fills = [{ type: 'SOLID', color: bg ? hexToRgb(bg) : { r: 0.97, g: 0.97, b: 0.97 } }];
    return f;
}

function container(name: string, accentColor: string): FrameNode {
    const f = figma.createFrame();
    f.name = name;
    f.layoutMode = 'VERTICAL';
    f.primaryAxisSizingMode = 'AUTO';
    f.counterAxisSizingMode = 'FIXED';
    f.resize(VIZ_WIDTH, 100);
    f.paddingTop = 20;
    f.paddingBottom = 20;
    f.paddingLeft = 20;
    f.paddingRight = 20;
    f.itemSpacing = 12;
    f.cornerRadius = 8;
    f.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    f.strokes = [{ type: 'SOLID', color: hexToRgb(accentColor) }];
    f.strokeWeight = 2;
    return f;
}

function colorDot(color: string, size = 8): FrameNode {
    const f = figma.createFrame();
    f.name = 'dot';
    f.resize(size, size);
    f.cornerRadius = size / 2;
    f.fills = [{ type: 'SOLID', color: hexToRgb(color) }];
    return f;
}

function hRow(name: string, spacing = 6): FrameNode {
    const f = figma.createFrame();
    f.name = name;
    f.layoutMode = 'HORIZONTAL';
    f.primaryAxisSizingMode = 'FIXED';
    f.counterAxisSizingMode = 'AUTO';
    f.layoutAlign = 'STRETCH';
    f.counterAxisAlignItems = 'CENTER';
    f.itemSpacing = spacing;
    f.fills = [];
    return f;
}

// ─── Theme colors ──────────────────────────────────────────────────────────

const THEME_HEX = ['#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#14B8A6', '#F59E0B'];
const THEME_BG = ['#EEF2FF', '#F5F3FF', '#FDF2F8', '#FFF1F2', '#F0FDFA', '#FFFBEB'];
const STRENGTH_HEX: Record<string, string> = { strong: '#22C55E', moderate: '#3B82F6', weak: '#F97316' };

// ─── Type definitions (mirroring UI types) ─────────────────────────────────

interface Theme {
    id: string;
    name: string;
    description: string;
    insightIds: string[];
}

interface Evidence {
    quote: string;
    participantId: string;
    emotion?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    journeyStage?: string;
    tags?: string[];
}

interface Insight {
    id: string;
    statement: string;
    evidence: Evidence[];
    strength: 'weak' | 'moderate' | 'strong';
}

interface InsightsData {
    themes: Theme[];
    insights: Insight[];
    opportunities: string[];
    hmwPrompts: string[];
}

interface PersonaContent {
    name: string;
    role: string;
    description: string;
    behaviors: string[];
    goals: string[];
    frustrations: string[];
    needs: string[];
    representativeQuotes: string[];
}

interface EmpathyMapContent {
    targetUser: string;
    quadrants: {
        says: string[];
        thinks: string[];
        does: string[];
        feels: string[];
    };
}

interface JourneyStage {
    name: string;
    description: string;
    emotion: 'positive' | 'neutral' | 'negative';
    userActions: string[];
    painPoints: string[];
    opportunities: string[];
}

interface JourneyMapContent {
    title: string;
    targetUser: string;
    stages: JourneyStage[];
}

// ─── Renderers ─────────────────────────────────────────────────────────────

async function renderThemeStories(data: InsightsData): Promise<FrameNode> {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Italic' });

    const frame = container('Theme Stories', '#6366F1');
    frame.appendChild(text('THEME STORIES', { size: 10, bold: true, color: hexToRgb('#6B7280'), fill: false }));

    for (let i = 0; i < data.themes.length; i++) {
        const theme = data.themes[i];
        const c = card(`Theme: ${theme.name}`, THEME_BG[i % THEME_BG.length]);
        c.appendChild(text(theme.name, { size: 13, bold: true, color: hexToRgb(THEME_HEX[i % THEME_HEX.length]) }));
        c.appendChild(text(theme.description, { size: 12 }));

        // Strength dots row
        const themeInsights = data.insights.filter((ins) => theme.insightIds.includes(ins.id));
        const row = hRow('strengths');
        for (const ins of themeInsights) {
            row.appendChild(colorDot(STRENGTH_HEX[ins.strength]));
        }
        row.appendChild(text(`${themeInsights.length} insight${themeInsights.length !== 1 ? 's' : ''}`, {
            size: 10, color: hexToRgb('#6B7280'), fill: false,
        }));
        c.appendChild(row);

        frame.appendChild(c);
    }

    return frame;
}

async function renderHeatmap(data: InsightsData): Promise<FrameNode> {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

    const frame = container('Participant × Theme Heatmap', '#8B5CF6');
    frame.appendChild(text('PARTICIPANT × THEME', { size: 10, bold: true, color: hexToRgb('#6B7280'), fill: false }));

    // Extract participant IDs
    const pIds = new Set<string>();
    for (const ins of data.insights) {
        for (const ev of ins.evidence) {
            if (ev.participantId) {
                const m = ev.participantId.match(/^P?(\d+)/i);
                if (m) pIds.add(m[1]);
            }
        }
    }
    const sortedPIds = Array.from(pIds).sort((a, b) => Number(a) - Number(b));

    // Header row
    const headerRow = hRow('header', 4);
    headerRow.appendChild(text('', { size: 9, fill: false }));
    const spacer = figma.createFrame();
    spacer.name = 'spacer';
    spacer.resize(90, 1);
    spacer.fills = [];
    headerRow.appendChild(spacer);
    for (const pid of sortedPIds) {
        headerRow.appendChild(text(`P${pid}`, { size: 9, color: hexToRgb('#6B7280'), fill: false }));
    }
    frame.appendChild(headerRow);

    // Data rows
    for (const theme of data.themes) {
        const themeInsights = data.insights.filter((ins) => theme.insightIds.includes(ins.id));
        const pCounts: Record<string, number> = {};
        for (const ins of themeInsights) {
            for (const ev of ins.evidence) {
                if (ev.participantId) {
                    const m = ev.participantId.match(/^P?(\d+)/i);
                    if (m) pCounts[m[1]] = (pCounts[m[1]] || 0) + 1;
                }
            }
        }

        const row = hRow(`row-${theme.id}`, 4);
        const label = text(
            theme.name.length > 14 ? theme.name.slice(0, 14) + '…' : theme.name,
            { size: 9, color: hexToRgb('#6B7280'), fill: false }
        );
        label.resize(90, label.height);
        row.appendChild(label);

        for (const pid of sortedPIds) {
            const count = pCounts[pid] || 0;
            const cellColor = count === 0 ? '#E5E7EB' : count === 1 ? '#C7D2FE' : count === 2 ? '#818CF8' : '#4F46E5';
            const cell = figma.createFrame();
            cell.name = `P${pid}`;
            cell.resize(20, 20);
            cell.cornerRadius = 3;
            cell.fills = [{ type: 'SOLID', color: hexToRgb(cellColor) }];
            row.appendChild(cell);
        }
        frame.appendChild(row);
    }

    return frame;
}

async function renderStrengthLadder(data: InsightsData): Promise<FrameNode> {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Italic' });

    const frame = container('Evidence Strength', '#10B981');
    frame.appendChild(text('EVIDENCE STRENGTH', { size: 10, bold: true, color: hexToRgb('#6B7280'), fill: false }));

    const maxEv = Math.max(...data.insights.map((i) => i.evidence.length), 1);
    const groups: ['strong', 'moderate', 'weak'] = ['strong', 'moderate', 'weak'];
    const groupLabels: Record<string, string> = { strong: 'STRONG EVIDENCE', moderate: 'MODERATE EVIDENCE', weak: 'NEEDS MORE EVIDENCE' };

    for (const strength of groups) {
        const items = data.insights.filter((i) => i.strength === strength);
        if (items.length === 0) continue;

        frame.appendChild(text(groupLabels[strength], {
            size: 10, bold: true, color: hexToRgb(STRENGTH_HEX[strength]), fill: false,
        }));

        for (const ins of items) {
            const c = card(`Insight: ${ins.id}`);
            c.appendChild(text(ins.statement, { size: 12 }));

            // Evidence bar
            const barContainer = figma.createFrame();
            barContainer.name = 'evidence-bar';
            barContainer.layoutMode = 'HORIZONTAL';
            barContainer.primaryAxisSizingMode = 'FIXED';
            barContainer.counterAxisSizingMode = 'AUTO';
            barContainer.layoutAlign = 'STRETCH';
            barContainer.counterAxisAlignItems = 'CENTER';
            barContainer.itemSpacing = 6;
            barContainer.fills = [];

            const barBg = figma.createFrame();
            barBg.name = 'bar-bg';
            barBg.resize(200, 6);
            barBg.cornerRadius = 3;
            barBg.fills = [{ type: 'SOLID', color: hexToRgb('#E5E7EB') }];

            const barFill = figma.createFrame();
            barFill.name = 'bar-fill';
            barFill.resize(Math.round((ins.evidence.length / maxEv) * 200), 6);
            barFill.cornerRadius = 3;
            barFill.fills = [{ type: 'SOLID', color: hexToRgb(STRENGTH_HEX[strength]) }];
            barFill.x = 0;
            barFill.y = 0;

            barContainer.appendChild(barBg);
            barContainer.appendChild(text(`${ins.evidence.length} quote${ins.evidence.length !== 1 ? 's' : ''}`, {
                size: 10, color: hexToRgb('#6B7280'), fill: false,
            }));
            c.appendChild(barContainer);

            // First quote
            if (ins.evidence[0]) {
                c.appendChild(text(`"${ins.evidence[0].quote}"`, { size: 10, italic: true, color: hexToRgb('#6B7280') }));
            }

            frame.appendChild(c);
        }
    }

    return frame;
}

async function renderParticipantVoices(data: InsightsData): Promise<FrameNode> {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Italic' });

    const frame = container('Participant Voices', '#EC4899');
    frame.appendChild(text('PARTICIPANT VOICES', { size: 10, bold: true, color: hexToRgb('#6B7280'), fill: false }));

    for (let i = 0; i < data.themes.length; i++) {
        const theme = data.themes[i];
        const themeInsights = data.insights.filter((ins) => theme.insightIds.includes(ins.id));

        // Find longest quote
        let bestQuote = '';
        let bestParticipant = '';
        for (const ins of themeInsights) {
            for (const ev of ins.evidence) {
                if (ev.quote.length > bestQuote.length) {
                    bestQuote = ev.quote;
                    bestParticipant = ev.participantId || '';
                }
            }
        }

        if (!bestQuote) continue;

        const cleanedQuote = bestQuote.replace(/^[""]|[""]$/g, '');

        const c = card(`Quote: ${theme.name}`);
        // Left accent bar via stroke
        c.strokes = [{ type: 'SOLID', color: hexToRgb(THEME_HEX[i % THEME_HEX.length]) }];
        c.strokeWeight = 3;
        c.strokeAlign = 'INSIDE';

        c.appendChild(text(`"${cleanedQuote}"`, { size: 13, italic: true }));

        const attr = hRow('attribution');
        attr.appendChild(text(bestParticipant, { size: 10, bold: true, color: hexToRgb('#6B7280'), fill: false }));
        attr.appendChild(text(`— ${theme.name}`, { size: 10, color: hexToRgb('#9CA3AF'), fill: false }));
        c.appendChild(attr);

        frame.appendChild(c);
    }

    return frame;
}

async function renderOpportunityFlow(data: InsightsData): Promise<FrameNode> {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

    const frame = container('Themes → Opportunities', '#10B981');
    frame.appendChild(text('THEMES → OPPORTUNITIES', { size: 10, bold: true, color: hexToRgb('#6B7280'), fill: false }));

    // Theme legend
    const legend = hRow('theme-legend', 8);
    for (let i = 0; i < data.themes.length; i++) {
        const row = hRow(`legend-${i}`, 4);
        row.appendChild(colorDot(THEME_HEX[i % THEME_HEX.length]));
        row.appendChild(text(
            data.themes[i].name.length > 18 ? data.themes[i].name.slice(0, 18) + '…' : data.themes[i].name,
            { size: 9, color: hexToRgb('#6B7280'), fill: false }
        ));
        legend.appendChild(row);
    }
    frame.appendChild(legend);

    // Opportunities
    for (const opp of data.opportunities) {
        const c = card(`Opp`);
        c.appendChild(text(opp, { size: 12 }));

        // Match themes
        const oppLower = opp.toLowerCase();
        const matchedIndices: number[] = [];
        for (let i = 0; i < data.themes.length; i++) {
            const words = data.themes[i].name.toLowerCase().split(/[\s/\-&]+/).filter((w) => w.length > 3);
            if (words.some((w) => oppLower.includes(w))) matchedIndices.push(i);
        }

        if (matchedIndices.length > 0) {
            const row = hRow('addresses', 4);
            row.appendChild(text('addresses:', { size: 10, color: hexToRgb('#6B7280'), fill: false }));
            for (const idx of matchedIndices) {
                row.appendChild(colorDot(THEME_HEX[idx % THEME_HEX.length], 10));
            }
            c.appendChild(row);
        }

        frame.appendChild(c);
    }

    return frame;
}

// ─── New Artifact Renderers ────────────────────────────────────────────────

async function renderPersona(persona: PersonaContent): Promise<FrameNode> {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Italic' });

    const frame = container('Behavioral Persona', '#3B82F6');
    frame.appendChild(text('BEHAVIORAL PERSONA', { size: 10, bold: true, color: hexToRgb('#6B7280'), fill: false }));

    const header = figma.createFrame();
    header.name = 'header';
    header.layoutMode = 'VERTICAL';
    header.primaryAxisSizingMode = 'AUTO';
    header.counterAxisSizingMode = 'FIXED';
    header.layoutAlign = 'STRETCH';
    header.fills = [];
    header.appendChild(text(persona.name, { size: 24, bold: true, color: hexToRgb('#111827') }));
    header.appendChild(text(persona.role, { size: 14, color: hexToRgb('#6B7280') }));

    frame.appendChild(header);

    const desc = card('Overview', '#EFF6FF');
    desc.appendChild(text(persona.description, { size: 13, italic: true, color: hexToRgb('#1E40AF') }));
    frame.appendChild(desc);

    const attrGrid = figma.createFrame();
    attrGrid.layoutMode = 'HORIZONTAL';
    attrGrid.primaryAxisSizingMode = 'FIXED';
    attrGrid.counterAxisSizingMode = 'AUTO';
    attrGrid.layoutAlign = 'STRETCH';
    attrGrid.itemSpacing = 16;
    attrGrid.fills = [];

    const col1 = figma.createFrame();
    col1.layoutMode = 'VERTICAL';
    col1.primaryAxisSizingMode = 'AUTO';
    col1.counterAxisSizingMode = 'FIXED';
    col1.layoutGrow = 1;
    col1.itemSpacing = 12;
    col1.fills = [];

    const col2 = figma.createFrame();
    col2.layoutMode = 'VERTICAL';
    col2.primaryAxisSizingMode = 'AUTO';
    col2.counterAxisSizingMode = 'FIXED';
    col2.layoutGrow = 1;
    col2.itemSpacing = 12;
    col2.fills = [];

    const behaviors = card('Behaviors');
    behaviors.appendChild(text('BEHAVIORS', { size: 10, bold: true, color: hexToRgb('#6B7280'), fill: false }));
    persona.behaviors.forEach((b) => behaviors.appendChild(text(`• ${b}`, { size: 12 })));
    col1.appendChild(behaviors);

    const needs = card('Needs');
    needs.appendChild(text('NEEDS', { size: 10, bold: true, color: hexToRgb('#6B7280'), fill: false }));
    persona.needs.forEach((n) => needs.appendChild(text(`• ${n}`, { size: 12 })));
    col1.appendChild(needs);

    const goals = card('Goals', '#F0FDF4');
    goals.appendChild(text('GOALS', { size: 10, bold: true, color: hexToRgb('#16A34A'), fill: false }));
    persona.goals.forEach((g) => goals.appendChild(text(`• ${g}`, { size: 12 })));
    col2.appendChild(goals);

    const frustrations = card('Frustrations', '#FEF2F2');
    frustrations.appendChild(text('FRUSTRATIONS', { size: 10, bold: true, color: hexToRgb('#DC2626'), fill: false }));
    persona.frustrations.forEach((f) => frustrations.appendChild(text(`• ${f}`, { size: 12 })));
    col2.appendChild(frustrations);

    attrGrid.appendChild(col1);
    attrGrid.appendChild(col2);
    frame.appendChild(attrGrid);

    return frame;
}

async function renderEmpathyMap(map: EmpathyMapContent): Promise<FrameNode> {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Italic' });

    const frame = container('Empathy Map', '#EC4899');
    frame.appendChild(text('EMPATHY MAP', { size: 10, bold: true, color: hexToRgb('#6B7280'), fill: false }));
    frame.appendChild(text(`Target User: ${map.targetUser}`, { size: 14, bold: true }));

    const grid = figma.createFrame();
    grid.name = 'Grid';
    grid.layoutMode = 'VERTICAL';
    grid.primaryAxisSizingMode = 'AUTO';
    grid.counterAxisSizingMode = 'FIXED';
    grid.layoutAlign = 'STRETCH';
    grid.itemSpacing = 8;
    grid.fills = [];

    const topRow = figma.createFrame();
    topRow.layoutMode = 'HORIZONTAL';
    topRow.primaryAxisSizingMode = 'FIXED';
    topRow.counterAxisSizingMode = 'AUTO';
    topRow.layoutAlign = 'STRETCH';
    topRow.itemSpacing = 8;
    topRow.fills = [];

    const saysCard = card('Says', '#EFF6FF');
    saysCard.layoutGrow = 1;
    saysCard.appendChild(text('SAYS', { size: 12, bold: true, color: hexToRgb('#2563EB'), fill: false }));
    map.quadrants.says.forEach((s) => saysCard.appendChild(text(`"${s}"`, { size: 12, italic: true })));
    topRow.appendChild(saysCard);

    const thinksCard = card('Thinks', '#F5F3FF');
    thinksCard.layoutGrow = 1;
    thinksCard.appendChild(text('THINKS', { size: 12, bold: true, color: hexToRgb('#7C3AED'), fill: false }));
    map.quadrants.thinks.forEach((t) => thinksCard.appendChild(text(`• ${t}`, { size: 12 })));
    topRow.appendChild(thinksCard);

    grid.appendChild(topRow);

    const bottomRow = figma.createFrame();
    bottomRow.layoutMode = 'HORIZONTAL';
    bottomRow.primaryAxisSizingMode = 'FIXED';
    bottomRow.counterAxisSizingMode = 'AUTO';
    bottomRow.layoutAlign = 'STRETCH';
    bottomRow.itemSpacing = 8;
    bottomRow.fills = [];

    const doesCard = card('Does', '#F0FDF4');
    doesCard.layoutGrow = 1;
    doesCard.appendChild(text('DOES', { size: 12, bold: true, color: hexToRgb('#16A34A'), fill: false }));
    map.quadrants.does.forEach((d) => doesCard.appendChild(text(`• ${d}`, { size: 12 })));
    bottomRow.appendChild(doesCard);

    const feelsCard = card('Feels', '#FEF2F2');
    feelsCard.layoutGrow = 1;
    feelsCard.appendChild(text('FEELS', { size: 12, bold: true, color: hexToRgb('#E11D48'), fill: false }));
    map.quadrants.feels.forEach((f) => feelsCard.appendChild(text(`• ${f}`, { size: 12 })));
    bottomRow.appendChild(feelsCard);

    grid.appendChild(bottomRow);
    frame.appendChild(grid);

    return frame;
}

async function renderJourneyMap(journey: JourneyMapContent): Promise<FrameNode> {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

    // Make journey map wider (increased by 250%)
    const frame = container('User Journey Map', '#8B5CF6');
    frame.resize(2000, 100);

    frame.appendChild(text('USER JOURNEY MAP', { size: 10, bold: true, color: hexToRgb('#6B7280'), fill: false }));

    const header = figma.createFrame();
    header.layoutMode = 'VERTICAL';
    header.primaryAxisSizingMode = 'AUTO';
    header.counterAxisSizingMode = 'FIXED';
    header.layoutAlign = 'STRETCH';
    header.fills = [];
    header.appendChild(text(journey.title, { size: 24, bold: true, color: hexToRgb('#111827') }));
    header.appendChild(text(`Target User: ${journey.targetUser}`, { size: 14, color: hexToRgb('#6B7280') }));
    frame.appendChild(header);

    const timeline = figma.createFrame();
    timeline.layoutMode = 'HORIZONTAL';
    timeline.primaryAxisSizingMode = 'FIXED';
    timeline.counterAxisSizingMode = 'AUTO';
    timeline.layoutAlign = 'STRETCH';
    timeline.itemSpacing = 16;
    timeline.fills = [];

    const getEmotionColor = (emotion: string) => {
        if (emotion === 'positive') return '#10B981';
        if (emotion === 'negative') return '#EF4444';
        return '#9CA3AF';
    };

    journey.stages.forEach((stage, i) => {
        const stageCard = card(`Stage ${i + 1}`);
        stageCard.layoutGrow = 1;

        const headerRow = hRow('stage-header', 8);
        headerRow.layoutAlign = 'STRETCH';
        const stText = text(`${i + 1}. ${stage.name}`, { size: 14, bold: true });
        stText.layoutGrow = 1;
        headerRow.appendChild(stText);

        // Emotion dot
        const dotBg = figma.createFrame();
        dotBg.resize(16, 16);
        dotBg.cornerRadius = 8;
        dotBg.fills = [{ type: 'SOLID', color: hexToRgb(getEmotionColor(stage.emotion)) }];
        headerRow.appendChild(dotBg);

        stageCard.appendChild(headerRow);
        stageCard.appendChild(text(stage.description, { size: 12, color: hexToRgb('#6B7280') }));

        if (stage.painPoints.length > 0) {
            const painCard = figma.createFrame();
            painCard.layoutMode = 'VERTICAL';
            painCard.primaryAxisSizingMode = 'AUTO';
            painCard.counterAxisSizingMode = 'FIXED';
            painCard.layoutAlign = 'STRETCH';
            painCard.paddingTop = 8;
            painCard.paddingBottom = 8;
            painCard.paddingLeft = 8;
            painCard.paddingRight = 8;
            painCard.cornerRadius = 4;
            painCard.itemSpacing = 4;
            painCard.fills = [{ type: 'SOLID', color: hexToRgb('#FEF2F2') }];
            painCard.appendChild(text('PAIN POINTS', { size: 9, bold: true, color: hexToRgb('#DC2626'), fill: false }));
            stage.painPoints.forEach(p => painCard.appendChild(text(`• ${p}`, { size: 11, color: hexToRgb('#991B1B') })));
            stageCard.appendChild(painCard);
        }

        if (stage.opportunities.length > 0) {
            const oppCard = figma.createFrame();
            oppCard.layoutMode = 'VERTICAL';
            oppCard.primaryAxisSizingMode = 'AUTO';
            oppCard.counterAxisSizingMode = 'FIXED';
            oppCard.layoutAlign = 'STRETCH';
            oppCard.paddingTop = 8;
            oppCard.paddingBottom = 8;
            oppCard.paddingLeft = 8;
            oppCard.paddingRight = 8;
            oppCard.cornerRadius = 4;
            oppCard.itemSpacing = 4;
            oppCard.fills = [{ type: 'SOLID', color: hexToRgb('#EFF6FF') }];
            oppCard.appendChild(text('OPPORTUNITIES', { size: 9, bold: true, color: hexToRgb('#2563EB'), fill: false }));
            stage.opportunities.forEach(o => oppCard.appendChild(text(`• ${o}`, { size: 11, color: hexToRgb('#1E40AF') })));
            stageCard.appendChild(oppCard);
        }

        timeline.appendChild(stageCard);
    });

    frame.appendChild(timeline);
    return frame;
}

// ─── Main dispatcher ───────────────────────────────────────────────────────

export interface VizInsertResult {
    vizType: string;
    nodeId: string;
}

export async function renderVisualization(
    vizType: string,
    data: unknown
): Promise<VizInsertResult> {
    // The data payload is InsightsContent (or extended versions with extra fields)
    const dataObj = data as Record<string, unknown>;
    const insightsData = (dataObj && dataObj.content ? dataObj.content : data) as InsightsData;

    let frame: FrameNode;
    switch (vizType) {
        case 'theme-stories':
            frame = await renderThemeStories(insightsData);
            break;
        case 'participant-heatmap': {
            // Heatmap passes { insights, participantIds, heatmap } but we only need insights
            const heatmapData = (dataObj && dataObj.insights ? dataObj.insights : insightsData) as InsightsData;
            frame = await renderHeatmap(heatmapData);
            break;
        }
        case 'strength-ladder':
            frame = await renderStrengthLadder(insightsData);
            break;
        case 'participant-voices':
            frame = await renderParticipantVoices(insightsData);
            break;
        case 'opportunity-flow':
            frame = await renderOpportunityFlow(insightsData);
            break;
        case 'persona':
            frame = await renderPersona((dataObj.content || dataObj) as unknown as PersonaContent);
            break;
        case 'empathy-map':
            frame = await renderEmpathyMap((dataObj.content || dataObj) as unknown as EmpathyMapContent);
            break;
        case 'journey-map':
            frame = await renderJourneyMap((dataObj.content || dataObj) as unknown as JourneyMapContent);
            break;
        default:
            throw new Error(`Unknown visualization type: ${vizType}`);
    }

    // Position on canvas
    const existingNodes = await findQualviewNodes();
    const pos = getNextPosition(existingNodes, VIZ_WIDTH, 400, frame);
    frame.x = pos.x;
    frame.y = pos.y;

    figma.currentPage.appendChild(frame);
    figma.viewport.scrollAndZoomIntoView([frame]);

    registerInsertedNode(frame.id);

    return { vizType, nodeId: frame.id };
}
