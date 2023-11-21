import markdoc from '@astrojs/markdoc';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import svgr from 'vite-plugin-svgr';

import agHotModuleReload from './src/astro/plugins/agHotModuleReload';
import { getDevFileList } from './src/utils/pages';
import { getSitemapConfig } from './src/utils/sitemap';

const DEFAULT_BASE_URL = '/';
const { PUBLIC_SITE_URL, PUBLIC_BASE_URL = DEFAULT_BASE_URL } = loadEnv(process.env.NODE_ENV, process.cwd(), '');

const OUTPUT_DIR = '../../dist/packages/ag-charts-website';

console.log('Astro configuration', JSON.stringify({ PUBLIC_SITE_URL, PUBLIC_BASE_URL, OUTPUT_DIR }, null, 2));

// https://astro.build/config
export default defineConfig({
    site: PUBLIC_SITE_URL,
    base: PUBLIC_BASE_URL,
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
    integrations: [react(), markdoc(), sitemap(getSitemapConfig())],
});
