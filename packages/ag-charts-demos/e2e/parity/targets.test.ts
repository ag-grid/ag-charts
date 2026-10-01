import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type StalePortReport, partitionStalePorts, readStaleReport } from './targets';

const port = (demo: string, framework: string) => ({ demo, framework, port: 0 });

const stale = (demo: string, framework: string): StalePortReport => ({
    demo,
    framework,
    sourceHash: `sha256-now-${demo}`,
    manifestHash: `sha256-then-${demo}`,
    sourceCommit: 'c0ffee00c0ffee00',
    manifestCommit: 'decade00decade00',
});

describe('partitionStalePorts', () => {
    const committed = [
        port('financial', 'angular'),
        port('financial', 'vue'),
        port('procurement', 'angular'),
        port('web-analytics', 'typescript'),
    ];

    it('compares the current ports and skips the stale ones, recording why', () => {
        const { current, skipped } = partitionStalePorts(committed, [
            stale('financial', 'angular'),
            stale('financial', 'vue'),
        ]);
        expect(current).toEqual([port('procurement', 'angular'), port('web-analytics', 'typescript')]);
        expect(skipped).toEqual([
            { ...stale('financial', 'angular'), reason: 'stale' },
            { ...stale('financial', 'vue'), reason: 'stale' },
        ]);
    });

    it('matches on demo and framework together, not either alone', () => {
        const { current, skipped } = partitionStalePorts(committed, [stale('procurement', 'vue')]);
        expect(current).toEqual(committed);
        expect(skipped).toEqual([]);
    });

    it('leaves nothing to compare when every port is stale', () => {
        const { current, skipped } = partitionStalePorts(
            committed,
            committed.map(({ demo, framework }) => stale(demo, framework))
        );
        expect(current).toEqual([]);
        expect(skipped.map(({ demo, framework }) => `${demo}/${framework}`)).toEqual([
            'financial/angular',
            'financial/vue',
            'procurement/angular',
            'web-analytics/typescript',
        ]);
    });

    it('ignores a stale entry for a port that is not committed', () => {
        expect(partitionStalePorts([], [stale('financial', 'angular')])).toEqual({ current: [], skipped: [] });
    });

    it('skips nothing when stale ports are included', () => {
        const { current, skipped } = partitionStalePorts(committed, [stale('financial', 'angular')], true);
        expect(current).toEqual(committed);
        expect(skipped).toEqual([]);
    });
});

describe('readStaleReport', () => {
    const dirs: string[] = [];
    const writeReport = (content: string) => {
        const dir = mkdtempSync(join(tmpdir(), 'parity-stale-'));
        dirs.push(dir);
        const path = join(dir, 'stale-ports.json');
        writeFileSync(path, content);
        return path;
    };

    afterEach(() => {
        vi.unstubAllEnvs();
        dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true }));
    });

    it('reads the report CI wrote, named by PARITY_STALE_REPORT', () => {
        vi.stubEnv('PARITY_STALE_REPORT', writeReport(JSON.stringify({ stale: [stale('financial', 'vue')] })));
        expect(readStaleReport()).toEqual([stale('financial', 'vue')]);
    });

    it('rejects a file that is not a stale report rather than skipping nothing', () => {
        vi.stubEnv('PARITY_STALE_REPORT', writeReport(JSON.stringify({ ports: [] })));
        expect(() => readStaleReport()).toThrow(/is not a stale report/);
    });
});
