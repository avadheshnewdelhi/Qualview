import type { UIMessage } from '@/types';

/**
 * Post a message to the Figma main thread
 */
export function postMessage(message: UIMessage): void {
    parent.postMessage({ pluginMessage: message }, '*');
}

/**
 * Request to resize the plugin window
 */
export function resizePlugin(width: number, height: number): void {
    postMessage({ type: 'RESIZE', payload: { width, height } });
}
