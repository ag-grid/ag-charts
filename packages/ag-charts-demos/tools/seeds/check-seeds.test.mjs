import { afterEach, describe, expect, it, vi } from 'vitest';

import { checkTouched, parseChecks, runChecks } from './check-seeds.mjs';

afterEach(() => {
    vi.restoreAllMocks();
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
    const stalePort = (framework) => ({
        demo: 'web-analytics',
        framework,
        sourceHash: 'sha256-now',
        manifestHash: 'sha256-then',
        sourceCommit: 'c0ffee',
        manifestCommit: 'decade',
    });
    const SEEDS = 'packages/ag-charts-demos/seeds/web-analytics';
    const reads = ({ stale, changedFiles, staleAtBase }) => ({
        findStalePorts: () => stale.map(stalePort),
        readChangedFiles: () => changedFiles,
        findStalePortsAtBase: vi.fn(() => staleAtBase.map(stalePort)),
    });
    const logged = () => vi.spyOn(console, 'error').mockImplementation(() => {});
    const output = (error) => error.mock.calls.map(([line]) => line).join('\n');

    it('warns, and passes, for a stale port the change edits that was already stale at the base', () => {
        const error = logged();
        const status = checkTouched(
            { base: 'origin/latest' },
            reads({
                stale: ['vue'],
                changedFiles: [`${SEEDS}/vue/src/components/PageTreemapChart.vue`],
                staleAtBase: ['vue'],
            })
        );

        expect(status).toBe(0);
        expect(output(error)).toMatch(
            /warning: seeds\/web-analytics\/vue was already stale at origin\/latest and is edited here \(src\/components\/PageTreemapChart\.vue\).*no action needed on this PR/
        );
        expect(output(error)).not.toMatch(/restamp|stamp-port-manifest/);
    });

    it('still fails, with the restamp hint, for a port that was fresh at the base and is left stale', () => {
        const error = logged();
        const status = checkTouched(
            { base: 'origin/latest' },
            reads({ stale: ['vue'], changedFiles: [`${SEEDS}/vue/src/main.ts`], staleAtBase: [] })
        );

        expect(status).toBe(1);
        expect(output(error)).toMatch(/seeds\/web-analytics\/vue: src\/main\.ts/);
        expect(output(error)).toMatch(/stamp-port-manifest\.mjs web-analytics vue/);
        expect(output(error)).not.toMatch(/warning:/);
    });

    it('fails only for the ports that were fresh at the base when the change edits both kinds', () => {
        const error = logged();
        const status = checkTouched(
            { base: 'origin/latest' },
            reads({
                stale: ['angular', 'vue'],
                changedFiles: [`${SEEDS}/angular/src/main.ts`, `${SEEDS}/vue/src/main.ts`],
                staleAtBase: ['angular'],
            })
        );

        expect(status).toBe(1);
        expect(output(error)).toMatch(/warning: seeds\/web-analytics\/angular was already stale/);
        expect(output(error)).toMatch(/stamp-port-manifest\.mjs web-analytics vue/);
        expect(output(error)).not.toMatch(/stamp-port-manifest\.mjs web-analytics angular/);
    });

    it('passes without reading the base when the change edits no stale port', () => {
        const error = logged();
        const checkReads = reads({ stale: ['vue'], changedFiles: ['packages/other/file.ts'], staleAtBase: [] });

        expect(checkTouched({ base: 'origin/latest' }, checkReads)).toBe(0);
        expect(checkReads.findStalePortsAtBase).not.toHaveBeenCalled();
        expect(output(error)).toMatch(/no port edited since origin\/latest is newly left stale/);
    });
});
