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

interface TestResult {
    name: string;
    success: boolean;
    error?: string;
}

const results: TestResult[] = [];
const updateSnapshots = process.argv.includes('--update');
const snapshotsDir = path.join(process.cwd(), 'snapshots');
const outputDir = path.join(process.cwd(), 'output');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
    try {
        await fn();
        results.push({ name, success: true });
        console.log(`  ✓ ${name}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ name, success: false, error: errorMessage });
        console.log(`  ✗ ${name}: ${errorMessage}`);
    }
}

function compareImages(actualBuffer: Buffer, snapshotName: string): { pass: boolean; diffPercent: number } {
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
        return { pass: true, diffPercent: 0 };
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
    }

    return { pass: diffPercent <= 0.1, diffPercent };
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

        if (!buffer || buffer.length < 1000) {
            throw new Error(`Invalid buffer size: ${buffer?.length ?? 0}`);
        }

        // Verify PNG magic bytes
        if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
            throw new Error('Invalid PNG magic bytes');
        }

        const { pass, diffPercent } = compareImages(buffer, 'bar-chart');
        if (!pass) {
            throw new Error(`Snapshot mismatch: ${diffPercent.toFixed(2)}% pixels different`);
        }

        // Also write output.png for backwards compatibility
        fs.writeFileSync('output.png', buffer);
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

        if (!buffer || buffer.length < 1000) {
            throw new Error(`Invalid buffer size: ${buffer?.length ?? 0}`);
        }

        const { pass, diffPercent } = compareImages(buffer, 'line-chart');
        if (!pass) {
            throw new Error(`Snapshot mismatch: ${diffPercent.toFixed(2)}% pixels different`);
        }
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

        if (!buffer || buffer.length < 1000) {
            throw new Error(`Invalid buffer size: ${buffer?.length ?? 0}`);
        }

        const { pass, diffPercent } = compareImages(buffer, 'pie-chart');
        if (!pass) {
            throw new Error(`Snapshot mismatch: ${diffPercent.toFixed(2)}% pixels different`);
        }
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

        if (!buffer || buffer.length < 1000) {
            throw new Error(`Invalid buffer size: ${buffer?.length ?? 0}`);
        }

        const { pass, diffPercent } = compareImages(buffer, 'area-chart');
        if (!pass) {
            throw new Error(`Snapshot mismatch: ${diffPercent.toFixed(2)}% pixels different`);
        }
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

        if (!buffer || buffer.length < 1000) {
            throw new Error(`Invalid buffer size: ${buffer?.length ?? 0}`);
        }

        const { pass, diffPercent } = compareImages(buffer, 'high-dpi-chart');
        if (!pass) {
            throw new Error(`Snapshot mismatch: ${diffPercent.toFixed(2)}% pixels different`);
        }
    });

    // Test 7: Concurrent rendering
    await runTest('Concurrent rendering (5 charts)', async () => {
        const renderPromises = Array.from({ length: 5 }, (_, i) =>
            AgChartsServerSide.render({
                options: {
                    data: [
                        { x: 0, y: i * 10 },
                        { x: 1, y: i * 15 },
                    ],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                },
                width: 200,
                height: 150,
            })
        );

        const buffers = await Promise.all(renderPromises);

        for (let i = 0; i < buffers.length; i++) {
            if (!buffers[i] || buffers[i].length < 100) {
                throw new Error(`Chart ${i} failed: invalid buffer size`);
            }
        }
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
}

main().catch((err) => {
    console.error('Test runner failed:', err);
    process.exit(1);
});
