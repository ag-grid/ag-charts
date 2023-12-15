import markdoc from '@astrojs/markdoc';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import dotenvExpand from 'dotenv-expand';
import * as fs from 'fs/promises';
import { loadEnv } from 'vite';
import mkcert from 'vite-plugin-mkcert';
import svgr from 'vite-plugin-svgr';

import agHotModuleReload from './plugins/agHotModuleReload';
import { getDevFileList } from './src/utils/pages';
import { getSitemapConfig } from './src/utils/sitemap';

const { NODE_ENV } = process.env;

const DEFAULT_BASE_URL = '/';
const dotenv = {
    parsed: loadEnv(NODE_ENV, process.cwd(), ''),
};
const {
    PORT,
    PUBLIC_SITE_URL,
    PUBLIC_BASE_URL = DEFAULT_BASE_URL,
    PUBLIC_HTTPS_SERVER = '1',
} = dotenvExpand.expand(dotenv).parsed;

const OUTPUT_DIR = '../../dist/packages/ag-charts-website';

console.log(
    'Astro configuration',
    JSON.stringify({ NODE_ENV, PORT, PUBLIC_SITE_URL, PUBLIC_BASE_URL, OUTPUT_DIR }, null, 2)
);

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
            exclude: [
                'ag-charts-angular',
                'ag-charts-community',
                'ag-charts-enterprise',
                'ag-charts-react',
                'ag-charts-vue',
                'ag-charts-vue3',
            ],
        },
        server: {
            https: !['0', 'false'].includes(PUBLIC_HTTPS_SERVER),
            fs: {
                allow: ['.'].concat(getDevFileList()),
            },
        },
    },
    integrations: [react(), markdoc(), sitemap(getSitemapConfig())],
});
