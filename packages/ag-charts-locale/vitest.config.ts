import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        root: new URL('.', import.meta.url).pathname,
        globals: true,
        include: ['src/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/dist/**'],
        reporters: process.env.CI
            ? ['default', ['junit', { outputFile: '../../reports/ag-charts-locale.xml' }]]
            : ['default'],
    },
});
