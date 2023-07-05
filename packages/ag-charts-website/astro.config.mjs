import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import svgr from 'vite-plugin-svgr';

// https://astro.build/config
export default defineConfig({
    outDir: '../../dist/packages/ag-charts-website',
    vite: {
        plugins: [svgr()],
    },
    integrations: [react(), markdoc()],
});
