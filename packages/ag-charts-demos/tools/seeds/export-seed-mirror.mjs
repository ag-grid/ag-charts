#!/usr/bin/env node
/* eslint-disable no-console */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    MANIFEST_FILENAME,
    PIN_SOURCE,
    SEEDS_DIR,
    WORKSPACE_ROOT,
    humanLabel,
    listSourceFiles,
    readDemoIds,
    readJson,
    toPosix,
} from './seed-common.mjs';

/**
 * Builds the tree published to the `ag-grid/ag-charts-demos` mirror, one folder per seed at
 * `<demo>/<framework>/`, so StackBlitz can import a seed without first downloading the whole of
 * `ag-grid/ag-charts`. `.github/workflows/demo-seeds-mirror.yml` runs it after each staging deploy
 * (the mirror's `staging`), on every push to a release branch (its `bX.Y.Z`) and on every release
 * tag (its `release-X.Y.Z` and, for the newest release, its `latest`), and publishes the result
 * there. The mirror is one-way: nothing is ever read back from it.
 *
 * Its root follows `ag-grid/ag-grid-demos`: a README listing every demo and framework with a
 * support section, a README per demo, `.gitignore` and `.vscode/settings.json`, plus the MIT
 * `LICENSE.txt` the demos package is published under.
 *
 * With `--charts-build <prefix>`, the `ag-charts-*` dependencies of every seed pinned to the `latest`
 * dist-tag are exported pointing at the build tarballs a docs site serves under `<prefix>` (see
 * `rewriteChartsBuildPins`), so the seed installs the build that site was made from rather than the
 * last release. The committed seeds are never touched.
 *
 * Usage: node export-seed-mirror.mjs --out <empty folder> --ref <ag-charts branch or tag>
 *                                    [--charts-build <tarball base URL>]
 */

export const SOURCE_REPOSITORY = 'ag-grid/ag-charts';
export const MIRROR_REPOSITORY = 'ag-grid/ag-charts-demos';

/** The AG Charts packages a docs site serves as `<site>/npm-packages/<name>.tgz`, and so a seed may depend on. */
export const CHARTS_BUILD_PACKAGES = [
    'ag-charts-types',
    'ag-charts-core',
    'ag-charts-locale',
    'ag-charts-community',
    'ag-charts-enterprise',
    'ag-charts-react',
    'ag-charts-angular',
    'ag-charts-vue3',
];
/**
 * Overridden in every rewritten seed, so a package that reaches the seed only through another one
 * resolves to the same build: `ag-grid-community` depends on `ag-charts-types` and
 * `ag-grid-enterprise` has the AG Charts packages as optional dependencies, and without an override
 * npm nests the published version beside the tarball's, or fails to find it.
 */
export const CHARTS_BUILD_SHARED_PACKAGES = [
    'ag-charts-types',
    'ag-charts-core',
    'ag-charts-locale',
    'ag-charts-community',
    'ag-charts-enterprise',
];
const CHARTS_BUILD_DEPENDENCY_SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies'];

/** The MIT licence text the demos package declares, as its community package states it. */
const LICENSE_PATH = join(WORKSPACE_ROOT, 'packages', 'ag-charts-community', 'LICENSE.txt');
/** Where the seeds live in the source repository, for links back to it. */
const SEEDS_REPO_PATH = 'packages/ag-charts-demos/seeds';
/** The showcase page the demos run on, the production site's `examples/` page. */
const SHOWCASE_URL = 'https://www.ag-grid.com/charts/examples/';

/** `ag-grid/ag-grid-demos`' root `.gitignore`, plus `dist`, which the seeds build into. */
const GITIGNORE = [
    'node_modules',
    'package-lock.json',
    '.vite',
    '.idea',
    'dist',
    'dist-*',
    '.agents',
    '.claude',
    'skills-lock.json',
];

/** `ag-grid/ag-grid-demos`' editor settings, at the 4-space indent the seeds are formatted with. */
const VSCODE_SETTINGS = { 'editor.insertSpaces': true, 'editor.tabSize': 4, 'editor.formatOnSave': true };

/** The order the website lists frameworks in (`SEED_FRAMEWORK_ORDER` in `seedLinks.ts`). */
const FRAMEWORKS = [
    ['react', 'React'],
    ['angular', 'Angular'],
    ['vue', 'Vue'],
    ['typescript', 'TypeScript'],
];
const FRAMEWORK_LABEL = new Map(FRAMEWORKS);
const frameworkRank = (framework) => {
    const rank = FRAMEWORKS.findIndex(([id]) => id === framework);
    return rank === -1 ? FRAMEWORKS.length : rank;
};

/**
 * The seeds to publish, as `{ demo, framework }`: every folder carrying a `.seed-manifest.json`,
 * demos in registry order, frameworks in the website's order. A framework the website does not
 * know yet sorts last rather than being dropped, so a new port still reaches the mirror.
 */
