import {
    CONSOLE_LOG_END,
    CONSOLE_LOG_START,
    DARK_MODE_END,
    DARK_MODE_START,
} from '@ag-website-shared/utils/extraCodeSnippets';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
    CHECKED_FRAMEWORKS,
    CHECKED_MODES,
    type ExampleRef,
    findExamples,
    getExportedFiles,
    main,
    normaliseExampleArg,
    parseArgs,
    parseTscOutput,
    readVariant,
    selectExamples,
} from './validate-generated-examples';

const example = (id: string): ExampleRef => {
    const [section, ...rest] = id.split('/');
    const name = rest.pop()!;
    return { id, dir: path.join(section, ...rest, '_examples', name) };
};

const EXAMPLES = [
    'docs/bar-series/simple',
    'docs/line-series/simple',
    'docs/line-series/markers',
    'gallery/bar-chart',
    'gallery/simple',
].map(example);

describe('normaliseExampleArg', () => {
    it.each([
        ['simple', 'simple'],
        ['bar-series/simple', 'bar-series/simple'],
        ['docs/bar-series/simple', 'docs/bar-series/simple'],
        ['docs/bar-series/_examples/simple', 'docs/bar-series/simple'],
        ['packages/ag-charts-website/src/content/docs/bar-series/_examples/simple', 'docs/bar-series/simple'],
        ['packages/ag-charts-website/src/content/docs/bar-series/_examples/simple/', 'docs/bar-series/simple'],
        ['packages/ag-charts-website/src/content/docs/bar-series/_examples/simple/main.ts', 'docs/bar-series/simple'],
        ['src/content/gallery/_examples/bar-chart', 'gallery/bar-chart'],
        ['./simple', 'simple'],
        ['docs\\bar-series\\simple', 'docs/bar-series/simple'],
    ])('%s -> %s', (arg, expected) => {
        expect(normaliseExampleArg(arg)).toBe(expected);
    });
});

describe('selectExamples', () => {
    it('selects everything when given no arguments', () => {
        expect(selectExamples(EXAMPLES, [])).toEqual(EXAMPLES);
    });

    it('selects an example by its path under the website', () => {
        const selected = selectExamples(EXAMPLES, [
            'packages/ag-charts-website/src/content/docs/bar-series/_examples/simple',
        ]);
        expect(selected.map((e) => e.id)).toEqual(['docs/bar-series/simple']);
    });

    it('selects an example by page and name', () => {
        expect(selectExamples(EXAMPLES, ['line-series/markers']).map((e) => e.id)).toEqual([
            'docs/line-series/markers',
        ]);
    });

    it('selects an example by its id', () => {
        expect(selectExamples(EXAMPLES, ['gallery/bar-chart']).map((e) => e.id)).toEqual(['gallery/bar-chart']);
    });

    it('selects every example with a bare name', () => {
        expect(selectExamples(EXAMPLES, ['simple']).map((e) => e.id)).toEqual([
            'docs/bar-series/simple',
            'docs/line-series/simple',
            'gallery/simple',
        ]);
    });

    it('does not select an example whose name merely ends with the argument', () => {
        expect(() => selectExamples(EXAMPLES, ['chart'])).toThrow(/No example matches: chart/);
    });

    it('selects an example once however many arguments match it, in the order of the list', () => {
        const selected = selectExamples(EXAMPLES, ['gallery/simple', 'simple', 'docs/bar-series/simple']);
        expect(selected.map((e) => e.id)).toEqual([
            'docs/bar-series/simple',
            'docs/line-series/simple',
            'gallery/simple',
        ]);
    });

    it('fails when an argument matches nothing, so a typo cannot pass as a green check', () => {
        expect(() => selectExamples(EXAMPLES, ['simpel'])).toThrow('No example matches: simpel');
    });

    it('fails and names every unmatched argument, even when others match', () => {
        expect(() => selectExamples(EXAMPLES, ['simple', 'nope', 'missing/one'])).toThrow(
            'No example matches: nope, missing/one'
        );
    });

    it('fails for an argument that normalises to nothing', () => {
        expect(() => selectExamples(EXAMPLES, ['/'])).toThrow(/No example matches/);
    });
});

describe('parseArgs', () => {
    it('checks every example, mode and framework by default', () => {
        expect(parseArgs([])).toEqual({
            examples: [],
            modes: ['dark-mode', 'plain'],
            frameworks: ['typescript', 'reactFunctionalTs', 'angular', 'vue3'],
        });
        expect(CHECKED_MODES).toEqual(['dark-mode', 'plain']);
        expect(CHECKED_FRAMEWORKS).toEqual(['typescript', 'reactFunctionalTs', 'angular', 'vue3']);
    });

    it('takes examples as a flag, with a comma list or repeated, and as positional arguments', () => {
        expect(parseArgs(['--examples=a,b', '--examples', 'c', 'd']).examples).toEqual(['a', 'b', 'c', 'd']);
    });

    it('takes a subset of modes and frameworks', () => {
        const selection = parseArgs(['--modes=plain', '--frameworks', 'angular,vue3']);
        expect(selection.modes).toEqual(['plain']);
        expect(selection.frameworks).toEqual(['angular', 'vue3']);
    });

    it.each([
        ['--modes=night', /--modes takes a subset of dark-mode, plain; got "night"/],
        ['--frameworks=typescript,svelte', /--frameworks takes a subset of .*; got "svelte"/],
        ['--frameworks=', /--frameworks takes a subset/],
        ['--modes', /--modes takes a subset/],
        ['--bogus', /Unknown option --bogus/],
    ])('rejects %s', (arg, message) => {
        expect(() => parseArgs([arg])).toThrow(message);
    });

    it('rejects an empty subset rather than checking nothing', () => {
        expect(() => parseArgs(['--modes', ','])).toThrow(/--modes takes a subset/);
    });
});

