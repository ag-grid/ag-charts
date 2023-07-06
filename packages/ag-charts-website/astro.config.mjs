import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import svgr from 'vite-plugin-svgr';
import agFileWatcher from './src/astro/integrations/agFileWatcher';
import agHotModuleReload from './src/astro/plugins/agHotModuleReload';
import { getDevFileList } from './src/utils/pages';

// https://astro.build/config
export default defineConfig({
    outDir: '../../dist/packages/ag-charts-website',
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
