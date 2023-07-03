import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import svgr from 'vite-plugin-svgr';
import agFileWatcher from './src/astro/integrations/agFileWatcher';
import agHotModuleReload from './src/astro/plugins/agHotModuleReload';

// https://astro.build/config
export default defineConfig({
    outDir: '../../dist/packages/ag-charts-website',
    vite: {
        plugins: [svgr(), agHotModuleReload()],
    },
    integrations: [react(), markdoc(), agFileWatcher()],
});
