import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { demoGrep, describePlan, planPortSpecs, portKey, readStaleReport } from './port-spec-plan.mjs';
import { readPortManifests } from './stale-ports.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'port-spec-plan.mjs');
const DEMOS_ROOT = join(dirname(SCRIPT), '..', '..');

let root;
let seedsDir;

function writePort(demo, framework, manifest = { dist: 'dist' }) {
    const dir = join(seedsDir, demo, framework);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, '.seed-manifest.json'), JSON.stringify({ demo, framework, ...manifest }));
}

const ports = () => readPortManifests(seedsDir);
const plan = (stale = []) => planPortSpecs({ ports: ports(), stale, workspaceRoot: root });
const keys = (list) => list.map(({ demo, framework }) => portKey(demo, framework));

beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'port-spec-plan-'));
    seedsDir = join(root, 'packages', 'ag-charts-demos', 'seeds');
});
afterEach(() => {
    rmSync(root, { recursive: true, force: true });
});

describe('planPortSpecs', () => {
    it("runs the specs for every current port, against that port's own built dist", () => {
        writePort('trading-terminal', 'angular');
        writePort('trading-terminal', 'vue');
        writePort('procurement', 'typescript', { dist: 'dist' });

        expect(plan().run).toEqual([
            {
                demo: 'procurement',
                framework: 'typescript',
                dist: 'packages/ag-charts-demos/seeds/procurement/typescript/dist',
                grep: 'procurement',
            },
            {
                demo: 'trading-terminal',
                framework: 'angular',
                dist: 'packages/ag-charts-demos/seeds/trading-terminal/angular/dist',
                grep: 'trading-terminal',
            },
            {
                demo: 'trading-terminal',
                framework: 'vue',
                dist: 'packages/ag-charts-demos/seeds/trading-terminal/vue/dist',
                grep: 'trading-terminal',
            },
        ]);
    });

    it('follows the dist the manifest names rather than assuming "dist"', () => {
        writePort('procurement', 'angular', { dist: 'dist/browser' });

        expect(plan().run[0].dist).toBe('packages/ag-charts-demos/seeds/procurement/angular/dist/browser');
    });

    it("selects only the port's own demo: a port's filter is its demo id and no other demo's", () => {
        writePort('trading-terminal', 'angular');
        writePort('procurement', 'angular');
        writePort('web-analytics', 'vue');

        const { run } = plan();

        expect(run.map(({ demo, grep }) => [demo, grep])).toEqual([
            ['procurement', 'procurement'],
            ['trading-terminal', 'trading-terminal'],
            ['web-analytics', 'web-analytics'],
        ]);
    });

    it('skips stale ports, listing them as skipped and leaving them out of the run', () => {
        writePort('trading-terminal', 'angular');
        writePort('trading-terminal', 'vue');
        writePort('procurement', 'typescript');

        const result = plan([
            {
                demo: 'trading-terminal',
                framework: 'vue',
                sourceHash: 'a',
                manifestHash: 'b',
                sourceCommit: 'c',
                manifestCommit: 'd',
            },
        ]);

        expect(keys(result.run)).toEqual(['procurement/typescript', 'trading-terminal/angular']);
        expect(result.skipped).toEqual([{ demo: 'trading-terminal', framework: 'vue' }]);
    });

    it("stales only the framework named: the same demo's other ports still run", () => {
        writePort('procurement', 'angular');
        writePort('procurement', 'typescript');

        const result = plan([{ demo: 'procurement', framework: 'angular' }]);

        expect(keys(result.run)).toEqual(['procurement/typescript']);
        expect(keys(result.skipped)).toEqual(['procurement/angular']);
    });

    it('ignores a stale entry that has no committed port', () => {
        writePort('procurement', 'angular');

        const result = plan([{ demo: 'web-analytics', framework: 'vue' }]);

        expect(keys(result.run)).toEqual(['procurement/angular']);
        expect(result.skipped).toEqual([]);
    });

    it('has nothing to run, and nothing skipped, when there are no ports', () => {
        expect(plan()).toEqual({ run: [], skipped: [] });
    });

    it('has nothing to run when every port is stale', () => {
        writePort('procurement', 'angular');
        writePort('procurement', 'vue');

        const result = plan([
            { demo: 'procurement', framework: 'angular' },
            { demo: 'procurement', framework: 'vue' },
        ]);

        expect(result.run).toEqual([]);
        expect(keys(result.skipped)).toEqual(['procurement/angular', 'procurement/vue']);
    });

    it('refuses a current port whose manifest names no dist, naming the manifest', () => {
        writePort('procurement', 'angular', { dist: undefined });

        expect(() => plan()).toThrow(/procurement[\\/]angular[\\/]\.seed-manifest\.json has no "dist"/);
    });

    it('does not need a dist for a stale port, which is not run', () => {
        writePort('procurement', 'angular', { dist: undefined });

        expect(plan([{ demo: 'procurement', framework: 'angular' }]).skipped).toEqual([
            { demo: 'procurement', framework: 'angular' },
        ]);
    });
});

