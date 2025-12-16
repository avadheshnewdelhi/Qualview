// Selection data from canvas
export interface SelectionNode {
    id: string;
    type: string;
    name: string;
    text?: string;
    children?: SelectionNode[];
}

export interface SelectionData {
    nodes: SelectionNode[];
    extractedText: string;
}
