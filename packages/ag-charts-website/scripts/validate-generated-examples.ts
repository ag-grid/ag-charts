/* eslint-disable no-console */
/** Type-checks the generated framework variants of every example. See `.rulesync/rules/generated-examples.md`. */
import { stripOutExampleGeneratorCode } from '@components/example-runner/components/stripOutExampleGeneratorCode';
import { spawn } from 'child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'fs';
import { mkdir, mkdtemp, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export const CHECKED_FRAMEWORKS = ['typescript', 'reactFunctionalTs', 'angular', 'vue3'] as const;
export const CHECKED_MODES = ['dark-mode', 'plain'] as const;

export type CheckedFramework = (typeof CHECKED_FRAMEWORKS)[number];

/** The files users run, which a variant must contain, by name: other `.ts` files alone are not a variant. */
export const ENTRY_FILES: Record<CheckedFramework, readonly string[]> = {
    typescript: ['main.ts'],
    reactFunctionalTs: ['index.tsx'],
    angular: ['main.ts', 'app.component.ts'],
    vue3: ['main.ts'],
};
export type CheckedMode = (typeof CHECKED_MODES)[number];

export interface ExampleRef {
    /** `docs/<page>/<name>` or `gallery/<name>`: the path under `src/content` without `_examples`. */
    id: string;
    /** The example's directory, relative to `src/content`, with `_examples`. */
    dir: string;
}

export interface Variant {
    example: ExampleRef;
    mode: CheckedMode;
    framework: CheckedFramework;
}

export interface Selection {
    examples: string[];
    modes: CheckedMode[];
    frameworks: CheckedFramework[];
}

interface GeneratedContents {
    files?: Record<string, string>;
    boilerPlateFiles?: Record<string, string>;
}

const CONTENT_ROOT_FROM_WEBSITE = 'src/content';
const WEBSITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORKSPACE_ROOT = path.resolve(WEBSITE_ROOT, '../..');
const GENERATED_ROOT = path.join(WORKSPACE_ROOT, 'dist/generated-examples/ag-charts-website');
/** Each run writes into a directory of its own under here, so concurrent runs cannot clobber each other. */
const SCRATCH_PARENT = path.join(WORKSPACE_ROOT, 'dist/validate-generated-examples');

/** Every example directory, with a `main.ts`, of the docs pages and the gallery. */
export function findExamples(contentRoot: string): ExampleRef[] {
    const examples: ExampleRef[] = [];
    const add = (dir: string, id: string) => {
        if (existsSync(path.join(contentRoot, dir, 'main.ts'))) examples.push({ id, dir });
    };

    const docsRoot = path.join(contentRoot, 'docs');
    for (const page of readDirectories(docsRoot)) {
        const examplesDir = path.join('docs', page, '_examples');
        for (const name of readDirectories(path.join(contentRoot, examplesDir))) {
            add(path.join(examplesDir, name), `docs/${page}/${name}`);
        }
    }
    const galleryDir = path.join('gallery', '_examples');
    for (const name of readDirectories(path.join(contentRoot, galleryDir))) {
        add(path.join(galleryDir, name), `gallery/${name}`);
    }

    return examples.sort((a, b) => a.id.localeCompare(b.id));
}

function readDirectories(dir: string): string[] {
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
}

/** Reduce a path, `<page>/<name>` or `<name>` to the form `ExampleRef.id` ends with. */
export function normaliseExampleArg(arg: string): string {
    return arg
        .replaceAll('\\', '/')
        .replace(/^.*src\/content\//, '')
        .replace(/\/_examples\//, '/')
        .replace(/\/(main\.ts)?$/, '')
        .replace(/^\.?\//, '');
}

/**
 * The examples a list of arguments selects. An argument matches an id exactly or as a trailing run of
 * its path segments, and one that matches nothing is an error, so a typo cannot pass as a green check.
 */
export function selectExamples(all: ExampleRef[], args: string[]): ExampleRef[] {
    if (args.length === 0) return all;

    const selected = new Set<ExampleRef>();
    const unmatched: string[] = [];
    for (const arg of args) {
        const wanted = normaliseExampleArg(arg);
        const matches = wanted === '' ? [] : all.filter((e) => e.id === wanted || e.id.endsWith(`/${wanted}`));
        if (matches.length === 0) unmatched.push(arg);
        matches.forEach((m) => selected.add(m));
    }
    if (unmatched.length > 0) {
        throw new Error(`No example matches: ${unmatched.join(', ')}`);
    }
    return all.filter((e) => selected.has(e));
}

export function parseArgs(argv: string[]): Selection {
    const list = (value: string) => value.split(',').filter((v) => v !== '');
    const selection: Selection = { examples: [], modes: [...CHECKED_MODES], frameworks: [...CHECKED_FRAMEWORKS] };

    const pick = <T extends string>(name: string, value: string, allowed: readonly T[]): T[] => {
        const values = list(value);
        const unknown = values.filter((v) => !allowed.includes(v as T));
        if (values.length === 0 || unknown.length > 0) {
            throw new Error(`--${name} takes a subset of ${allowed.join(', ')}; got "${unknown.join(',') || value}"`);
        }
        return values as T[];
    };

    for (let i = 0; i < argv.length; i++) {
        const [flag, inline] = argv[i].split(/=(.*)/s);
        const value = () => inline ?? argv[++i] ?? '';
        if (flag === '--examples') {
            selection.examples.push(...list(value()));
        } else if (flag === '--modes') {
            selection.modes = pick('modes', value(), CHECKED_MODES);
        } else if (flag === '--frameworks') {
            selection.frameworks = pick('frameworks', value(), CHECKED_FRAMEWORKS);
        } else if (flag.startsWith('--')) {
            throw new Error(`Unknown option ${flag}`);
        } else {
            selection.examples.push(argv[i]);
        }
    }
    return selection;
}

/**
 * The files of a variant as an export writes them (see `OpenInPlunkr`): everything the generator
 * wrote with the harness stripped, plus the framework boilerplate (Angular's `main.ts`).
 */
export function getExportedFiles(contents: GeneratedContents): Record<string, string> {
    const files = { ...contents.files };
    stripOutExampleGeneratorCode(files);
    return { ...files, ...contents.boilerPlateFiles };
}

export function readVariant(variant: Variant, generatedRoot = GENERATED_ROOT): Record<string, string> {
    const variantDir = path.join(generatedRoot, variant.example.dir, variant.mode, variant.framework);
    const label = `${variant.example.id} [${variant.mode}/${variant.framework}]`;

    const errorFile = path.join(variantDir, 'error.txt');
    if (existsSync(errorFile)) {
        throw new Error(`${label}: generation failed, see ${path.relative(WORKSPACE_ROOT, errorFile)}`);
    }
    const contentsFile = path.join(variantDir, 'contents.json');
    if (!existsSync(contentsFile)) {
        throw new Error(
            `${label}: ${path.relative(WORKSPACE_ROOT, contentsFile)} is missing; run the example's generate-example target`
        );
    }

    const contents = JSON.parse(readFileSync(contentsFile, 'utf8')) as GeneratedContents;
    const files = getExportedFiles(contents);
    const missing = ENTRY_FILES[variant.framework].filter((name) => !(name in files));
    if (missing.length > 0) {
        throw new Error(`${label}: ${path.relative(WORKSPACE_ROOT, contentsFile)} lacks ${missing.join(', ')}`);
    }
    return files;
}

function scratchDir(scratchRoot: string, variant: Variant) {
    return path.join(scratchRoot, variant.framework, variant.mode, variant.example.id);
}

/** What `tsc` needs beyond `tsconfig.examples.json`, which the source check also uses. */
const FRAMEWORK_COMPILER_OPTIONS: Record<CheckedFramework, Record<string, unknown>> = {
    typescript: {},
    reactFunctionalTs: { jsx: 'react-jsx' },
    angular: { experimentalDecorators: true, useDefineForClassFields: false },
    vue3: {},
};

export function frameworkTsconfig(framework: CheckedFramework, scratchRoot: string) {
    const websiteRelative = path.relative(path.join(scratchRoot, framework), WEBSITE_ROOT);
    const workspaceRelative = path.relative(path.join(scratchRoot, framework), WORKSPACE_ROOT);
    const types = (pkg: string, entry = 'src/main.d.ts') => [
        `${workspaceRelative}/packages/${pkg}/dist/types/${entry}`,
    ];

    return {
        extends: `${websiteRelative}/tsconfig.examples.json`,
        compilerOptions: {
            ...FRAMEWORK_COMPILER_OPTIONS[framework],
            // Each variant is a project of its own, so give every file module scope and keep one
            // example's top-level names from colliding with another's.
            moduleDetection: 'force',
            noUnusedParameters: true,
            // `paths` resolve against `baseUrl`, which the root tsconfig sets to the workspace root. Pin it
            // here so they resolve against this file, or a miss falls back to the linked packages.
            baseUrl: '.',
            paths: {
                'ag-charts-community': types('ag-charts-community'),
                'ag-charts-enterprise': types('ag-charts-enterprise'),
                'ag-charts-locale': types('ag-charts-locale'),
                'ag-charts-react': types('ag-charts-react', 'src/index.d.ts'),
                'ag-charts-vue3': types('ag-charts-vue3', 'src/index.d.ts'),
                'ag-charts-angular': [
                    `${workspaceRelative}/packages/ag-charts-angular/dist/ag-charts-angular/types/ag-charts-angular.d.ts`,
                ],
            },
        },
        files: [],
        include: ['**/*.ts', '**/*.tsx'],
    };
}

export interface TscResult {
    framework: CheckedFramework;
    output: string;
    exitCode: number;
}

export function runTsc(framework: CheckedFramework, scratchRoot: string): Promise<TscResult> {
    const tsc = path.join(WORKSPACE_ROOT, 'node_modules/typescript/bin/tsc');
    const project = path.join(scratchRoot, framework, 'tsconfig.json');
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [tsc, '-p', project, '--pretty', 'false', '--noEmit'], {
            cwd: scratchRoot,
        });
        let output = '';
        child.stdout.on('data', (chunk) => (output += chunk));
        child.stderr.on('data', (chunk) => (output += chunk));
        child.on('error', reject);
        child.on('close', (code) => resolve({ framework, output, exitCode: code ?? 1 }));
    });
}

export interface Diagnostic {
    framework: CheckedFramework;
    /** `<mode>/<example id>` for a variant file, or `undefined` for a project-level error. */
    variant: string | undefined;
    text: string;
}

/**
 * Attribute `tsc` output to the variant it came from. A diagnostic's continuation lines (indented)
 * stay with the diagnostic above; one whose file is outside the scratch tree is kept with no variant,
 * so it still fails the check.
 */
export function parseTscOutput(framework: CheckedFramework, output: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    for (const line of output.split(/\r?\n/)) {
        if (line.trim() === '') continue;
        if (/^\s/.test(line) && diagnostics.length > 0) {
            diagnostics[diagnostics.length - 1].text += `\n${line}`;
            continue;
        }
        const file = /^(.+?)\(\d+,\d+\): /.exec(line)?.[1];
        const prefix = `${framework}/`;
        const normalised = file?.replaceAll('\\', '/');
        const variant = normalised?.startsWith(prefix) ? normalised.slice(prefix.length) : undefined;
        diagnostics.push({ framework, variant, text: line });
    }
    return diagnostics;
}

async function writeVariants(variants: Variant[], generatedRoot: string, scratchRoot: string) {
    const problems: string[] = [];
    for (const variant of variants) {
        let files: Record<string, string>;
        try {
            files = readVariant(variant, generatedRoot);
        } catch (error) {
            problems.push(String((error as Error).message));
            continue;
        }
        const dir = scratchDir(scratchRoot, variant);
        await mkdir(dir, { recursive: true });
        await Promise.all(
            Object.entries(files)
                .filter(([name]) => /\.(ts|tsx|json)$/.test(name))
                .map(([name, content]) => writeFile(path.join(dir, name), content))
        );
    }
    return problems;
}

export async function main(argv: string[]): Promise<number> {
    const selection = parseArgs(argv);
    const examples = selectExamples(
        findExamples(path.join(WEBSITE_ROOT, CONTENT_ROOT_FROM_WEBSITE)),
        selection.examples
    );
    if (examples.length === 0) {
        console.error('No examples found under src/content.');
        return 1;
    }

    const variants: Variant[] = examples.flatMap((example) =>
        selection.modes.flatMap((mode) => selection.frameworks.map((framework) => ({ example, mode, framework })))
    );

    return checkVariants(variants, selection.frameworks);
}

/** Print the `tsc` results, attributing each error to its variant, and say whether any variant failed. */
export function reportResults(results: TscResult[]): boolean {
    let failed = false;
    for (const { framework, output, exitCode } of results) {
        const diagnostics = parseTscOutput(framework, output);
        if (exitCode === 0 && diagnostics.length === 0) {
            console.log(`  ${framework}: ok`);
            continue;
        }
        failed = true;
        const byVariant = new Map<string, Diagnostic[]>();
        for (const d of diagnostics) {
            const key = d.variant ?? '(project)';
            byVariant.set(key, [...(byVariant.get(key) ?? []), d]);
        }
        if (diagnostics.length === 0) byVariant.set('(project)', [{ framework, variant: undefined, text: output }]);
        console.error(`  ${framework}: ${diagnostics.length} error(s) in ${byVariant.size} variant(s)`);
        for (const [variant, list] of byVariant) {
            console.error(`    ${framework} :: ${variant}`);
            list.forEach((d) => console.error(`      ${d.text.replaceAll('\n', '\n      ')}`));
        }
    }
    return failed;
}

/**
 * Write the variants out and type-check them, one `tsc` per framework. Returns the exit code: 1 if a
 * variant cannot be read or has a type error, otherwise 0. A run that fails in `tsc` keeps its scratch tree.
 */
export async function checkVariants(
    variants: Variant[],
    frameworks: readonly CheckedFramework[],
    generatedRoot = GENERATED_ROOT
): Promise<number> {
    await mkdir(SCRATCH_PARENT, { recursive: true });
    const scratchRoot = await mkdtemp(path.join(SCRATCH_PARENT, 'run-'));
    let keepScratch = false;
    try {
        const problems = await writeVariants(variants, generatedRoot, scratchRoot);
        if (problems.length > 0) {
            console.error(`${problems.length} generated variant(s) cannot be checked:`);
            problems.slice(0, 50).forEach((p) => console.error(`  ${p}`));
            if (problems.length > 50) console.error(`  ... and ${problems.length - 50} more`);
            return 1;
        }

        for (const framework of frameworks) {
            await writeFile(
                path.join(scratchRoot, framework, 'tsconfig.json'),
                JSON.stringify(frameworkTsconfig(framework, scratchRoot), null, 2)
            );
        }

        const modes = new Set(variants.map((v) => v.mode)).size;
        const examples = new Set(variants.map((v) => v.example.id)).size;
        console.log(
            `Type-checking ${variants.length} generated variants (${examples} examples x ${modes} modes x ${frameworks.length} frameworks)...`
        );
        const results = await Promise.all(frameworks.map((framework) => runTsc(framework, scratchRoot)));
        keepScratch = reportResults(results);
        if (keepScratch) console.error(`Checked files kept in ${scratchRoot}`);
        return keepScratch ? 1 : 0;
    } finally {
        if (!keepScratch) rmSync(scratchRoot, { recursive: true, force: true });
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main(process.argv.slice(2)).then(
        (code) => {
            process.exitCode = code;
        },
        (error) => {
            console.error(error instanceof Error ? error.message : error);
            process.exitCode = 1;
        }
    );
}
