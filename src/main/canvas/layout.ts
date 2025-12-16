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
 * Find all Qualview nodes on the current page
 * Looks for frames named "Qualview: *"
 */
export function findQualviewNodes(): SceneNode[] {
    const nodes: SceneNode[] = [];

    // First, check tracked nodes from this session
    for (const nodeId of insertedNodeIds) {
        const node = figma.getNodeById(nodeId);
        if (node && node.type === 'FRAME' && 'x' in node) {
            nodes.push(node as SceneNode);
        }
    }

    // Also find any existing Qualview frames on the page (from previous sessions)
    const pageNodes = figma.currentPage.findAll((node) =>
        node.type === 'FRAME' && node.name.startsWith('Qualview:')
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
 * Calculate next available position based on existing Qualview objects
 * Uses a horizontal flow layout that wraps to next row when needed
 */
export function getNextPosition(
    existingNodes: SceneNode[],
    width: number,
    height: number
): { x: number; y: number } {
    const layout = getLayoutConfig();

    // If no existing nodes, start at a consistent position
    if (existingNodes.length === 0) {
        // Use viewport center as starting point, but snap to grid
        const viewport = figma.viewport.center;
        const startX = layout.mode === 'grid'
            ? Math.round(viewport.x / layout.gridSize) * layout.gridSize
            : viewport.x;
        const startY = layout.mode === 'grid'
            ? Math.round(viewport.y / layout.gridSize) * layout.gridSize
            : viewport.y;

        return { x: startX, y: startY };
    }

    // Find the bounding box of all existing nodes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of existingNodes) {
        if ('x' in node && 'y' in node && 'width' in node && 'height' in node) {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + (node.width || 0));
            maxY = Math.max(maxY, node.y + (node.height || 0));
        }
    }

    if (layout.mode === 'grid') {
        // Grid layout: place to the right of the last node
        // If too wide for viewport, wrap to next row
        const newX = maxX + layout.gutterX;
        const viewportRight = figma.viewport.center.x + figma.viewport.bounds.width / 2;

        // Check if new position would go too far right (more than 2000px from start)
        const maxRowWidth = 1600; // Allow up to 4 frames per row @ 400px each
        const rowWidth = newX - minX + width;

        if (rowWidth > maxRowWidth) {
            // Wrap to next row
            return {
                x: minX,
                y: maxY + layout.gutterY,
            };
        }

        // Find the Y position - align with the top of existing nodes in this row
        // Get nodes that are roughly at the same Y level
        const rowNodes = existingNodes.filter(n => {
            if (!('y' in n)) return false;
            return Math.abs(n.y - minY) < 50 || Math.abs(n.y - (maxY - (n.height || 0))) < 50;
        });

        // Use the topmost Y of the rightmost column
        const rightmostNode = existingNodes.reduce((rightmost, node) => {
            if (!('x' in node)) return rightmost;
            if (!rightmost || node.x > (rightmost as SceneNode & { x: number }).x) return node;
            return rightmost;
        }, null as SceneNode | null);

        const alignY = rightmostNode && 'y' in rightmostNode ? rightmostNode.y : minY;

        return {
            x: newX,
            y: alignY as number,
        };
    }

    // Clustered layout (FigJam): place to the right with slight diagonal offset
    return {
        x: maxX + layout.gutterX,
        y: minY + (existingNodes.length % 3) * 50, // Slight stagger
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
