/**
 * Server-Side Rendering Package Test
 *
 * This test verifies that the ag-charts-server-side package:
 * 1. Installs correctly from packed tarball
 * 2. All exports are available and typed correctly
 * 3. Basic chart rendering works in a Node.js environment
 * 4. Rendered images match expected snapshots
 */

import * as fs from 'fs';
import * as path from 'path';

import { AgChartsServerSide } from 'ag-charts-server-side';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { AllCommunityModule, ModuleRegistry } from 'ag-charts-community';
// Note: Enterprise is imported via require() at runtime to prevent watermark on community tests

interface TestResult {
    name: string;
    success: boolean;
    error?: string;
}

const results: TestResult[] = [];
const consoleMessages: { level: string; message: string }[] = [];
const updateSnapshots = process.argv.includes('--update');
const snapshotsDir = path.join(process.cwd(), 'e2e', 'basic-snapshots');
const outputDir = path.join(process.cwd(), 'output');

// Intercept console.warn and console.error to capture validation messages
const originalWarn = console.warn;
const originalError = console.error;
console.warn = (...args: any[]) => {
    const msg = String(args[0] ?? '');
    consoleMessages.push({ level: 'warn', message: msg });
    originalWarn(...args);
};
console.error = (...args: any[]) => {
    const msg = String(args[0] ?? '');
    consoleMessages.push({ level: 'error', message: msg });
    originalError(...args);
};

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const DEFAULT_TEST_TIMEOUT_MS = 5000; // 5 seconds

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, testName: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error(`Test "${testName}" timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        promise
            .then((result) => {
                clearTimeout(timeoutId);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
    });
}

async function runTest(name: string, fn: () => Promise<void>, timeoutMs = DEFAULT_TEST_TIMEOUT_MS): Promise<void> {
    try {
        await withTimeout(fn(), timeoutMs, name);
        results.push({ name, success: true });
        console.log(`  ✓ ${name}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ name, success: false, error: errorMessage });
        console.log(`  ✗ ${name}: ${errorMessage}`);
    }
}

function assertPngDimensions(buffer: Buffer, expectedWidth: number, expectedHeight: number): void {
    if (!buffer) {
        throw new Error('Buffer is null or undefined');
    }

    // Verify PNG magic bytes
    if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
        throw new Error('Invalid PNG magic bytes');
    }

    const png = PNG.sync.read(buffer);
    if (png.width !== expectedWidth || png.height !== expectedHeight) {
        throw new Error(`PNG dimensions incorrect: expected ${expectedWidth}x${expectedHeight}, got ${png.width}x${png.height}`);
    }
}

function assertMatchesSnapshot(actualBuffer: Buffer, snapshotName: string): void {
    const snapshotPath = path.join(snapshotsDir, `${snapshotName}.png`);
    const actualPath = path.join(outputDir, `${snapshotName}.png`);

    // Always write actual output for debugging
    fs.writeFileSync(actualPath, actualBuffer);

    if (updateSnapshots) {
        // In update mode, write the actual as the new expected
        if (!fs.existsSync(snapshotsDir)) {
            fs.mkdirSync(snapshotsDir, { recursive: true });
        }
        fs.writeFileSync(snapshotPath, actualBuffer);
        return;
    }

    if (!fs.existsSync(snapshotPath)) {
        throw new Error(`Snapshot not found: ${snapshotPath}. Run with --update to create it.`);
    }

    const expectedBuffer = fs.readFileSync(snapshotPath);
    const actual = PNG.sync.read(actualBuffer);
    const expected = PNG.sync.read(expectedBuffer);

    if (actual.width !== expected.width || actual.height !== expected.height) {
        throw new Error(
            `Dimension mismatch: actual ${actual.width}x${actual.height} vs expected ${expected.width}x${expected.height}`
        );
    }

    const { width, height } = actual;
    const diff = new PNG({ width, height });
    const numDiffPixels = pixelmatch(actual.data, expected.data, diff.data, width, height, { threshold: 0.1 });
    const diffPercent = (numDiffPixels * 100) / (width * height);

    if (diffPercent > 0.1) {
        // Write diff image for debugging
        const diffPath = path.join(outputDir, `${snapshotName}-diff.png`);
        fs.writeFileSync(diffPath, PNG.sync.write(diff));
        throw new Error(`Snapshot mismatch: ${diffPercent.toFixed(2)}% pixels different`);
    }
}

