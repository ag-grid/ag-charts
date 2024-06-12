import markdoc from '@astrojs/markdoc';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import dotenvExpand from 'dotenv-expand';
import * as sass from 'sass';
import { loadEnv } from 'vite';
import mkcert from 'vite-plugin-mkcert';
import svgr from 'vite-plugin-svgr';

import agHotModuleReload from './plugins/agHotModuleReload';
import agHtaccessGen from './plugins/agHtaccessGen';
import { getSitemapConfig } from './src/utils/sitemap';
import { urlWithBaseUrl } from './src/utils/urlWithBaseUrl';

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
    PUBLIC_GALLERY_IMAGE_DPR_ENHANCEMENT,
    HTACCESS = 'false',
    WATCH_INTEGRATION = 'true',
} = dotenvExpand.expand(dotenv).parsed;

const OUTPUT_DIR = '../../dist/packages/ag-charts-website';

console.log(
    'Astro configuration',
    JSON.stringify(
        {
            NODE_ENV,
            PORT,
            PUBLIC_SITE_URL,
            PUBLIC_BASE_URL,
            OUTPUT_DIR,
            PUBLIC_GALLERY_IMAGE_DPR_ENHANCEMENT,
            HTACCESS,
            WATCH_INTEGRATION,
        },
        null,
        2
    )
);

// https://astro.build/config
export default defineConfig({
    site: PUBLIC_SITE_URL,
    base: PUBLIC_BASE_URL,
    outDir: OUTPUT_DIR,
    devToolbar: {
        enabled: false,
    },
    vite: {
        plugins: [mkcert(), svgr(), agHotModuleReload(Boolean(WATCH_INTEGRATION))],
        resolve: {
            conditions: ['require'],
        },
        optimizeDeps: {
            exclude: [
                'ag-charts-angular',
                'ag-charts-community',
                'ag-charts-enterprise',
                'ag-charts-types',
                'ag-charts-react',
                'ag-charts-vue3',
            ],
        },
        server: {
            https: !['0', 'false'].includes(PUBLIC_HTTPS_SERVER),
        },
        css: {
            preprocessorOptions: {
                scss: {
                    functions: {
                        'urlWithBaseUrl($url)': function (url) {
                            const urlWithBase = urlWithBaseUrl(url.getValue(), PUBLIC_BASE_URL);

                            return new sass.types.String(urlWithBase);
                        },
                    },
                    includePaths: ['../../external/ag-website-shared/src'],
                },
            },
        },
    },
    integrations: [react(), markdoc(), sitemap(getSitemapConfig()), agHtaccessGen({ include: HTACCESS === 'true' })],
});
