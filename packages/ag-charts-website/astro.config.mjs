import markdoc from '@astrojs/markdoc';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import agCharts from './src/astro/integrations/agCharts';

const DEFAULT_BASE_URL = '/';
const { PUBLIC_SITE_URL, PUBLIC_BASE_URL = DEFAULT_BASE_URL } = loadEnv(process.env.NODE_ENV, process.cwd(), '');

const OUTPUT_DIR = '../../dist/packages/ag-charts-website';

console.log('Astro configuration', JSON.stringify({ PUBLIC_SITE_URL, PUBLIC_BASE_URL, OUTPUT_DIR }, null, 2));

// https://astro.build/config
export default defineConfig({
    site: PUBLIC_SITE_URL,
    base: PUBLIC_BASE_URL,
    outDir: OUTPUT_DIR,
    integrations: [react(), markdoc(), agCharts()],
});
