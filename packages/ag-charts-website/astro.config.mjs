import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import svgr from 'vite-plugin-svgr';
import agFileWatcher from './src/astro/integrations/agFileWatcher';
import agHotModuleReload from './src/astro/plugins/agHotModuleReload';
import { getDevFileList } from './src/utils/pages';

const DEFAULT_SITE_BASE_URL = '/';
const SITE_BASE_URL = process?.env?.SITE_BASE_URL || DEFAULT_SITE_BASE_URL;

const OUTPUT_DIR = '../../dist/packages/ag-charts-website';

console.log('Astro configuration', JSON.stringify({ SITE_BASE_URL, OUTPUT_DIR }, null, 2));

// https://astro.build/config
export default defineConfig({
    base: SITE_BASE_URL,
    outDir: OUTPUT_DIR,
    vite: {
        plugins: [svgr(), agHotModuleReload()],
        server: {
            fs: {
                allow: [
                    '.',
                    // Nx root node modules - for hmr (hot module reloading)
                    '../../node_modules/astro/dist/runtime/client',
                ].concat(getDevFileList()),
            },
        },
    },
    integrations: [react(), markdoc(), agFileWatcher()],
});
