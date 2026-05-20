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
        exclude: ['**/node_modules/**', '**/dist/**', '**/benchmarks/**'],
        setupFiles: ['./vitest.setup.ts'],
        reporters: process.env.CI
            ? ['default', ['junit', { outputFile: '../../reports/ag-charts-community.xml' }]]
            : ['default'],
        retry: 0,
        testTimeout: 30_000,
        env: {
            TZ: 'Europe/London',
        },
        alias: {
            'ag-charts-types': new URL('../ag-charts-types/src/main.ts', import.meta.url).pathname,
            'ag-charts-locale': new URL('../ag-charts-locale/src/main.ts', import.meta.url).pathname,
        },
        pool: 'forks',
        poolOptions: {
            forks: {
                execArgv: ['--expose-gc'],
            },
        },
    },
});
