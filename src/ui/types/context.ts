// Selection data from canvas
export interface SelectionNode {
    id: string;
    type: string;
    name: string;
    text?: string;
    imageData?: string; // Base64 encoded image for OCR
    children?: SelectionNode[];
}

export interface SelectionData {
    nodes: SelectionNode[];
    extractedText: string;
    hasImages: boolean; // Whether selection contains images that need OCR
}
