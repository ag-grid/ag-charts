import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// Run with: yarn nx test tools-archive (CI runs it with the other projects' test targets).

// Each fixture is an excerpt of the root .htaccess, verbatim from the grid's generator: its
// in-flight block empty, with a grid release candidate, with a charts one, and with both.
const fixture = (name) => fileURLToPath(new URL(`./__fixtures__/root-htaccess-inflight-${name}.txt`, import.meta.url));
const script = fileURLToPath(new URL('./markChartsArchiveInFlight.mjs', import.meta.url));

const copyOf = (name) => {
    const file = join(mkdtempSync(join(tmpdir(), 'in-flight-')), '.htaccess');
    copyFileSync(fixture(name), file);
    return file;
};
const run = (file, ...args) => spawnSync('node', [script, file, ...args], { encoding: 'utf8' });

test('sets the charts rule alone, as the grid generator emits it', () => {
    const file = copyOf('none');
    assert.equal(run(file, '14.3.0').status, 0);
    assert.equal(readFileSync(file, 'utf8'), readFileSync(fixture('charts'), 'utf8'));
});

test('keeps the grid rule byte for byte beside the charts one', () => {
    const file = copyOf('grid');
    assert.equal(run(file, '14.3.0').status, 0);
    assert.equal(readFileSync(file, 'utf8'), readFileSync(fixture('both'), 'utf8'));
});

test('replaces a charts rule already in flight, still keeping the grid rule', () => {
    const file = copyOf('both');
    assert.equal(run(file, '14.3.1').status, 0);
    const expected = readFileSync(fixture('both'), 'utf8').replace('14\\.3\\.0', '14\\.3\\.1');
    assert.equal(readFileSync(file, 'utf8'), expected);
});

test('is idempotent: a second run leaves the file as the first left it', () => {
    const file = copyOf('grid');
    run(file, '14.3.0');
    const once = readFileSync(file, 'utf8');
    const second = run(file, '14.3.0');
    assert.equal(second.status, 0);
    assert.match(second.stdout, /already set/);
    assert.equal(readFileSync(file, 'utf8'), once);
});

test('refuses a file with no marker block, writing nothing', () => {
    const file = copyOf('none');
    const without = readFileSync(file, 'utf8').replace(/# BEGIN in-flight[^\n]*\n/, '');
    writeFileSync(file, without);
    const result = run(file, '14.3.0');
    assert.equal(result.status, 1);
    assert.match(result.stderr, /No in-flight marker block/);
    assert.equal(readFileSync(file, 'utf8'), without);
});

test('refuses a block holding anything but one rule per product, as the grid tool does', () => {
    const both = readFileSync(fixture('both'), 'utf8');
    const chartsLine = both.split('\n').find((line) => line.includes('m#^/charts/archive/'));
    for (const block of [
        both.replace(chartsLine, `${chartsLine}\n${chartsLine.replace('14\\.3\\.0', '14\\.2\\.0')}`),
        both.replace(chartsLine, `${chartsLine}\nHeader set X-Debug "1"`),
        both.replace(chartsLine, `    ${chartsLine}`),
    ]) {
        const file = copyOf('none');
        writeFileSync(file, block);
        const result = run(file, '14.3.1');
        assert.equal(result.status, 1);
        assert.match(result.stderr, /REFUSING/);
        assert.equal(readFileSync(file, 'utf8'), block);
    }
});

test('refuses a bad or missing version, writing nothing', () => {
    for (const args of [['14.3'], ['14.3.0-beta'], ['14.3.0/'], []]) {
        const file = copyOf('grid');
        const result = run(file, ...args);
        assert.equal(result.status, 2, String(args));
        assert.equal(readFileSync(file, 'utf8'), readFileSync(fixture('grid'), 'utf8'));
    }
});
