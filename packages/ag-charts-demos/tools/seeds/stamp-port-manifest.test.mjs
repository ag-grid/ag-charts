import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { stampPortManifest } from './stamp-port-manifest.mjs';

let dir;
let manifestPath;

beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'stamp-port-manifest-'));
    manifestPath = join(dir, '.seed-manifest.json');
});
afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
});

function writeManifest(fields) {
    writeFileSync(manifestPath, `${JSON.stringify({ demo: 'financial', framework: 'vue', ...fields }, null, 4)}\n`);
}

describe('stampPortManifest', () => {
    it('records the new hash and the commit that moved it', () => {
        writeManifest({ sourceHash: 'sha256-old', sourceCommit: 'old-commit', pinnedVersion: '14.2.0' });
        const result = stampPortManifest(manifestPath, {
            hashSource: () => 'sha256-new',
            readSourceCommit: () => 'new-commit',
        });
        expect(result).toEqual({ sourceHash: 'sha256-new', sourceCommit: 'new-commit' });
        expect(JSON.parse(readFileSync(manifestPath, 'utf8'))).toEqual({
            demo: 'financial',
            framework: 'vue',
            sourceHash: 'sha256-new',
            sourceCommit: 'new-commit',
            pinnedVersion: '14.2.0',
        });
    });

    it('keeps the recorded commit when the hash is unchanged, as a shallow clone would misreport it', () => {
        writeManifest({ sourceHash: 'sha256-same', sourceCommit: 'synced-commit' });
        const result = stampPortManifest(manifestPath, {
            hashSource: () => 'sha256-same',
            readSourceCommit: () => 'shallow-head',
        });
        expect(result).toEqual({ sourceHash: 'sha256-same', sourceCommit: 'synced-commit' });
    });
});
