// Captures a V8 CPU profile (.cpuprofile) of a benchmark example running in headless
// Chromium. Requires the website dev server to be running (see run-browser-benchmarks.sh
// for the env vars, or the benchmark-profile skill for the full workflow).
//
// Usage:
//   npx tsx tools/benchmark/profile-benchmark.ts --example high-volume-iso-datetime \
//       --test-cases initial-load --output reports/iso-initial.cpuprofile
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('base-url', {
            type: 'string',
            default: 'http://localhost:4601/charts',
            describe: 'Base URL of the dev server',
        })
        .option('example', {
            type: 'string',
            demandOption: true,
            describe: 'Benchmark example name (directory under benchmarks/_examples)',
        })
        .option('test-cases', {
            type: 'string',
            default: '',
            describe: 'Comma-separated test-case IDs from the example getBenchmarkConfig() (default: all)',
        })
        .option('output', {
            type: 'string',
            default: '',
            describe: 'Output .cpuprofile path (default: reports/<example>.cpuprofile)',
        })
        .option('sampling-interval-us', {
            type: 'number',
            default: 100,
            describe: 'Profiler sampling interval in microseconds',
        })
        .option('timeout', {
            type: 'number',
            default: 300_000,
            describe: 'Benchmark completion timeout in milliseconds',
        })
        .strict()
        .help()
        .parse();

    const out = argv.output || `reports/${argv.example}.cpuprofile`;
    const testCasesQuery = argv['test-cases'] ? `&testCases=${encodeURIComponent(argv['test-cases'])}` : '';
    const url = `${argv['base-url']}/vanilla/benchmarks/examples/${argv.example}?benchmark=true${testCasesQuery}`;

    const browser = await chromium.launch();
    let profile;
    let benchmarkError;
    let results;
    try {
        const context = await browser.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 2 });
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        await cdp.send('Profiler.enable');
        await cdp.send('Profiler.setSamplingInterval', { interval: argv['sampling-interval-us'] });
        await cdp.send('Profiler.start');

        console.log(`Navigating to ${url}`);
        await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
        await page.waitForFunction(() => (window as any).__benchmarkComplete === true, undefined, {
            timeout: argv.timeout,
            polling: 1_000,
        });

        ({ profile } = await cdp.send('Profiler.stop'));
        benchmarkError = await page.evaluate(() => (window as any).__benchmarkError);
        results = await page.evaluate(() => (window as any).__benchmarkResults);
    } finally {
        await browser.close();
    }

    if (benchmarkError) {
        console.error(`Benchmark reported an error: ${benchmarkError}`);
        process.exit(1);
    }

    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(profile));
    console.log(`Profile written to ${out}`);
    for (const r of results?.results ?? []) {
        console.log(`  ${r.testCase}: avg ${r.averageTime.toFixed(1)}ms over ${r.sampleCount} samples`);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