describe('demoGrep', () => {
    it.each(['procurement', 'trading-terminal', 'web-analytics', 'demo2'])('is the demo id for %s', (demo) => {
        expect(demoGrep(demo)).toBe(demo);
    });

    it.each(['', 'Procurement', 'web analytics', 'web_analytics', 'a--b', '-a', 'a-', '.*', 'a|b', 'a.b'])(
        'refuses %j rather than matching it loosely',
        (demo) => {
            expect(() => demoGrep(demo)).toThrow(/is not a demo id/);
        }
    );
});

describe('describePlan', () => {
    it('names each stale port that is skipped, and the ports that run', () => {
        const lines = describePlan({
            run: [{ demo: 'procurement', framework: 'typescript' }],
            skipped: [
                { demo: 'trading-terminal', framework: 'angular' },
                { demo: 'trading-terminal', framework: 'vue' },
            ],
        });

        expect(lines).toEqual([
            'Skipped (stale): trading-terminal/angular',
            'Skipped (stale): trading-terminal/vue',
            'Functional specs run against: procurement/typescript',
        ]);
    });

    it('raises one GitHub warning per stale port, naming it, plus a summary line, when annotating', () => {
        const lines = describePlan(
            {
                run: [{ demo: 'procurement', framework: 'typescript' }],
                skipped: [
                    { demo: 'trading-terminal', framework: 'angular' },
                    { demo: 'trading-terminal', framework: 'vue' },
                ],
            },
            { annotate: true }
        );

        const warnings = lines.filter((line) => line.startsWith('::warning '));
        expect(warnings).toHaveLength(2);
        expect(warnings[0]).toContain('seeds/trading-terminal/angular');
        expect(warnings[1]).toContain('seeds/trading-terminal/vue');
        expect(lines).toContain('Skipped stale ports: trading-terminal/angular, trading-terminal/vue');
        expect(lines.at(-1)).toBe('Functional specs run against: procurement/typescript');
    });

    it('says plainly that there is nothing to run when there are no ports', () => {
        expect(describePlan({ run: [], skipped: [] })).toEqual([
            'No committed framework ports: there is nothing to run the functional specs against.',
        ]);
    });

    it('says so, and still names the skipped ports, when every port is stale', () => {
        const lines = describePlan({ run: [], skipped: [{ demo: 'procurement', framework: 'vue' }] });

        expect(lines).toEqual([
            'Skipped (stale): procurement/vue',
            'Every committed framework port is stale: there is nothing to run the functional specs against.',
        ]);
    });

    it('prints no stale lines when no port is stale', () => {
        const lines = describePlan(
            { run: [{ demo: 'procurement', framework: 'vue' }], skipped: [] },
            { annotate: true }
        );

        expect(lines).toEqual(['Functional specs run against: procurement/vue']);
    });
});