describe('getExportedFiles', () => {
    it('strips the harness code the generator injects, as the exports do', () => {
        const files = getExportedFiles({
            files: {
                'main.ts': `const a = 1;\n${DARK_MODE_START}\nconst dark = true;\n${DARK_MODE_END}\n${CONSOLE_LOG_START}\nconsole.log('x');\n${CONSOLE_LOG_END}\nconst b = 2;`,
            },
        });
        expect(files['main.ts']).not.toContain('dark');
        expect(files['main.ts']).not.toContain('console.log');
        expect(files['main.ts']).toContain('const a = 1;');
        expect(files['main.ts']).toContain('const b = 2;');
    });

    it('adds the framework boilerplate files, which the generator keeps apart', () => {
        const files = getExportedFiles({
            files: { 'app.component.ts': 'export class AppComponent {}' },
            boilerPlateFiles: { 'main.ts': `import { AppComponent } from './app.component';` },
        });
        expect(Object.keys(files).sort()).toEqual(['app.component.ts', 'main.ts']);
    });

    it('drops the synthetic head.html fragment', () => {
        const files = getExportedFiles({ files: { 'main.ts': 'x', 'head.html': '<script></script>' } });
        expect(files).not.toHaveProperty('head.html');
    });

    it('is empty where the generator wrote no files', () => {
        expect(getExportedFiles({})).toEqual({});
    });
});

describe('parseTscOutput', () => {
    const line = (file: string, code = 'TS2322') =>
        `${file}(3,5): error ${code}: Type 'a' is not assignable to type 'b'.`;

    it('attributes a diagnostic to the mode and example of the file it names', () => {
        const [diagnostic] = parseTscOutput('angular', line('angular/dark-mode/docs/bar-series/simple/main.ts'));
        expect(diagnostic.framework).toBe('angular');
        expect(diagnostic.variant).toBe('dark-mode/docs/bar-series/simple/main.ts');
    });

    it('keeps indented continuation lines with the diagnostic above', () => {
        const output = [
            line('vue3/plain/gallery/bar-chart/main.ts'),
            "  Types of property 'x' are incompatible.",
            "    Type 'string' is not assignable to type 'number'.",
            line('vue3/plain/gallery/bar-chart/main.ts', 'TS2345'),
        ].join('\n');
        const diagnostics = parseTscOutput('vue3', output);
        expect(diagnostics).toHaveLength(2);
        expect(diagnostics[0].text).toContain("Type 'string' is not assignable to type 'number'.");
        expect(diagnostics[1].text).toContain('TS2345');
    });

    it('keeps a diagnostic outside the scratch tree, with no variant, so that it still fails the check', () => {
        const diagnostics = parseTscOutput('typescript', line('../../node_modules/ag-charts-community/index.d.ts'));
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].variant).toBeUndefined();
    });

    it('does not attribute a file of another framework to this one', () => {
        const [diagnostic] = parseTscOutput('typescript', line('angular/plain/docs/a/b/main.ts'));
        expect(diagnostic.variant).toBeUndefined();
    });

    it('keeps an error that names no file', () => {
        const diagnostics = parseTscOutput('typescript', "error TS5083: Cannot read file 'tsconfig.json'.");
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].variant).toBeUndefined();
    });

    it('reads windows paths', () => {
        const [diagnostic] = parseTscOutput('typescript', line('typescript\\plain\\docs\\a\\b\\main.ts'));
        expect(diagnostic.variant).toBe('plain\\docs\\a\\b\\main.ts'.replaceAll('\\', '/'));
    });

    it('is empty for a clean run, whatever its line endings', () => {
        expect(parseTscOutput('typescript', '')).toEqual([]);
        expect(parseTscOutput('typescript', '\r\n\r\n')).toEqual([]);
    });

    it('reads CRLF output line by line', () => {
        const output = [line('angular/plain/docs/a/b/main.ts'), line('angular/plain/docs/a/c/main.ts')].join('\r\n');
        expect(parseTscOutput('angular', output).map((d) => d.variant)).toEqual([
            'plain/docs/a/b/main.ts',
            'plain/docs/a/c/main.ts',
        ]);
    });
});

