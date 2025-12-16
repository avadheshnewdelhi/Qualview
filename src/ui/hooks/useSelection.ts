import { useStore } from '@/store';
import { postMessage } from '@/lib/figma';
import type { SelectionData } from '@/types';
import { useEffect } from 'react';

/**
 * Hook to manage canvas selection state
 */
export function useSelection() {
    const { canvasSelection, setCanvasSelection } = useStore();

    useEffect(() => {
        // Request initial selection
        postMessage({ type: 'GET_SELECTION' });
    }, []);

    const refreshSelection = () => {
        postMessage({ type: 'GET_SELECTION' });
    };

    return {
        selection: canvasSelection,
        hasSelection: canvasSelection.nodes.length > 0,
        extractedText: canvasSelection.extractedText,
        refreshSelection,
    };
}
