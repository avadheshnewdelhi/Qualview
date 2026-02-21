/// <reference types="@figma/plugin-typings" />

interface LayoutConfig {
    gridSize: number;
    gutterX: number;
    gutterY: number;
    offsetX: number;
    offsetY: number;
    mode: 'grid' | 'clustered';
}

// Track all inserted Qualview nodes for this session
const insertedNodeIds: string[] = [];

/**
 * Get layout configuration based on editor type
 */
export function getLayoutConfig(): LayoutConfig {
    const isFigJam = figma.editorType === 'figjam';

    if (isFigJam) {
        // FigJam: Clustered, spatial layout
        return {
            gridSize: 0,
            gutterX: 40,
            gutterY: 40,
            offsetX: 0,
            offsetY: 0,
            mode: 'clustered',
        };
    }

    // Figma Design: Grid-aligned layout
    return {
        gridSize: 100,
        gutterX: 40,
        gutterY: 40,
        offsetX: 100,
        offsetY: 100,
        mode: 'grid',
    };
}

/**
 * Find all Qualview artifact nodes on the current page
 * Matches frames by known type names (with or without legacy "Qualview:" prefix)
 */
const KNOWN_TYPE_NAMES = [
    'Framing', 'Plan', 'Screener', 'Participants', 'Interview-guide', 'Insights',
    'Behavioral Persona', 'Empathy Map', 'User Journey Map',
    'Theme Stories', 'Participant × Theme Heatmap', 'Evidence Strength',
    'Participant Voices', 'Themes → Opportunities'
];

export async function findQualviewNodes(): Promise<SceneNode[]> {
    const nodes: SceneNode[] = [];

    // First, check tracked nodes from this session
    for (const nodeId of insertedNodeIds) {
        try {
            const node = await figma.getNodeByIdAsync(nodeId);
            if (node && node.type === 'FRAME' && 'x' in node) {
                nodes.push(node as SceneNode);
            }
        } catch (e) {
            console.warn(`Could not find tracked node ${nodeId}`, e);
        }
    }

    // Also find existing artifact frames on the page (current or legacy naming)
    const pageNodes = figma.currentPage.findAll((node) =>
        node.type === 'FRAME' && (
            node.name.startsWith('Qualview:') ||
            KNOWN_TYPE_NAMES.includes(node.name)
        )
    );

    // Combine and deduplicate
    const allNodes = [...nodes, ...pageNodes];
    const uniqueNodes = allNodes.filter((node, index, self) =>
        index === self.findIndex((n) => n.id === node.id)
    );

    return uniqueNodes;
}

/**
 * Register a newly inserted node for tracking
 */
export function registerInsertedNode(nodeId: string): void {
    if (!insertedNodeIds.includes(nodeId)) {
        insertedNodeIds.push(nodeId);
    }
}

/**
 * Calculate next available position — always places horizontally to the right
 * with 100px gutters between artifacts
 */
export function getNextPosition(
    _existingNodes: SceneNode[] | null,
    _width: number,
    _height: number,
    newNode?: SceneNode
): { x: number; y: number } {
    const GUTTER = 100; // Consistent 100px spacing between artifacts
    const allNodes = figma.currentPage.children;

    // If no existing nodes (other than the one we are placing), start at viewport center
    if (allNodes.length === 0 || (allNodes.length === 1 && newNode && allNodes[0].id === newNode.id)) {
        const viewport = figma.viewport.center;
        return { x: Math.round(viewport.x), y: Math.round(viewport.y) };
    }

    // Find the rightmost edge and top-alignment of ALL existing nodes
    let maxRight = -Infinity;
    let topY = Infinity;

    for (const node of allNodes) {
        if (newNode && node.id === newNode.id) continue;

        if ('x' in node && 'y' in node && 'width' in node) {
            const right = node.x + (node.width || 0);
            if (right > maxRight) maxRight = right;
            if (node.y < topY) topY = node.y;
        }
    }

    if (maxRight === -Infinity) {
        const viewport = figma.viewport.center;
        return { x: Math.round(viewport.x), y: Math.round(viewport.y) };
    }

    // Place to the right of the rightmost node, aligned to top
    return {
        x: maxRight + GUTTER,
        y: topY,
    };
}

/**
 * Snap a position to grid if in grid mode
 */
export function snapToGrid(x: number, y: number): { x: number; y: number } {
    const layout = getLayoutConfig();

    if (layout.mode !== 'grid' || layout.gridSize === 0) {
        return { x, y };
    }

    return {
        x: Math.round(x / layout.gridSize) * layout.gridSize,
        y: Math.round(y / layout.gridSize) * layout.gridSize,
    };
}
