import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseChecks, runChecks } from './check-seeds.mjs';

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
