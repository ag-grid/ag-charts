import { describe, expect, it } from 'vitest';

import { type ComparisonRecord, attemptDir, attemptKey, describeSkipped, summariseAttempts } from './summary';
import type { SkippedPort } from './targets';

function attempt(overrides: Partial<ComparisonRecord>): ComparisonRecord {
    return {
        demo: 'financial',
        framework: 'angular',
        state: 'initial',
        viewport: '1440x900',
        repeatEachIndex: 0,
        retry: 0,
        screenshots: null,
        diffPixels: 0,
        diffPixelRatio: 0,
        passed: true,
        artefacts: {},
        ...overrides,
    };
}

describe('summariseAttempts', () => {
    it('counts a failure followed by a passing retry as flaky, not passed', () => {
        const totals = summariseAttempts([attempt({ passed: false }), attempt({ retry: 1 })]);
        expect(totals).toEqual({ comparisons: 1, passed: 0, flaky: 1, failed: 0, attempts: 2 });
    });

    it('counts a comparison whose last attempt failed as failed, even after an earlier pass', () => {
        const totals = summariseAttempts([attempt({ retry: 1, passed: false }), attempt({ retry: 0 })]);
        expect(totals).toEqual({ comparisons: 1, passed: 0, flaky: 0, failed: 1, attempts: 2 });
    });

    it('counts each repeat on its own, so one failing repeat among passing ones is a failure', () => {
        const totals = summariseAttempts([
            attempt({ repeatEachIndex: 0 }),
            attempt({ repeatEachIndex: 1, passed: false }),
            attempt({ repeatEachIndex: 2 }),
        ]);
        expect(totals).toEqual({ comparisons: 3, passed: 2, flaky: 0, failed: 1, attempts: 3 });
    });

    it('counts different states and viewports as different comparisons', () => {
        const totals = summariseAttempts([
            attempt({}),
            attempt({ viewport: '1024x768' }),
            attempt({ state: 'range-1h' }),
        ]);
        expect(totals).toEqual({ comparisons: 3, passed: 3, flaky: 0, failed: 0, attempts: 3 });
    });
});

describe('attempt identity', () => {
    it('gives every repeat and retry its own key and artefact folder', () => {
        const records = [
            attempt({}),
            attempt({ retry: 1 }),
            attempt({ repeatEachIndex: 1 }),
            attempt({ repeatEachIndex: 1, retry: 1 }),
        ];
        expect(new Set(records.map(attemptKey)).size).toBe(4);
        expect(records.map(attemptDir)).toEqual([
            'angular/financial/initial@1440x900/repeat-0-retry-0',
            'angular/financial/initial@1440x900/repeat-0-retry-1',
            'angular/financial/initial@1440x900/repeat-1-retry-0',
            'angular/financial/initial@1440x900/repeat-1-retry-1',
        ]);
    });
});

describe('describeSkipped', () => {
    const skipped = (framework: string, overrides: Partial<SkippedPort> = {}): SkippedPort => ({
        demo: 'financial',
        framework,
        sourceHash: 'sha256-now',
        manifestHash: 'sha256-then',
        sourceCommit: 'c0ffee0011223344',
        manifestCommit: 'decade0011223344',
        reason: 'stale',
        ...overrides,
    });

    it('says nothing when no port is skipped and some are compared', () => {
        expect(describeSkipped([], 3)).toEqual([]);
    });

    it('names every skipped port with what it was aligned to and where the demo is now', () => {
        const lines = describeSkipped([skipped('angular')], 1);
        expect(lines[0]).toMatch(/^Parity: SKIPPED 1 stale port, not compared with the React demo\./);
        expect(lines.slice(1)).toEqual(['  - financial/angular: stale, aligned to decade00, demo now at c0ffee00']);
    });

    it('falls back to the hashes when the commits cannot tell the two apart', () => {
        const hashes = { sourceHash: 'sha256-0123456789abcdef', manifestHash: 'sha256-fedcba9876543210' };
        const lines = describeSkipped(
            [
                skipped('angular', { ...hashes, sourceCommit: 'decade0011223344' }), // demo change not committed
                skipped('vue', { ...hashes, sourceCommit: null }), // shallow clone
                skipped('typescript', { ...hashes, manifestHash: null, manifestCommit: null }), // never aligned
            ],
            1
        );
        expect(lines.slice(1)).toEqual([
            '  - financial/angular: stale, aligned to sha256-fedcba98, demo now at sha256-01234567',
            '  - financial/vue: stale, aligned to sha256-fedcba98, demo now at sha256-01234567',
            '  - financial/typescript: stale, aligned to never, demo now at sha256-01234567',
        ]);
    });

    it('says there is nothing to compare when every port is skipped or none exists', () => {
        expect(describeSkipped([skipped('angular')], 0).at(-1)).toBe('Parity: no current ports to compare.');
        expect(describeSkipped([], 0)).toEqual(['Parity: no current ports to compare.']);
    });
});
