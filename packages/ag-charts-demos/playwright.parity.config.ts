import { type ReporterDescription, defineConfig, devices } from '@playwright/test';
import { relative } from 'node:path';

import { DISCOVER, SELF_PARITY, SELF_PARITY_PORTS, discoverPorts } from './e2e/parity/targets';

// Pixel-parity run: e2e/parity/parity.spec.ts compares each framework port against the React
// reference, live, in deterministic mode. See e2e/parity/README.md for the environment variables,
// the states compared and the summary this run writes.
//
// Run through Nx so the reference is built first: `yarn nx test:e2e:parity ag-charts-demos`.

const CI = !!process.env.CI;

/** A `vite preview` of the built React app (dist/) on `port`. */
const preview = (port: number) => ({
    command: `npx vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !CI,
    timeout: 120_000,
});

/** The dependency-free static server in e2e/parity, on a discovered port's built `dist`. */
const serveDist = (distDir: string, port: number) => ({
    command: `node e2e/parity/serve-dist.mjs --dir "${relative(__dirname, distDir)}" --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !CI,
    timeout: 30_000,
});

// Serve only what nothing else serves. Self-parity needs the React app twice; a run against real
// ports (PARITY_TARGETS) is handed served ports and needs just the reference; a discovery run
// (PARITY_DISCOVER=1) serves every committed port's dist itself. The reference is served here
// unless PARITY_REFERENCE_URL points at one served elsewhere.
const reference = process.env.PARITY_REFERENCE_URL ? [] : [preview(SELF_PARITY_PORTS.reference)];
const webServer = SELF_PARITY
    ? [...reference, preview(SELF_PARITY_PORTS.port)]
    : DISCOVER
      ? [...reference, ...discoverPorts().map((port) => serveDist(port.distDir, port.port))]
      : reference;

const reporter: ReporterDescription[] = [['./e2e/parity/summary-reporter.ts'], ['line']];
if (CI) reporter.push(['junit', { outputFile: '../../reports/ag-charts-demos-parity.xml' }]);

export default defineConfig({
    testDir: './e2e/parity',
    outputDir: './test-results/parity',
    // Two full loads of the heaviest demo, driven to a state and settled, well inside this.
    timeout: 120_000,
    fullyParallel: true,
    forbidOnly: CI,
    retries: CI ? 1 : 0,
    workers: CI ? 2 : undefined,
    reporter,
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: webServer.length > 0 ? webServer : undefined,
});
