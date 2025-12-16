/// <reference types="@figma/plugin-typings" />

interface SelectionNode {
    id: string;
    type: string;
    name: string;
    text?: string;
    children?: SelectionNode[];
}

interface SelectionData {
    nodes: SelectionNode[];
    extractedText: string;
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
function nodeToSelectionNode(node: SceneNode): SelectionNode {
    const selectionNode: SelectionNode = {
        id: node.id,
        type: node.type,
        name: node.name,
    };

    if (node.type === 'TEXT') {
        selectionNode.text = node.characters;
    }

    if ('children' in node && node.children.length > 0) {
        selectionNode.children = node.children.map((child) =>
            nodeToSelectionNode(child as SceneNode)
        );
    }

    return selectionNode;
}

/**
 * Get current selection data
 */
export function getSelectionData(): SelectionData {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
        return {
            nodes: [],
            extractedText: '',
        };
    }

    const nodes = selection.map(nodeToSelectionNode);
    const extractedText = selection
        .map(extractTextFromNode)
        .filter(Boolean)
        .join('\n\n');

    return {
        nodes,
        extractedText,
    };
}

/**
 * Set up listener for selection changes
 */
export function setupSelectionListener(): void {
    figma.on('selectionchange', () => {
        const selectionData = getSelectionData();
        figma.ui.postMessage({
            type: 'SELECTION_CHANGED',
            payload: selectionData,
        });
    });
}
