/// <reference types="@figma/plugin-typings" />

import { handleMessage } from './messages/handler';
import { setupSelectionListener } from './canvas/selection';

// Show the plugin UI with resize enabled
// Minimum size is enforced in the RESIZE message handler
figma.showUI(__html__, {
    width: 640,
    height: 960,
    themeColors: true,
    title: 'Qualview',
});

// Set up selection change listener
setupSelectionListener();

// Handle messages from the UI
figma.ui.onmessage = handleMessage;

// Clean up on close
figma.on('close', () => {
    // Any cleanup needed
});
