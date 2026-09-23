import { type ReporterDescription, defineConfig, devices } from '@playwright/test';
import { relative } from 'node:path';

import { DISCOVER, RUN_KIND, SELF_PARITY, SELF_PARITY_PORTS, discoverParityPorts } from './e2e/parity/targets';

// Pixel-parity run: e2e/parity/parity.spec.ts compares each framework port against the React
// reference, live, in deterministic mode. See e2e/parity/README.md for the environment variables,
// the states compared and the summary this run writes.
//
// Run through Nx so the reference is built first: `yarn nx test:e2e:parity ag-charts-demos`.

const CI = !!process.env.CI;

// Never reused: whatever already answers on one of these ports may be another checkout's build, and
// comparing against it would pass or fail for reasons unrelated to this tree. A busy port fails the
// run instead; the PARITY_*_PORT variables in targets.ts move the ports.
const REUSE_EXISTING_SERVER = false;

/** A `vite preview` of the built React app (dist/) on `port`. */
const preview = (port: number) => ({
    command: `npx vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: REUSE_EXISTING_SERVER,
    timeout: 120_000,
});

/** The dependency-free static server in e2e/parity, on a discovered port's built `dist`. */
const serveDist = (distDir: string, port: number) => ({
    command: `node e2e/parity/serve-dist.mjs --dir "${relative(__dirname, distDir)}" --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: REUSE_EXISTING_SERVER,
    timeout: 30_000,
});

// Serve only what nothing else serves. Self-parity needs the React app twice; a run against real
// ports (PARITY_TARGETS) is handed served ports and needs just the reference; a discovery run
// (PARITY_DISCOVER=1) serves the dist of every committed port that is not stale itself, and
// nothing at all when every port is stale. The reference is served here unless
// PARITY_REFERENCE_URL points at one served elsewhere.
function webServers() {
    const reference = process.env.PARITY_REFERENCE_URL ? [] : [preview(SELF_PARITY_PORTS.reference)];
    if (SELF_PARITY) return [...reference, preview(SELF_PARITY_PORTS.port)];
    if (DISCOVER) {
        const { ports } = discoverParityPorts();
        if (ports.length === 0) return [];
        return [...reference, ...ports.map((port) => serveDist(port.distDir, port.port))];
    }
    return reference;
}
const webServer = webServers();

const reporter: ReporterDescription[] = [['./e2e/parity/summary-reporter.ts'], ['line']];
if (CI) reporter.push(['junit', { outputFile: `../../reports/ag-charts-demos-${RUN_KIND}.xml` }]);

export default defineConfig({
    testDir: './e2e/parity',
    // compare.test.ts beside the spec is a Vitest unit test.
    testMatch: '*.spec.ts',
    outputDir: `./test-results/parity-${RUN_KIND}`,
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
