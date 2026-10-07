import { afterEach, describe, expect, it, vi } from 'vitest';

import { checkTouched, parseChecks, runChecks } from './check-seeds.mjs';

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
});

/** Stand-ins for the real checks that record what ran and return the given statuses. */
function fakeChecks(statuses = {}) {
    const ran = [];
    const checks = {};
    for (const name of ['react', 'pins', 'touched', 'stale']) {
        checks[name] = async (request) => {
            ran.push(request);
            return statuses[name] ?? 0;
        };
    }
    return { ran, checks };
}

describe('parseChecks', () => {
    it('runs the requested checks in a fixed order, whatever order the flags come in', () => {
        expect(parseChecks(['--stale', '--touched', 'origin/latest', '--pins', '--react'])).toEqual({
            requested: [
                { name: 'react' },
                { name: 'pins' },
                { name: 'touched', base: 'origin/latest' },
                { name: 'stale', failOnStale: false },
            ],
        });
    });

    it('passes --fail-on-stale to --stale', () => {
        expect(parseChecks(['--stale', '--fail-on-stale'])).toEqual({
            requested: [{ name: 'stale', failOnStale: true }],
        });
    });

    it('rejects --touched without a base', () => {
        expect(parseChecks(['--touched']).error).toMatch(/--touched needs the base/);
        expect(parseChecks(['--touched', '--stale']).error).toMatch(/--touched needs the base/);
    });

    it('explains the flags when none is passed', () => {
        expect(parseChecks([]).error).toMatch(/pass --react .* The flags combine\./);
    });
});

describe('runChecks', () => {
    it('runs every requested check after one fails and exits with the worst status', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const { ran, checks } = fakeChecks({ pins: 1 });

        expect(await runChecks(['--stale', '--pins', '--react'], checks)).toBe(1);
        expect(ran.map(({ name }) => name)).toEqual(['react', 'pins', 'stale']);
    });

    it('exits 0 when every requested check passes', async () => {
        const { checks } = fakeChecks();

        expect(await runChecks(['--react', '--pins'], checks)).toBe(0);
    });

    it('runs nothing and exits 2 when the flags are malformed', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { ran, checks } = fakeChecks();

        expect(await runChecks(['--pins', '--touched'], checks)).toBe(2);
        expect(ran).toEqual([]);
        expect(error).toHaveBeenCalledWith(expect.stringMatching(/--touched needs the base/));
    });

    it('keeps stdout to the --stale JSON when --pins runs with it', async () => {
        // Whether `--pins` passes on the committed ports or reports their drift, every line it
        // writes must reach stderr.
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});

        await runChecks(['--stale', '--pins']);
        expect(log).toHaveBeenCalledTimes(1);
        expect(JSON.parse(log.mock.calls[0][0])).toEqual({ stale: expect.any(Array) });
        expect(error).toHaveBeenCalledWith(
            expect.stringMatching(/^check-seeds: (every port pins|framework ports must pin) ag-charts-\*/)
        );
    });
});

