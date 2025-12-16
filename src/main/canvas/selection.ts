/// <reference types="@figma/plugin-typings" />

interface SelectionNode {
    id: string;
    type: string;
    name: string;
    text?: string;
    imageData?: string; // Base64 encoded image
    children?: SelectionNode[];
}

interface SelectionData {
    nodes: SelectionNode[];
    extractedText: string;
    hasImages: boolean;
}

/**
 * Check if a node contains image fills
 */
function hasImageFill(node: SceneNode): boolean {
    if ('fills' in node && Array.isArray(node.fills)) {
        return node.fills.some(fill => fill.type === 'IMAGE');
    }
    return false;
}

/**
 * Check if a node is image-like (rectangle with image fill, or specific types)
 */
function isImageNode(node: SceneNode): boolean {
    // Direct image types
    if (node.type === 'STAMP' || node.type === 'MEDIA') {
        return true;
    }

    // Frames/rectangles with image fills
    if (node.type === 'FRAME' || node.type === 'RECTANGLE' || node.type === 'ELLIPSE') {
        return hasImageFill(node);
    }

    // Sticky notes often contain images in FigJam
    if (node.type === 'STICKY') {
        return hasImageFill(node);
    }

    return false;
}

/**
 * Export a node as PNG and return base64 data
 */
async function exportNodeAsImage(node: SceneNode): Promise<string | null> {
    try {
        const bytes = await node.exportAsync({
            format: 'PNG',
            constraint: { type: 'SCALE', value: 2 }, // 2x for better OCR
        });

        // Convert Uint8Array to base64
        const base64 = figma.base64Encode(bytes);
        return `data:image/png;base64,${base64}`;
    } catch (error) {
        console.error('Failed to export node as image:', error);
        return null;
    }
}

/**
 * Extract text content from a Figma node
 */
function extractTextFromNode(node: SceneNode): string {
    const texts: string[] = [];

    if (node.type === 'TEXT') {
        texts.push(node.characters);
    }

    if ('children' in node) {
        for (const child of node.children) {
            texts.push(extractTextFromNode(child as SceneNode));
        }
    }

    return texts.filter(Boolean).join('\n');
}

/**
 * Convert a Figma node to our SelectionNode type
 */
async function nodeToSelectionNode(node: SceneNode): Promise<SelectionNode> {
    const selectionNode: SelectionNode = {
        id: node.id,
        type: node.type,
        name: node.name,
    };

    if (node.type === 'TEXT') {
        selectionNode.text = node.characters;
    }

    // For image-like nodes, export as image for OCR
    if (isImageNode(node)) {
        const imageData = await exportNodeAsImage(node);
        if (imageData) {
            selectionNode.imageData = imageData;
        }
    }

    if ('children' in node && node.children.length > 0) {
        const childPromises = node.children.map((child) =>
            nodeToSelectionNode(child as SceneNode)
        );
        selectionNode.children = await Promise.all(childPromises);
    }

    return selectionNode;
}

/**
 * Collect all image data from nodes (flattened)
 */
function collectImageData(nodes: SelectionNode[]): string[] {
    const images: string[] = [];

    for (const node of nodes) {
        if (node.imageData) {
            images.push(node.imageData);
        }
        if (node.children) {
            images.push(...collectImageData(node.children));
        }
    }

    return images;
}

/**
 * Get current selection data
 */
export async function getSelectionData(): Promise<SelectionData> {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
        return {
            nodes: [],
            extractedText: '',
            hasImages: false,
        };
    }

    // Process nodes (async for image export)
    const nodePromises = selection.map(nodeToSelectionNode);
    const nodes = await Promise.all(nodePromises);

    const extractedText = selection
        .map(extractTextFromNode)
        .filter(Boolean)
        .join('\n\n');

    // Check if any nodes have images
    const hasImages = collectImageData(nodes).length > 0;

    return {
        nodes,
        extractedText,
        hasImages,
    };
}

/**
 * Set up listener for selection changes
 */
export function setupSelectionListener(): void {
    figma.on('selectionchange', async () => {
        const selectionData = await getSelectionData();
        figma.ui.postMessage({
            type: 'SELECTION_CHANGED',
            payload: selectionData,
        });
    });
}
