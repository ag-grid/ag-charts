import markdoc from '@astrojs/markdoc';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import svgr from 'vite-plugin-svgr';
import agHotModuleReload from './src/astro/plugins/agHotModuleReload';
import { getDevFileList } from './src/utils/pages';

const SITE_URL = process?.env?.SITE_URL;

const DEFAULT_SITE_BASE_URL = '/';
const SITE_BASE_URL = process?.env?.SITE_BASE_URL || DEFAULT_SITE_BASE_URL;

const OUTPUT_DIR = '../../dist/packages/ag-charts-website';

console.log('Astro configuration', JSON.stringify({ SITE_URL, SITE_BASE_URL, OUTPUT_DIR }, null, 2));

// https://astro.build/config
export default defineConfig({
    site: SITE_URL,
    base: SITE_BASE_URL,
    outDir: OUTPUT_DIR,
    vite: {
        plugins: [svgr(), agHotModuleReload()],
        resolve: {
            conditions: ['require'],
        },
        optimizeDeps: {
            exclude: ['ag-charts-community', 'ag-charts-enterprise'],
        },
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
    integrations: [react(), markdoc()],
});