async function main() {
    console.log('Running Server-Side Rendering Package Tests...\n');

    if (updateSnapshots) {
        console.log('UPDATE MODE: Generating new snapshots\n');
    }

    ModuleRegistry.registerModules([AllCommunityModule]);

    // Test 1: Basic bar chart rendering with snapshot
    await runTest('Render bar chart to PNG', async () => {
        const buffer = await AgChartsServerSide.render({
            options: {
                data: [
                    { category: 'Q1', value: 10 },
                    { category: 'Q2', value: 25 },
                    { category: 'Q3', value: 15 },
                    { category: 'Q4', value: 30 },
                ],
                series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
            },
            width: 400,
            height: 300,
        });

        assertPngDimensions(buffer, 400, 300);
        assertMatchesSnapshot(buffer, 'bar-chart');
    });

    // Test 2: JPEG output format
    await runTest('Render chart to JPEG', async () => {
        const buffer = await AgChartsServerSide.render({
            options: {
                data: [{ x: 1, y: 2 }],
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            },
            width: 200,
            height: 150,
            format: 'jpeg',
        });

        if (!buffer || buffer.length < 100) {
            throw new Error(`Invalid buffer size: ${buffer?.length ?? 0}`);
        }

        // Verify JPEG magic bytes
        if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
            throw new Error('Invalid JPEG magic bytes');
        }

        // Write output for inspection (no snapshot comparison for JPEG)
        fs.writeFileSync(path.join(outputDir, 'jpeg-output.jpg'), buffer);
    });

    // Test 3: Line chart with snapshot
    await runTest('Render line chart', async () => {
        const buffer = await AgChartsServerSide.render({
            options: {
                data: [
                    { x: 0, y: 0 },
                    { x: 1, y: 5 },
                    { x: 2, y: 3 },
                    { x: 3, y: 8 },
                ],
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            },
            width: 300,
            height: 200,
        });

        assertPngDimensions(buffer, 300, 200);
        assertMatchesSnapshot(buffer, 'line-chart');
    });

    // Test 4: Pie chart with snapshot
    await runTest('Render pie chart', async () => {
        const buffer = await AgChartsServerSide.render({
            options: {
                data: [
                    { label: 'A', value: 30 },
                    { label: 'B', value: 50 },
                    { label: 'C', value: 20 },
                ],
                series: [{ type: 'pie', angleKey: 'value', legendItemKey: 'label' }],
            },
            width: 300,
            height: 300,
        });

        assertPngDimensions(buffer, 300, 300);
        assertMatchesSnapshot(buffer, 'pie-chart');
    });

    // Test 5: Area chart with snapshot
    await runTest('Render area chart', async () => {
        const buffer = await AgChartsServerSide.render({
            options: {
                data: [
                    { x: 0, y: 10 },
                    { x: 1, y: 25 },
                    { x: 2, y: 15 },
                ],
                series: [{ type: 'area', xKey: 'x', yKey: 'y' }],
            },
            width: 300,
            height: 200,
        });

        assertPngDimensions(buffer, 300, 200);
        assertMatchesSnapshot(buffer, 'area-chart');
    });

    // Test 6: High pixel ratio rendering with snapshot
    await runTest('Render with pixelRatio=2', async () => {
        const buffer = await AgChartsServerSide.render({
            options: {
                data: [
                    { x: 0, y: 0 },
                    { x: 1, y: 5 },
                    { x: 2, y: 3 },
                ],
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            },
            width: 200,
            height: 150,
            pixelRatio: 2,
        });

        // Verify that actual dimensions are 2x the logical dimensions
        assertPngDimensions(buffer, 400, 300);
        assertMatchesSnapshot(buffer, 'high-dpi-chart');
    });

    // Test 7: Concurrent rendering with distinct chart options
    await runTest('Concurrent rendering (5 charts)', async () => {
        // Use different data and dimensions to verify canvas isolation
        const renderConfigs = [
            {
                data: [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                ],
                width: 200,
                height: 150,
            },
            {
                data: [
                    { x: 1, y: 30 },
                    { x: 2, y: 40 },
                ],
                width: 250,
                height: 180,
            },
            {
                data: [
                    { x: 1, y: 50 },
                    { x: 2, y: 60 },
                    { x: 3, y: 70 },
                ],
                width: 300,
                height: 200,
            },
            {
                data: [
                    { x: 1, y: 5 },
                    { x: 2, y: 15 },
                    { x: 3, y: 25 },
                    { x: 4, y: 35 },
                ],
                width: 350,
                height: 220,
            },
            {
                data: [
                    { x: 1, y: 100 },
                    { x: 2, y: 80 },
                ],
                width: 180,
                height: 140,
            },
        ];

        const renderPromises = renderConfigs.map((config) =>
            AgChartsServerSide.render({
                options: {
                    data: config.data,
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                },
                width: config.width,
                height: config.height,
            })
        );

        const buffers = await Promise.all(renderPromises);

        // Verify each buffer matches its expected dimensions and snapshot
        for (let i = 0; i < buffers.length; i++) {
            const config = renderConfigs[i];
            assertPngDimensions(buffers[i], config.width, config.height);
            assertMatchesSnapshot(buffers[i], `concurrent-chart-${i}`);
        }
    });

    // =====================
    // Enterprise Tests
    // =====================
    console.log('\n--- Enterprise Tests ---\n');

    // Load enterprise at runtime to avoid watermark on community tests above
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AllEnterpriseModule, LicenseManager } = require('ag-charts-enterprise');

    // Register enterprise modules for enterprise-specific tests
    ModuleRegistry.registerModules([AllEnterpriseModule]);

    // Test 8: Unlicensed enterprise shows watermark
    await runTest('Enterprise unlicensed shows watermark', async () => {
        // Ensure no license is set
        LicenseManager.setLicenseKey(undefined);

        const buffer = await AgChartsServerSide.render({
            options: {
                data: [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                    { x: 3, y: 15 },
                ],
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            },
            width: 400,
            height: 300,
        });

        assertPngDimensions(buffer, 400, 300);
        assertMatchesSnapshot(buffer, 'enterprise-unlicensed-watermark');
    });

    // Test 9: Waterfall chart (enterprise-only series)
    await runTest('Render waterfall chart', async () => {
        const buffer = await AgChartsServerSide.render({
            options: {
                data: [
                    { category: 'Start', value: 100 },
                    { category: 'Add', value: 50 },
                    { category: 'Subtract', value: -30 },
                    { category: 'End', value: 120 },
                ],
                series: [{ type: 'waterfall', xKey: 'category', yKey: 'value' }],
            },
            width: 400,
            height: 300,
        });

        assertPngDimensions(buffer, 400, 300);
        assertMatchesSnapshot(buffer, 'enterprise-waterfall');
    });

    // Test 10: Heatmap (enterprise-only series)
    await runTest('Render heatmap chart', async () => {
        const buffer = await AgChartsServerSide.render({
            options: {
                data: [
                    { x: 'A', y: '1', value: 10 },
                    { x: 'A', y: '2', value: 20 },
                    { x: 'B', y: '1', value: 30 },
                    { x: 'B', y: '2', value: 40 },
                ],
                series: [{ type: 'heatmap', xKey: 'x', yKey: 'y', colorKey: 'value', colorRange: ['#c7e9c0', '#00441b'] }],
            },
            width: 400,
            height: 300,
        });

        assertPngDimensions(buffer, 400, 300);
        assertMatchesSnapshot(buffer, 'enterprise-heatmap');
    });

    // Test 11: Radial gauge (enterprise-only, uses renderGauge)
    await runTest('Render radial gauge', async () => {
        const buffer = await AgChartsServerSide.renderGauge({
            options: {
                type: 'radial-gauge',
                value: 75,
                startAngle: 270,
                endAngle: 450,
                innerRadiusRatio: 0.8,
                scale: { min: 0, max: 100, fill: '#e6e6e6' },
                bar: { fill: '#00b0f0' },
            },
            width: 300,
            height: 300,
        });

        assertPngDimensions(buffer, 300, 300);
        assertMatchesSnapshot(buffer, 'enterprise-radial-gauge');
    });

    // Test 12: Linear gauge (enterprise-only, uses renderGauge)
    await runTest('Render linear gauge', async () => {
        const buffer = await AgChartsServerSide.renderGauge({
            options: {
                type: 'linear-gauge',
                value: 60,
                thickness: 50,
                scale: { min: 0, max: 100, fill: '#e6e6e6' },
                bar: { fill: '#00b0f0' },
            },
            width: 400,
            height: 100,
        });

        assertPngDimensions(buffer, 400, 100);
        assertMatchesSnapshot(buffer, 'enterprise-linear-gauge');
    });

    // Test 13: Financial chart (enterprise-only, uses renderFinancialChart)
    await runTest('Render financial chart', async () => {
        const buffer = await AgChartsServerSide.renderFinancialChart({
            options: {
                data: [
                    { date: new Date('2024-01-02'), open: 150, high: 155, low: 148, close: 153, volume: 1000 },
                    { date: new Date('2024-01-03'), open: 153, high: 158, low: 151, close: 157, volume: 1200 },
                    { date: new Date('2024-01-04'), open: 157, high: 160, low: 154, close: 155, volume: 900 },
                    { date: new Date('2024-01-05'), open: 155, high: 162, low: 153, close: 161, volume: 1100 },
                    { date: new Date('2024-01-08'), open: 161, high: 165, low: 159, close: 163, volume: 1300 },
                ],
            },
            width: 600,
            height: 400,
        });

        assertPngDimensions(buffer, 600, 400);
        assertMatchesSnapshot(buffer, 'enterprise-financial-chart');
    });

    // Summary
    console.log('\n--- Test Summary ---');
    const passed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    console.log(`Passed: ${passed}/${results.length}`);
    console.log(`Failed: ${failed}/${results.length}`);

    if (failed > 0) {
        console.log('\nFailed tests:');
        for (const result of results.filter((r) => !r.success)) {
            console.log(`  - ${result.name}: ${result.error}`);
        }
        process.exit(1);
    }

    if (updateSnapshots) {
        console.log(`\nSnapshots updated in: ${snapshotsDir}`);
    }

    // Check for unexpected console warnings/errors (excluding license messages)
    const unexpected = consoleMessages.filter(({ message }) => !message.startsWith('*'));
    if (unexpected.length > 0) {
        console.log('\n--- Console Warnings/Errors ---');
        for (const { level, message } of unexpected) {
            console.log(`  [${level}] ${message}`);
        }
        console.log(`\n${unexpected.length} unexpected console message(s) detected`);
        process.exit(1);
    }
}

main().catch((err) => {
    originalError('Test runner failed:', err);
    process.exit(1);
});
