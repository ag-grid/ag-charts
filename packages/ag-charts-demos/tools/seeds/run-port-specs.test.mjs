import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_PORT_BASE, describePortRun, main, readPlan, summarise } from './run-port-specs.mjs';

const WORKSPACE = resolve('/workspace');

const entry = (demo, framework, dist = `packages/ag-charts-demos/seeds/${demo}/${framework}/dist`) => ({
    demo,
    framework,
    dist,
    grep: demo,
});

let root;

beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'run-port-specs-'));
});
afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    rmSync(root, { recursive: true, force: true });
});

describe('describePortRun', () => {
    const describeRun = (port, options = {}) =>
        describePortRun(entry('procurement', 'angular'), { port, workspaceRoot: WORKSPACE, ...options });

    it('names the port by demo and framework', () => {
        expect(describeRun(4810).name).toBe('procurement/angular');
    });

    it("serves the port's own dist, on the port it is given, and points the specs at it", () => {
        const run = describeRun(4812);

        expect(run.distDir).toBe(resolve(WORKSPACE, 'packages/ag-charts-demos/seeds/procurement/angular/dist'));
        expect(run.baseURL).toBe('http://localhost:4812');
        expect(run.serveArgs).toEqual(['--dir', run.distDir, '--port', '4812']);
        expect(run.env.DEMOS_BASE_URL).toBe('http://localhost:4812');
    });

    it("runs only the port's demo's specs", () => {
        const { playwrightArgs } = describePortRun(entry('web-analytics', 'vue'), {
            port: 4810,
            workspaceRoot: WORKSPACE,
        });

        expect(playwrightArgs.slice(0, 4)).toEqual(['playwright', 'test', '-g', 'web-analytics']);
    });

    it('appends the extra Playwright arguments after its own', () => {
        const { playwrightArgs } = describeRun(4810, { extraArgs: ['--retries=0', '--reporter=line'] });

        expect(playwrightArgs.slice(-2)).toEqual(['--retries=0', '--reporter=line']);
    });

    it("keeps each port's results and report apart from every other port's", () => {
        const runs = [
            describePortRun(entry('procurement', 'angular'), { port: 4810, workspaceRoot: WORKSPACE }),
            describePortRun(entry('procurement', 'vue'), { port: 4811, workspaceRoot: WORKSPACE }),
            describePortRun(entry('trading-terminal', 'angular'), { port: 4812, workspaceRoot: WORKSPACE }),
        ];

        const outputs = runs.map((run) => run.playwrightArgs[run.playwrightArgs.indexOf('--output') + 1]);
        const reports = runs.map((run) => run.env.PLAYWRIGHT_JUNIT_OUTPUT_FILE);
        expect(new Set(outputs).size).toBe(3);
        expect(new Set(reports).size).toBe(3);
        expect(outputs[0]).toContain('procurement-angular');
        expect(reports[2]).toContain('trading-terminal-angular');
    });
});

describe('summarise', () => {
    it('says there is nothing to run for an empty plan', () => {
        expect(summarise([])).toEqual(['No ports to run the functional specs against.']);
    });

    it('reports every port passing', () => {
        expect(
            summarise([
                { name: 'procurement/angular', ok: true },
                { name: 'procurement/vue', ok: true },
            ])
        ).toEqual([
            'Functional specs per framework port:',
            '  PASS  procurement/angular',
            '  PASS  procurement/vue',
            'All 2 port(s) passed.',
        ]);
    });

    it('names each failed port by demo and framework, with its reason', () => {
        const lines = summarise([
            { name: 'procurement/angular', ok: true },
            { name: 'trading-terminal/vue', ok: false, reason: 'playwright exited with 1' },
        ]);

        expect(lines).toContain('  PASS  procurement/angular');
        expect(lines).toContain('  FAIL  trading-terminal/vue (playwright exited with 1)');
        expect(lines.at(-1)).toBe('1 of 2 port(s) failed: trading-terminal/vue');
    });
});

describe('readPlan', () => {
    it('reads the ports to run from a plan', () => {
        const path = join(root, 'plan.json');
        writeFileSync(path, JSON.stringify({ run: [entry('procurement', 'vue')], skipped: [] }));

        expect(readPlan(path)).toEqual([entry('procurement', 'vue')]);
    });

    it('refuses a file that is not a plan, naming it', () => {
        const path = join(root, 'not-a-plan.json');
        writeFileSync(path, JSON.stringify({ stale: [] }));

        expect(() => readPlan(path)).toThrow(/not-a-plan\.json is not a port-spec plan/);
    });
});

