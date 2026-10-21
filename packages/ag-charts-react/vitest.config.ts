import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

function rawTextPlugin(): Plugin {
    return {
        name: 'raw-text',
        transform(_code: string, id: string) {
            if (id.endsWith('.html') || id.endsWith('.css')) {
                return { code: `export default ${JSON.stringify(readFileSync(id, 'utf-8'))};`, map: null };
            }
        },
    };
}

export default defineConfig({
    plugins: [rawTextPlugin()],
    esbuild: {
        keepNames: true,
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
        environment: 'jsdom',
        include: ['src/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/dist/**'],
        // Charts are rendered through the enterprise modules, so they need its canvas mocks and module registration.
        setupFiles: [new URL('../ag-charts-enterprise/vitest.setup.ts', import.meta.url).pathname],
        reporters: process.env.CI
            ? ['default', ['junit', { outputFile: '../../reports/ag-charts-react.xml' }]]
            : ['default'],
        retry: 0,
        alias: {
            'ag-charts-community': new URL('../ag-charts-community/src/main.ts', import.meta.url).pathname,
            'ag-charts-enterprise': new URL('../ag-charts-enterprise/src/main.ts', import.meta.url).pathname,
            'ag-charts-types': new URL('../ag-charts-types/src/main.ts', import.meta.url).pathname,
            'ag-charts-locale': new URL('../ag-charts-locale/src/main.ts', import.meta.url).pathname,
            'ag-charts-community-test': new URL('../ag-charts-community/src/main-test.ts', import.meta.url).pathname,
        },
        pool: 'forks',
    },
});