export function listMirroredSeeds({ seedsDir = SEEDS_DIR, demoIds = readDemoIds() } = {}) {
    const seeds = [];
    for (const demo of demoIds) {
        const demoDir = join(seedsDir, demo);
        if (!existsSync(demoDir)) continue;
        const frameworks = readdirSync(demoDir)
            .filter((name) => existsSync(join(demoDir, name, MANIFEST_FILENAME)))
            .sort((a, b) => frameworkRank(a) - frameworkRank(b) || a.localeCompare(b));
        seeds.push(...frameworks.map((framework) => ({ demo, framework })));
    }
    return seeds;
}

const isRelativeLink = (target) => target !== '' && !/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(target);

/**
 * `markdown` with every relative link that leaves the mirrored tree turned into an absolute link
 * to the same file or folder in `ag-grid/ag-charts` at `ref`. A link that stays inside the tree is
 * kept, so it still works in the mirror. `file` is the document's path relative to `seedsDir`,
 * and `mirrored` holds the paths (relative to `seedsDir`) of everything the mirror carries.
 * A link to a path that exists in neither is an error rather than a broken link.
 */
export function rewriteMarkdownLinks(markdown, { file, ref, mirrored, seedsDir = SEEDS_DIR }) {
    const isMirrored = (path) =>
        mirrored.has(path) || [...mirrored].some((mirroredPath) => mirroredPath.startsWith(`${path}/`));
    return markdown.replace(/\]\(([^)\s]+)\)/g, (link, target) => {
        if (!isRelativeLink(target)) return link;
        const [path, fragment] = target.split(/(?=#)/);
        const resolved = posix.normalize(posix.join(posix.dirname(file), path)).replace(/\/$/, '');
        if (!resolved.startsWith('../') && isMirrored(resolved)) return link;

        const onDisk = join(seedsDir, resolved);
        if (!existsSync(onDisk)) {
            throw new Error(`${file}: link "${target}" points at ${resolved}, which does not exist`);
        }
        const kind = statSync(onDisk).isDirectory() ? 'tree' : 'blob';
        const repoPath = posix.normalize(posix.join(SEEDS_REPO_PATH, resolved));
        return `](https://github.com/${SOURCE_REPOSITORY}/${kind}/${ref}/${repoPath}${fragment ?? ''})`;
    });
}

/**
 * `packageJson` with every `ag-charts-*` dependency pointing at `<prefix>/<name>.tgz`, plus an
 * `overrides` entry with the same URL for the shared AG Charts packages and for the seed's own
 * wrapper (`ag-charts-react`, `-angular` or `-vue3`; a TypeScript seed has none). Overrides the
 * package already has are kept. `prefix` is the docs site's `npm-packages` URL, with or without a
 * trailing slash. A dependency that is not one of `CHARTS_BUILD_PACKAGES` has no tarball and is an
 * error rather than a dependency that cannot be installed.
 */
export function rewriteChartsBuildPins(packageJson, prefix) {
    const base = prefix.replace(/\/+$/, '');
    const urlOf = (name) => `${base}/${name}.tgz`;
    const result = { ...packageJson };
    const overridden = new Set(CHARTS_BUILD_SHARED_PACKAGES);
    for (const section of CHARTS_BUILD_DEPENDENCY_SECTIONS) {
        if (!packageJson[section]) continue;
        result[section] = Object.fromEntries(
            Object.entries(packageJson[section]).map(([name, version]) => {
                if (!name.startsWith('ag-charts-')) return [name, version];
                if (!CHARTS_BUILD_PACKAGES.includes(name)) {
                    throw new Error(
                        `${name} has no build tarball (${section}); expected one of ${CHARTS_BUILD_PACKAGES}`
                    );
                }
                overridden.add(name);
                return [name, urlOf(name)];
            })
        );
    }
    result.overrides = {
        ...packageJson.overrides,
        ...Object.fromEntries(
            CHARTS_BUILD_PACKAGES.filter((name) => overridden.has(name)).map((name) => [name, urlOf(name)])
        ),
    };
    return result;
}

function renderRootReadme(seeds, ref) {
    const rows = seeds.map(
        ({ demo, framework }) =>
            `| ${humanLabel(demo)} | ${FRAMEWORK_LABEL.get(framework) ?? framework} | [\`${demo}/${framework}\`](./${demo}/${framework}) |`
    );
    return `# AG Charts Demos

Demo apps for the AG Charts examples showcased on ${SHOWCASE_URL}.

This repository is generated from
[\`${SEEDS_REPO_PATH}\`](https://github.com/${SOURCE_REPOSITORY}/tree/${ref}/${SEEDS_REPO_PATH}) in
[${SOURCE_REPOSITORY}](https://github.com/${SOURCE_REPOSITORY}), and each sync replaces its content:
raise changes there rather than here.

## Demos and Frameworks

| Demo | Framework | Path |
| ---- | --------- | ---- |
${rows.join('\n')}

## Running a demo

Each demo is a standalone project. From its folder:

\`\`\`bash
npm install
npm run dev
\`\`\`

## Support

### Enterprise Support

AG Charts Enterprise customers have access to dedicated support via [ZenDesk](https://ag-grid.zendesk.com/hc/en-us), which is monitored by our support & engineering teams.

### Bug Reports

Please file bugs in the main AG Charts repository:
https://github.com/${SOURCE_REPOSITORY}/issues
`;
}