describe('main', () => {
    // Real runs: a port's folder is served and Playwright is started on it, as in CI. `--list` makes
    // Playwright select the specs without opening a browser, so a run passes when its filter
    // selects specs and fails, as a failing spec does, when it selects none.
    const PORT_BASE = String(30_000 + Math.floor(Math.random() * 20_000));

    function writePlan(run) {
        const path = join(root, 'plan.json');
        writeFileSync(path, JSON.stringify({ run, skipped: [] }));
        return path;
    }

    function writeDist(name) {
        const dist = join(root, name);
        mkdirSync(dist, { recursive: true });
        writeFileSync(join(dist, 'index.html'), '<!doctype html><title>port</title>');
        return dist;
    }

    function capture() {
        const lines = [];
        vi.spyOn(console, 'log').mockImplementation((line) => lines.push(String(line)));
        return lines;
    }

    it("has a default port base clear of the parity run's servers", () => {
        expect(DEFAULT_PORT_BASE).toBeGreaterThan(4799);
    });

    it('passes, with a clear message, when the plan has no ports', async () => {
        const lines = capture();

        await expect(main(['--plan', writePlan([])])).resolves.toBe(0);

        expect(lines).toEqual(['No ports to run the functional specs against.']);
    });

    it('needs a plan', async () => {
        await expect(main([])).rejects.toThrow('--plan <file> is required');
    });

    it.each(['0', '-1', 'abc', '4.5'])('refuses --port-base %s', async (portBase) => {
        await expect(main(['--plan', writePlan([]), '--port-base', portBase])).rejects.toThrow(
            '--port-base must be a port number'
        );
    });

    it('fails, naming the port, when it has no built dist', async () => {
        vi.stubEnv('GITHUB_ACTIONS', 'true');
        const lines = capture();
        const plan = writePlan([entry('procurement', 'angular', join(root, 'missing-dist'))]);

        await expect(main(['--plan', plan])).resolves.toBe(1);

        expect(lines).toContain('::group::Functional specs: procurement/angular');
        expect(
            lines.some((line) =>
                line.startsWith(
                    '::error title=Demo specs failed on a framework port::procurement/angular: no built dist'
                )
            )
        ).toBe(true);
        expect(lines.at(-1)).toBe('1 of 1 port(s) failed: procurement/angular');
    });

    it('names the failure without GitHub annotations when run locally', async () => {
        vi.stubEnv('GITHUB_ACTIONS', '');
        const lines = capture();
        const plan = writePlan([entry('procurement', 'angular', join(root, 'missing-dist'))]);

        await expect(main(['--plan', plan])).resolves.toBe(1);

        expect(lines.some((line) => line.startsWith('FAILED procurement/angular: no built dist'))).toBe(true);
        expect(lines.some((line) => line.startsWith('::'))).toBe(false);
    });

    it('fails a port whose port is already served by something else, without running its specs', async () => {
        vi.stubEnv('GITHUB_ACTIONS', '');
        const lines = capture();
        const busyPort = 30_000 + Math.floor(Math.random() * 20_000);
        const other = createServer((_request, response) => response.end('another checkout'));
        await new Promise((done) => other.listen(busyPort, done));
        try {
            const plan = writePlan([{ ...entry('procurement', 'angular', writeDist('a')), grep: 'procurement' }]);

            await expect(main(['--plan', plan, '--port-base', String(busyPort), '--', '--list'])).resolves.toBe(1);
        } finally {
            await new Promise((done) => other.close(done));
        }

        expect(
            lines.some((line) => line.includes(`FAILED procurement/angular: port ${busyPort} is already in use`))
        ).toBe(true);
    });

    it('passes when the specs of every port pass, one port at a time', async () => {
        vi.stubEnv('CI', '');
        vi.stubEnv('GITHUB_ACTIONS', '');
        const lines = capture();
        const plan = writePlan([
            { ...entry('procurement', 'angular', writeDist('a')), grep: 'procurement' },
            { ...entry('trading-terminal', 'vue', writeDist('b')), grep: 'trading-terminal' },
        ]);

        await expect(main(['--plan', plan, '--port-base', PORT_BASE, '--', '--list'])).resolves.toBe(0);

        expect(lines.some((line) => line.includes('== Functional specs: procurement/angular'))).toBe(true);
        expect(lines.some((line) => line.includes('== Functional specs: trading-terminal/vue'))).toBe(true);
        expect(lines.at(-1)).toBe('All 2 port(s) passed.');
    }, 90_000);

    it("fails the run, naming the port, when a port's specs fail, and still runs the ports after it", async () => {
        vi.stubEnv('CI', '');
        vi.stubEnv('GITHUB_ACTIONS', '');
        const lines = capture();
        const plan = writePlan([
            { ...entry('procurement', 'angular', writeDist('a')), grep: 'no-such-demo' },
            { ...entry('trading-terminal', 'vue', writeDist('b')), grep: 'trading-terminal' },
        ]);

        await expect(main(['--plan', plan, '--port-base', PORT_BASE, '--', '--list'])).resolves.toBe(1);

        expect(lines).toContain('FAILED procurement/angular: playwright exited with 1');
        expect(lines).toContain('  FAIL  procurement/angular (playwright exited with 1)');
        expect(lines).toContain('  PASS  trading-terminal/vue');
        expect(lines.at(-1)).toBe('1 of 2 port(s) failed: procurement/angular');
    }, 90_000);
});
