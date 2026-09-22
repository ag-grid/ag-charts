import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { hashDemoSource, resolveDemoSources } from './seed-common.mjs';

let srcDir;

function write(path, content) {
    mkdirSync(join(srcDir, path, '..'), { recursive: true });
    writeFileSync(join(srcDir, path), content);
}

beforeEach(() => {
    srcDir = mkdtempSync(join(tmpdir(), 'seed-common-'));
    write(
        'alpha/index.tsx',
        "import { world } from '../beta/topology';\nimport './alpha.css';\nexport const a = world;\n"
    );
    write('alpha/alpha.css', '.a { color: red; }\n');
    write('beta/topology.ts', "import { helper } from './lib';\nexport const world = helper();\n");
    write('beta/lib/index.ts', 'export const helper = () => 1;\n');
    write('beta/index.tsx', "import { world } from './topology';\nexport const b = world;\n");
});
afterEach(() => {
    rmSync(srcDir, { recursive: true, force: true });
});

describe('resolveDemoSources', () => {
    it('lists a demo’s own files and the sibling-demo files its imports reach', () => {
        expect(resolveDemoSources('alpha', srcDir)).toEqual({
            files: ['alpha.css', 'index.tsx'],
            vendored: ['beta/lib/index.ts', 'beta/topology.ts'],
        });
    });

    it('vendors nothing for a demo that only imports its own files', () => {
        expect(resolveDemoSources('beta', srcDir).vendored).toEqual([]);
    });
});

describe('hashDemoSource', () => {
    it('is stable for unchanged source', () => {
        expect(hashDemoSource('alpha', srcDir)).toBe(hashDemoSource('alpha', srcDir));
        expect(hashDemoSource('alpha', srcDir)).toMatch(/^sha256-[0-9a-f]{64}$/);
    });

    it('changes when a sibling-demo file the demo imports changes', () => {
        const before = hashDemoSource('alpha', srcDir);
        write('beta/lib/index.ts', 'export const helper = () => 2;\n');
        expect(hashDemoSource('alpha', srcDir)).not.toBe(before);
    });

    it('does not change when a sibling-demo file the demo does not import changes', () => {
        const before = hashDemoSource('alpha', srcDir);
        write('beta/index.tsx', "import { world } from './topology';\nexport const b = world + 1;\n");
        expect(hashDemoSource('alpha', srcDir)).toBe(before);
    });
});