function renderDemoReadme(demo, frameworks) {
    const items = frameworks.map((framework) => `- [${FRAMEWORK_LABEL.get(framework) ?? framework}](./${framework}/)`);
    return `# AG Charts demo: ${humanLabel(demo)}

Available in the following frameworks:

${items.join('\n')}
`;
}

/**
 * Writes the mirror's tree into `outDir`, which must be empty or not exist yet, and returns the
 * paths written relative to it, sorted. `ref` is the `ag-grid/ag-charts` branch or tag the tree is
 * built from; links back to the source repository point at it. `chartsBuild`, when given, is the
 * base URL of the AG Charts build tarballs; the `package.json` of every seed whose manifest has
 * `pinSource` `dist-tag` is then rewritten to install them (`rewriteChartsBuildPins`). Seeds pinned
 * to a release are copied as they are.
 */
export function exportSeedMirror({
    outDir,
    ref,
    chartsBuild,
    seedsDir = SEEDS_DIR,
    demoIds = readDemoIds(),
    licensePath = LICENSE_PATH,
    listSeedFiles = listSourceFiles,
}) {
    if (!ref) throw new Error('A source ref (--ref) is required');
    if (chartsBuild !== undefined && !/^https?:\/\/[^\s/]/.test(chartsBuild)) {
        throw new Error(`--charts-build needs an http(s) URL, got "${chartsBuild}"`);
    }
    if (existsSync(outDir) && readdirSync(outDir).length > 0) {
        throw new Error(`${outDir} is not empty`);
    }
    const seeds = listMirroredSeeds({ seedsDir, demoIds });
    if (seeds.length === 0) throw new Error(`No seeds with a ${MANIFEST_FILENAME} under ${seedsDir}`);

    // Everything copied from the seeds folder, relative to it: each seed's files, plus the demo's
    // `<framework>.PORTING.md` notes that the port READMEs link to.
    const copied = [];
    for (const { demo, framework } of seeds) {
        copied.push(...listSeedFiles(join(seedsDir, demo, framework)).map((file) => `${demo}/${framework}/${file}`));
        const porting = `${demo}/${framework}.PORTING.md`;
        if (existsSync(join(seedsDir, porting))) copied.push(porting);
    }
    const mirrored = new Set(copied);

    const rewrittenPackageJsons = new Set();
    if (chartsBuild !== undefined) {
        for (const { demo, framework } of seeds) {
            const manifest = readJson(join(seedsDir, demo, framework, MANIFEST_FILENAME));
            if (manifest.pinSource === PIN_SOURCE.distTag)
                rewrittenPackageJsons.add(`${demo}/${framework}/package.json`);
        }
    }

    const written = [];
    const write = (path, content) => {
        const target = join(outDir, path);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, content);
        written.push(path);
    };
    for (const path of copied) {
        const source = join(seedsDir, path);
        if (path.endsWith('.md')) {
            write(path, rewriteMarkdownLinks(readFileSync(source, 'utf8'), { file: path, ref, mirrored, seedsDir }));
        } else if (rewrittenPackageJsons.has(path)) {
            const packageJson = rewriteChartsBuildPins(readJson(source), chartsBuild);
            write(path, `${JSON.stringify(packageJson, null, 2)}\n`);
        } else {
            mkdirSync(dirname(join(outDir, path)), { recursive: true });
            copyFileSync(source, join(outDir, path));
            written.push(path);
        }
    }

    const demos = [...new Set(seeds.map(({ demo }) => demo))];
    for (const demo of demos) {
        const frameworks = seeds.filter((seed) => seed.demo === demo).map(({ framework }) => framework);
        write(`${demo}/README.md`, renderDemoReadme(demo, frameworks));
    }
    write('README.md', renderRootReadme(seeds, ref));
    write('LICENSE.txt', readFileSync(licensePath, 'utf8'));
    write('.gitignore', `${GITIGNORE.join('\n')}\n`);
    write('.vscode/settings.json', `${JSON.stringify(VSCODE_SETTINGS, null, 2)}\n`);
    return written.map(toPosix).sort();
}

function parseArgs(argv) {
    const args = {};
    for (let index = 0; index < argv.length; index += 1) {
        const flag = argv[index];
        if (flag !== '--out' && flag !== '--ref' && flag !== '--charts-build')
            throw new Error(`Unknown argument "${flag}"`);
        const value = argv[index + 1];
        if (!value || value.startsWith('--')) throw new Error(`${flag} needs a value`);
        args[flag.slice(2).replace(/-(\w)/g, (_, letter) => letter.toUpperCase())] = value;
        index += 1;
    }
    if (!args.out || !args.ref)
        throw new Error(
            'Usage: export-seed-mirror.mjs --out <empty folder> --ref <ref> [--charts-build <tarball base URL>]'
        );
    return args;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    try {
        const { out, ref, chartsBuild } = parseArgs(process.argv.slice(2));
        const written = exportSeedMirror({ outDir: out, ref, chartsBuild });
        console.log(`Wrote ${written.length} files for ${MIRROR_REPOSITORY} at ${ref} to ${out}`);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}
