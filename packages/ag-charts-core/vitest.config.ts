import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        root: new URL('.', import.meta.url).pathname,
        globals: true,
        environment: 'jsdom',
        include: ['src/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/dist/**', 'src/**/*Timezone.test.ts'],
        reporters: process.env.CI
            ? ['default', ['junit', { outputFile: '../../reports/ag-charts-core.xml' }]]
            : ['default'],
        env: {
            TZ: 'Europe/London',
        },
        alias: {
            'ag-charts-types': new URL('../ag-charts-types/src/main.ts', import.meta.url).pathname,
            'ag-charts-locale': new URL('../ag-charts-locale/src/main.ts', import.meta.url).pathname,
        },
    },
});
