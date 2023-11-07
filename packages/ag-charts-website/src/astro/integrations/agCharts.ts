import type { AstroIntegration } from 'astro';
import { spawnSync } from 'child_process';
import svgr from 'vite-plugin-svgr';

import { getDevFileList } from '../../utils/pages';
import agHotModuleReload from '../plugins/agHotModuleReload';

export default function agCharts(): AstroIntegration {
    return {
        name: 'ag-charts',
        hooks: {
            'astro:config:setup': ({ updateConfig }) => {
                // eslint-disable-next-line no-console
                console.log('astro:config:setup');

                updateConfig({
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
                });
            },
            'astro:build:done': () => {
                // eslint-disable-next-line no-console
                console.log('astro:build:done');

                const start = performance.now();
                spawnSync(
                    'npx',
                    [
                        'prettier',
                        './dist/packages/ag-charts-website/**/examples/**/*.{html,js,ts,jsx,tsx}',
                        '--write',
                        '--ignore-path',
                        './dist/.prettierignore',
                        '--log-level',
                        'error',
                    ],
                    { stdio: 'inherit' }
                );

                // eslint-disable-next-line no-console
                console.log(`Finished prettier formatting in ${performance.now() - start}ms`);
            },
        },
    };
}