describe('checkTouched', () => {
    const DEMO_NOW = 'sha256-now';
    const DEMO_AT_BASE = 'sha256-base';
    const stalePort = (framework, sourceHash = DEMO_NOW) => ({
        demo: 'web-analytics',
        framework,
        sourceHash,
        manifestHash: 'sha256-then',
        sourceCommit: 'c0ffee',
        manifestCommit: 'decade',
    });
    const SEEDS = 'packages/ag-charts-demos/seeds/web-analytics';
    /** `staleAtBase` maps a framework to the demo's hash at the base; `demoMoved` ones differ from now. */
    const reads = ({ stale, changedFiles, staleAtBase = {} }) => ({
        findStalePorts: () => stale.map((framework) => stalePort(framework)),
        readChangedFiles: () => changedFiles,
        findStalePortsAtBase: vi.fn(() =>
            Object.entries(staleAtBase).map(([framework, hash]) => stalePort(framework, hash))
        ),
    });
    const logged = () => {
        vi.stubEnv('GITHUB_ACTIONS', '');
        return vi.spyOn(console, 'error').mockImplementation(() => {});
    };
    const output = (error) => error.mock.calls.map(([line]) => line).join('\n');

    it('warns, and passes, for a port already stale at the base that the change edits along with its demo', () => {
        const error = logged();
        const status = checkTouched(
            { base: 'origin/latest' },
            reads({
                stale: ['vue'],
                changedFiles: [`${SEEDS}/vue/src/components/PageTreemapChart.vue`],
                staleAtBase: { vue: DEMO_AT_BASE },
            })
        );

        expect(status).toBe(0);
        expect(output(error)).toMatch(
            /warning: seeds\/web-analytics\/vue was already stale at origin\/latest and is edited here \(src\/components\/PageTreemapChart\.vue\) along with src\/demos\/web-analytics.*nothing to restamp on this PR/
        );
        expect(output(error)).not.toMatch(/stamp-port-manifest/);
    });

    it('emits the warning as a GitHub annotation under Actions', () => {
        const error = logged();
        vi.stubEnv('GITHUB_ACTIONS', 'true');

        checkTouched(
            { base: 'origin/latest' },
            reads({
                stale: ['vue'],
                changedFiles: [`${SEEDS}/vue/src/main.ts`],
                staleAtBase: { vue: DEMO_AT_BASE },
            })
        );

        expect(output(error)).toMatch(
            /^::warning title=Edited stale demo port::seeds\/web-analytics\/vue was already stale/m
        );
    });

    it('still fails, with the restamp hint, for a port that was fresh at the base and is left stale', () => {
        const error = logged();
        const status = checkTouched(
            { base: 'origin/latest' },
            reads({ stale: ['vue'], changedFiles: [`${SEEDS}/vue/src/main.ts`] })
        );

        expect(status).toBe(1);
        expect(output(error)).toMatch(/seeds\/web-analytics\/vue: src\/main\.ts/);
        expect(output(error)).toMatch(/stamp-port-manifest\.mjs web-analytics vue/);
        expect(output(error)).not.toMatch(/warning/);
    });

    it('still fails an alignment that edits a port stale at the base, leaves its demo alone and forgets to restamp', () => {
        const error = logged();
        const status = checkTouched(
            { base: 'origin/latest' },
            reads({
                stale: ['vue'],
                changedFiles: [`${SEEDS}/vue/src/components/PageTreemapChart.vue`],
                staleAtBase: { vue: DEMO_NOW },
            })
        );

        expect(status).toBe(1);
        expect(output(error)).toMatch(/seeds\/web-analytics\/vue: src\/components\/PageTreemapChart\.vue/);
        expect(output(error)).toMatch(/stamp-port-manifest\.mjs web-analytics vue/);
        expect(output(error)).not.toMatch(/warning/);
    });

    it('fails only for the ports that must be restamped when the change edits both kinds', () => {
        const error = logged();
        const status = checkTouched(
            { base: 'origin/latest' },
            reads({
                stale: ['angular', 'vue'],
                changedFiles: [`${SEEDS}/angular/src/main.ts`, `${SEEDS}/vue/src/main.ts`],
                staleAtBase: { angular: DEMO_AT_BASE },
            })
        );

        expect(status).toBe(1);
        expect(output(error)).toMatch(/warning: seeds\/web-analytics\/angular was already stale/);
        expect(output(error)).toMatch(/stamp-port-manifest\.mjs web-analytics vue/);
        expect(output(error)).not.toMatch(/stamp-port-manifest\.mjs web-analytics angular/);
    });

    it('passes without reading the base when the change edits no stale port', () => {
        const error = logged();
        const checkReads = reads({ stale: ['vue'], changedFiles: ['packages/other/file.ts'] });

        expect(checkTouched({ base: 'origin/latest' }, checkReads)).toBe(0);
        expect(checkReads.findStalePortsAtBase).not.toHaveBeenCalled();
        expect(output(error)).toMatch(/no port edited since origin\/latest is newly left stale/);
    });
});
