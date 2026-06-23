import assert from 'node:assert/strict';
import test from 'node:test';

import { diffContention, parseProcStat, parsePsiTotals, readHostInfo } from './contention';

test('parseProcStat extracts steal (8th field) and total', () => {
    const stat = ['cpu  100 20 30 1000 5 0 10 40 0 0', 'cpu0 50 10 15 500 2 0 5 20 0 0', 'intr 12345'].join('\n');
    const parsed = parseProcStat(stat);
    assert.ok(parsed);
    assert.equal(parsed.stealJiffies, 40);
    assert.equal(parsed.totalJiffies, 100 + 20 + 30 + 1000 + 5 + 0 + 10 + 40); // guest/guest_nice = 0
});

test('parseProcStat returns null without an aggregate cpu line', () => {
    assert.equal(parseProcStat('intr 1 2 3\nctxt 99'), null);
});

test('parsePsiTotals reads the cumulative some/full totals', () => {
    const psi = ['some avg10=0.10 avg60=0.05 avg300=0.01 total=123456', 'full avg10=0.00 total=7890'].join('\n');
    assert.deepEqual(parsePsiTotals(psi), { someUs: 123456, fullUs: 7890 });
});

test('parsePsiTotals defaults to zero when PSI lines are absent', () => {
    assert.deepEqual(parsePsiTotals(''), { someUs: 0, fullUs: 0 });
});

test('diffContention computes a steal percentage over the window', () => {
    const before = { stealJiffies: 40, totalJiffies: 1000, psiSomeUs: 100, psiFullUs: 10 };
    const after = { stealJiffies: 70, totalJiffies: 1300, psiSomeUs: 500, psiFullUs: 60 };
    const c = diffContention(before, after, 250);
    assert.ok(c);
    assert.equal(c.stealPct, (30 / 300) * 100); // 10%
    assert.equal(c.psiSomeUs, 400);
    assert.equal(c.psiFullUs, 50);
    assert.equal(c.windowMs, 250);
});

test('diffContention returns null for a non-Linux side or a zero-width window', () => {
    assert.equal(diffContention(null, null, 100), null);
    const s = { stealJiffies: 1, totalJiffies: 1000, psiSomeUs: 0, psiFullUs: 0 };
    assert.equal(diffContention(s, s, 100), null); // totalDelta === 0
});

test('readHostInfo returns null on hosts without /proc/cpuinfo (e.g. macOS)', () => {
    // Pure smoke test: on Linux CI it returns an object; on macOS dev it returns null. Either is valid.
    const host = readHostInfo();
    assert.ok(host === null || typeof host === 'object');
});
