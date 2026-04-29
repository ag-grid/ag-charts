import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

function rawTextPlugin(): Plugin {
    return {
        name: 'raw-text',
        transform(_code: string, id: string) {
            if (id.endsWith('.html') || id.endsWith('.css')) {
                const content = require('fs').readFileSync(id, 'utf-8');
                return { code: `export default ${JSON.stringify(content)};`, map: null };
            }
        },
    };
}

export default defineConfig({
    plugins: [rawTextPlugin()],
    esbuild: {
        tsconfigRaw: {
            compilerOptions: {
                experimentalDecorators: true,
                useDefineForClassFields: false,
            },
        },
    },
    test: {
        root: new URL('.', import.meta.url).pathname,
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/dist/**'],
        setupFiles: ['./vitest.setup.ts'],
        reporters: process.env.CI
            ? ['default', ['junit', { outputFile: '../../reports/ag-charts-server-side.xml' }]]
            : ['default'],
        pool: 'forks',
        poolOptions: {
            forks: {
                execArgv: ['--expose-gc'],
            },
        },
        alias: {
            'ag-charts-community': new URL('../ag-charts-community/src/main.ts', import.meta.url).pathname,
            'ag-charts-core': new URL('../ag-charts-core/src/main.ts', import.meta.url).pathname,
            'ag-charts-enterprise': new URL('../ag-charts-enterprise/src/main.ts', import.meta.url).pathname,
            'ag-charts-types': new URL('../ag-charts-types/src/main.ts', import.meta.url).pathname,
            'ag-charts-locale': new URL('../ag-charts-locale/src/main.ts', import.meta.url).pathname,
        },
    },
});
