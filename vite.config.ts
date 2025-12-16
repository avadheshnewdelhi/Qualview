import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

export default defineConfig({
    plugins: [react(), viteSingleFile()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src/ui'),
        },
    },
    base: './',
    root: './src/ui',
    build: {
        outDir: '../../dist',
        emptyOutDir: false,
        cssCodeSplit: false,
        assetsInlineLimit: 100000000, // Inline all assets
        rollupOptions: {
            input: './src/ui/index.html',
            output: {
                inlineDynamicImports: true,
            },
        },
    },
    server: {
        port: 5173,
    },
});
