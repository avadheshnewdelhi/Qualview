/// <reference types="@figma/plugin-typings" />

interface LayoutConfig {
    gridSize: number;
    gutterX: number;
    gutterY: number;
    offsetX: number;
    offsetY: number;
    mode: 'grid' | 'clustered';
}

/**
 * Get layout configuration based on editor type
 */
export function getLayoutConfig(): LayoutConfig {
    const isfigjam = figma.editorType === 'figjam';

    if (isfigjam) {
        // FigJam: Clustered, spatial layout
        return {
            gridSize: 0,
            gutterX: 20,
            gutterY: 20,
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
 * Calculate next available position based on existing objects
 */
export function getNextPosition(
    existingNodes: readonly SceneNode[],
    width: number,
    height: number
): { x: number; y: number } {
    const layout = getLayoutConfig();

    if (existingNodes.length === 0) {
        return { x: layout.offsetX, y: layout.offsetY };
    }

    // Find the rightmost and bottommost positions
    let maxX = 0;
    let maxY = 0;

    for (const node of existingNodes) {
        if ('x' in node && 'y' in node) {
            maxX = Math.max(maxX, node.x + (node.width || 0));
            maxY = Math.max(maxY, node.y + (node.height || 0));
        }
    }

    if (layout.mode === 'grid') {
        // Grid layout: place to the right, wrap to next row if too wide
        const newX = maxX + layout.gutterX;
        const viewportWidth = figma.viewport.bounds.width;

        if (newX + width > viewportWidth) {
            return {
                x: layout.offsetX,
                y: maxY + layout.gutterY,
            };
        }

        return {
            x: newX,
            y: layout.offsetY,
        };
    }

    // Clustered layout: place nearby with some offset
    return {
        x: maxX + layout.gutterX,
        y: maxY - height / 2,
    };
}