describe('findExamples', () => {
    let root: string;

    const touch = (relative: string) => {
        mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
        writeFileSync(path.join(root, relative), '');
    };

    beforeAll(() => {
        root = mkdtempSync(path.join(tmpdir(), 'find-examples-'));
        touch('docs/line-series/_examples/simple/main.ts');
        touch('docs/bar-series/_examples/stacked/main.ts');
        touch('docs/bar-series/_examples/no-entry/data.ts');
        touch('docs/bar-series/_examples/notes.md');
        touch('docs/no-examples/index.mdoc');
        touch('gallery/_examples/pie/main.ts');
    });

    afterAll(() => rmSync(root, { recursive: true, force: true }));

    it('lists the docs and gallery examples that have a main.ts, in id order', () => {
        expect(findExamples(root).map((e) => e.id)).toEqual([
            'docs/bar-series/stacked',
            'docs/line-series/simple',
            'gallery/pie',
        ]);
    });

    it('gives each its directory, relative to the content root and with _examples', () => {
        expect(findExamples(root).find((e) => e.id === 'gallery/pie')?.dir).toBe(
            path.join('gallery', '_examples', 'pie')
        );
    });

    it('is empty for a root without content', () => {
        expect(findExamples(path.join(root, 'missing'))).toEqual([]);
    });
});

describe('readVariant', () => {
    // The generated tree location is fixed by the generator, so use an example no real page can have.
    const GENERATED = path.resolve(__dirname, '../../../dist/generated-examples/ag-charts-website');
    const ID = 'zz-validate-generated-examples-test';
    const fixture = { id: `docs/${ID}/one`, dir: path.join('docs', ID, '_examples', 'one') };
    const variantDir = (mode: string, framework: string) => path.join(GENERATED, fixture.dir, mode, framework);

    const write = (mode: string, framework: string, files: Record<string, string>) => {
        mkdirSync(variantDir(mode, framework), { recursive: true });
        for (const [name, content] of Object.entries(files)) {
            writeFileSync(path.join(variantDir(mode, framework), name), content);
        }
    };

    beforeAll(() => {
        write('plain', 'typescript', { 'contents.json': JSON.stringify({ files: { 'main.ts': 'export {};' } }) });
        write('plain', 'angular', {
            'contents.json': JSON.stringify({
                files: { 'app.component.ts': 'export class AppComponent {}' },
                boilerPlateFiles: { 'main.ts': 'import "./app.component";' },
            }),
        });
        write('plain', 'vue3', {
            'contents.json': JSON.stringify({ files: { 'main.ts': 'export {};' } }),
            'error.txt': 'Generation failed: boom',
        });
        write('plain', 'reactFunctionalTs', {
            'contents.json': JSON.stringify({ files: { 'index.html': '<div></div>' } }),
        });
        write('plain', 'reactFunctionalTsEmpty', { 'contents.json': JSON.stringify({}) });
        mkdirSync(variantDir('plain', 'missing'), { recursive: true });
        // `dark-mode` has no directory at all
    });

    afterAll(() => rmSync(path.join(GENERATED, 'docs', ID), { recursive: true, force: true }));

    const read = (mode: string, framework: string) =>
        readVariant({ example: fixture, mode, framework } as Parameters<typeof readVariant>[0]);

    it('returns the files of a generated variant', () => {
        expect(read('plain', 'typescript')).toEqual({ 'main.ts': 'export {};\n' });
    });

    it('adds the boilerplate files of a variant', () => {
        expect(Object.keys(read('plain', 'angular')).sort()).toEqual(['app.component.ts', 'main.ts']);
    });

    it('fails a variant whose generation wrote an error.txt, even though contents.json exists', () => {
        expect(() => read('plain', 'vue3')).toThrow(
            new RegExp(`${fixture.id} \\[plain/vue3\\]: generation failed, see .*error\\.txt`)
        );
    });

    it('fails a variant whose directory has no contents.json, and names the example, mode and framework', () => {
        expect(() => read('plain', 'missing')).toThrow(`${fixture.id} [plain/missing]`);
        expect(() => read('plain', 'missing')).toThrow(/contents\.json is missing; run the example's generate-example/);
    });

    it('fails a variant that was never generated', () => {
        expect(() => read('dark-mode', 'typescript')).toThrow(/contents\.json is missing/);
    });

    it('fails a variant with no TypeScript files, rather than checking nothing', () => {
        expect(() => read('plain', 'reactFunctionalTs')).toThrow(
            `${fixture.id} [plain/reactFunctionalTs]: no TypeScript files`
        );
        expect(() => read('plain', 'reactFunctionalTsEmpty')).toThrow(/no TypeScript files/);
    });
});

describe('main', () => {
    it('fails for an example argument that matches nothing, before it type-checks anything', async () => {
        await expect(main(['--examples=zz-no-such-example'])).rejects.toThrow('No example matches: zz-no-such-example');
    });

    it('fails for a subset it does not know', async () => {
        await expect(main(['--frameworks=svelte'])).rejects.toThrow(/--frameworks takes a subset/);
    });
});
