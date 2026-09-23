import { describe, expect, it } from 'vitest';

import { type ComparisonRecord, attemptDir, attemptKey, summariseAttempts } from './summary';

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