describe('readStaleReport', () => {
    it('reads the stale ports from a check-seeds --stale report', () => {
        const path = join(root, 'stale-ports.json');
        writeFileSync(path, JSON.stringify({ stale: [{ demo: 'procurement', framework: 'vue', sourceHash: 'x' }] }));

        expect(readStaleReport(path)).toEqual([{ demo: 'procurement', framework: 'vue', sourceHash: 'x' }]);
    });

    it('accepts a report with no stale ports', () => {
        const path = join(root, 'stale-ports.json');
        writeFileSync(path, JSON.stringify({ stale: [] }));

        expect(readStaleReport(path)).toEqual([]);
    });

    it('refuses a file that is not a stale report, naming it', () => {
        const path = join(root, 'other.json');
        writeFileSync(path, JSON.stringify({ ports: [] }));

        expect(() => readStaleReport(path)).toThrow(/other\.json is not a stale report/);
    });
});

describe('the command line, against the committed ports', () => {
    const committed = readPortManifests();

    function runCli(args) {
        return spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
    }

    function writeReport(stale) {
        const path = join(root, 'stale-ports.json');
        writeFileSync(path, JSON.stringify({ stale }));
        return path;
    }

    it('plans a run of every committed port when none is stale, printing the plan on stdout', () => {
        const result = runCli(['--stale-report', writeReport([])]);

        expect(result.status).toBe(0);
        const { run, skipped } = JSON.parse(result.stdout);
        expect(skipped).toEqual([]);
        expect(keys(run)).toEqual(keys(committed).sort());
        expect(result.stderr).toContain('Functional specs run against:');
    });

    it('writes the plan to --out, creating its folder, and keeps stdout clear', () => {
        const out = join(root, 'nested', 'plan.json');

        const result = runCli(['--stale-report', writeReport([]), '--out', out]);

        expect(result.status).toBe(0);
        expect(result.stdout).toBe('');
        expect(JSON.parse(readFileSync(out, 'utf8')).run).toHaveLength(committed.length);
    });

    it('skips and names the stale ports, and passes, when they are all stale', () => {
        const result = runCli([
            '--stale-report',
            writeReport(committed.map(({ demo, framework }) => ({ demo, framework }))),
        ]);

        expect(result.status).toBe(0);
        expect(JSON.parse(result.stdout).run).toEqual([]);
        for (const port of committed)
            expect(result.stderr).toContain(`Skipped (stale): ${portKey(port.demo, port.framework)}`);
        expect(result.stderr).toContain('nothing to run the functional specs against');
    });

    it('fails, naming the problem, on a report that is not a stale report', () => {
        const path = join(root, 'bad.json');
        writeFileSync(path, '{}');

        const result = runCli(['--stale-report', path]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('port-spec-plan:');
        expect(result.stderr).toContain('is not a stale report');
    });

    it('fails on an option given no value', () => {
        const result = runCli(['--out']);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('--out needs a value');
    });
});

describe("the demos' functional specs, selected by each port's filter", () => {
    // A port is a single-demo app, so a spec that matched another demo's filter would run against an
    // app that cannot answer it. Ask Playwright itself which specs each committed demo's filter selects.
    const demos = [...new Set(readPortManifests().map(({ demo }) => demo))];

    function listSpecFiles(grep) {
        const output = execFileSync('npx', ['playwright', 'test', '--list', '--reporter=json', '-g', grep], {
            cwd: DEMOS_ROOT,
            encoding: 'utf8',
            env: { ...process.env, DEMOS_BASE_URL: 'http://localhost:1' },
        });
        const files = new Set();
        const visit = (suite) => {
            for (const spec of suite.specs ?? []) files.add(spec.file);
            for (const child of suite.suites ?? []) visit(child);
        };
        for (const suite of JSON.parse(output).suites) visit(suite);
        return [...files].sort();
    }

    it.each(demos)(
        "selects specs for %s, and none of another demo's own spec file",
        (demo) => {
            const files = listSpecFiles(demoGrep(demo));

            expect(files).toContain('demos.spec.ts');
            const demoSpecFiles = new Set(demos.map((id) => `${id}.spec.ts`));
            const other = files.filter((file) => demoSpecFiles.has(file) && file !== `${demo}.spec.ts`);
            expect(other).toEqual([]);
        },
        60_000
    );
});
