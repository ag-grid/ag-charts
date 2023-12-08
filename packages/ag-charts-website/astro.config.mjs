import markdoc from '@astrojs/markdoc';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import mkcert from 'vite-plugin-mkcert';
import svgr from 'vite-plugin-svgr';

import agHotModuleReload from './src/astro/plugins/agHotModuleReload';
import { getDevFileList } from './src/utils/pages';
import { getSitemapConfig } from './src/utils/sitemap';

const { NODE_ENV } = process.env;

const DEFAULT_BASE_URL = '/';
const {
    PUBLIC_SITE_URL,
    PUBLIC_BASE_URL = DEFAULT_BASE_URL,
    PUBLIC_HTTPS_SERVER = '1',
} = loadEnv(NODE_ENV, process.cwd(), '');

const OUTPUT_DIR = '../../dist/packages/ag-charts-website';

console.log('Astro configuration', JSON.stringify({ NODE_ENV, PUBLIC_SITE_URL, PUBLIC_BASE_URL, OUTPUT_DIR }, null, 2));

// https://astro.build/config
export default defineConfig({
    site: PUBLIC_SITE_URL,
    base: PUBLIC_BASE_URL,
    outDir: OUTPUT_DIR,
    vite: {
        plugins: [mkcert(), svgr(), agHotModuleReload()],
        resolve: {
            conditions: ['require'],
        },
        optimizeDeps: {
            exclude: ['ag-charts-community', 'ag-charts-enterprise'],
        },
        server: {
            https: !['0', 'false'].includes(PUBLIC_HTTPS_SERVER),
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
