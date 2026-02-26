/* eslint-disable no-console */
/**
 * Browser-based benchmark runner using Playwright.
 *
 * Launches headless Chromium, navigates to each benchmark example on the dev server,
 * waits for completion, extracts structured results, and writes a combined JSON report.
 *
 * Usage:
 *   npx tsx tools/benchmark/browser-benchmark.ts [options]
 *
 * Requires a running dev server (yarn nx dev) or use the CI wrapper script.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const EXAMPLES_DIR = path.resolve(__dirname, '../../packages/ag-charts-website/src/content/docs/benchmarks/_examples');

// Examples that don't use the standard benchmark harness
const EXCLUDED_EXAMPLES = new Set([
    'summary', // Static comparison dashboard — no getBenchmarkConfig()
    'high-freq-high-volume', // Streaming demo using animation-loop pattern — no initBenchmark()
]);

interface BenchmarkExampleResult {
    status: 'success' | 'error' | 'timeout';
    data?: Record<string, unknown>;
    error?: string;
    durationMs: number;
}

interface BenchmarkReport {
    timestamp: string;
    environment: {
        viewport: { width: number; height: number };
        devicePixelRatio: number;
        browser: string;
    };
    summary: {
        total: number;
        success: number;
        error: number;
        timeout: number;
        totalDurationMs: number;
    };
    examples: Record<string, BenchmarkExampleResult>;
}

function discoverExamples(): string[] {
    const entries = fs.readdirSync(EXAMPLES_DIR, { withFileTypes: true });
    return entries
        .filter((e) => e.isDirectory() && !EXCLUDED_EXAMPLES.has(e.name))
        .map((e) => e.name)
        .sort();
}

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('base-url', {
            type: 'string',
            default: 'https://localhost:4600/charts',
            describe: 'Base URL of the dev server',
        })
        .option('output', {
            type: 'string',
            default: 'reports/browser-benchmarks/results.json',
            describe: 'Output file path for the combined JSON report',
        })
        .option('examples', {
            type: 'string',
            default: '',
            describe: 'Comma-separated list of example names to run (default: all)',
        })
        .option('timeout', {
            type: 'number',
            default: 300_000,
            describe: 'Per-example timeout in milliseconds',
        })
        .option('viewport', {
            type: 'string',
            default: '800x600',
            describe: 'Viewport dimensions (WxH)',
        })
        .option('dpr', {
            type: 'number',
            default: 2,
            describe: 'Device pixel ratio',
        })
        .strict()
        .help()
        .parse();

    const [vpWidth, vpHeight] = argv.viewport.split('x').map(Number);
    if (!vpWidth || !vpHeight) {
        console.error(`Invalid viewport format: ${argv.viewport}. Expected WxH (e.g. 800x600)`);
        process.exit(1);
    }

    // Discover and filter examples
    let exampleNames = discoverExamples();
    if (argv.examples) {
        const filter = new Set(argv.examples.split(',').map((s) => s.trim()));
        const unknown = [...filter].filter((name) => !exampleNames.includes(name));
        if (unknown.length > 0) {
            console.error(`Unknown example(s): ${unknown.join(', ')}`);
            console.error(`Available: ${exampleNames.join(', ')}`);
            process.exit(1);
        }
        exampleNames = exampleNames.filter((name) => filter.has(name));
    }

    console.log(`Running ${exampleNames.length} benchmark example(s)`);
    console.log(`Base URL: ${argv['base-url']}`);
    console.log(`Viewport: ${vpWidth}x${vpHeight} @ ${argv.dpr}x DPR`);
    console.log(`Timeout: ${argv.timeout}ms per example`);
    console.log();

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: vpWidth, height: vpHeight },
        deviceScaleFactor: argv.dpr,
    });

    const report: BenchmarkReport = {
        timestamp: new Date().toISOString(),
        environment: {
            viewport: { width: vpWidth, height: vpHeight },
            devicePixelRatio: argv.dpr,
            browser: 'chromium',
        },
        summary: { total: exampleNames.length, success: 0, error: 0, timeout: 0, totalDurationMs: 0 },
        examples: {},
    };

    const overallStart = Date.now();

    for (const name of exampleNames) {
        const url = `${argv['base-url']}/vanilla/benchmarks/examples/${name}?benchmark=true`;
        console.log(`[${name}] Navigating to ${url}`);

        const page = await context.newPage();
        const pageErrors: string[] = [];
        page.on('pageerror', (err) => pageErrors.push(String(err)));

        const exampleStart = Date.now();
        let result: BenchmarkExampleResult;

        try {
            const response = await page.goto(url, { waitUntil: 'load', timeout: 30_000 });
            if (!response || response.status() >= 400) {
                throw new Error(`HTTP ${response?.status() ?? 'no response'} for ${url}`);
            }

            // Wait for benchmark completion
            await page.waitForFunction(() => (window as any).__benchmarkComplete === true, undefined, {
                timeout: argv.timeout,
                polling: 1_000,
            });

            // Extract results
            const benchmarkError = await page.evaluate(() => (window as any).__benchmarkError);
            if (benchmarkError) {
                result = {
                    status: 'error',
                    error: benchmarkError,
                    durationMs: Date.now() - exampleStart,
                };
            } else {
                const data = await page.evaluate(() => (window as any).__benchmarkResults);
                result = {
                    status: 'success',
                    data,
                    durationMs: Date.now() - exampleStart,
                };
            }
        } catch (error: unknown) {
            const isTimeout =
                error instanceof Error && (error.message.includes('Timeout') || error.name === 'TimeoutError');
            result = {
                status: isTimeout ? 'timeout' : 'error',
                error: String(error),
                durationMs: Date.now() - exampleStart,
            };
        }

        if (pageErrors.length > 0) {
            result.error = [result.error, ...pageErrors.map((e) => `[page error] ${e}`)].filter(Boolean).join('\n');
            if (result.status === 'success') {
                // Page errors during a "success" run are notable but don't change status
                console.warn(`[${name}] Completed with page errors: ${pageErrors.length}`);
            }
        }

        report.examples[name] = result;
        report.summary[result.status]++;

        const statusIcon = result.status === 'success' ? '\u2713' : result.status === 'timeout' ? '\u23F1' : '\u2717';
        const duration = (result.durationMs / 1000).toFixed(1);
        console.log(`[${name}] ${statusIcon} ${result.status} (${duration}s)`);

        if (result.status !== 'success') {
            console.error(`[${name}] ${result.error}`);
        }

        await page.close();
    }

    report.summary.totalDurationMs = Date.now() - overallStart;

    await browser.close();

    // Write report
    const outputPath = path.resolve(argv.output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');

    console.log();
    console.log(`Report written to ${outputPath}`);
    console.log(
        `Summary: ${report.summary.success} success, ${report.summary.error} error, ${report.summary.timeout} timeout (${(report.summary.totalDurationMs / 1000).toFixed(1)}s total)`
    );

    // Exit with non-zero if any failures
    if (report.summary.error > 0 || report.summary.timeout > 0) {
        process.exit(1);
    }
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(2);
});
