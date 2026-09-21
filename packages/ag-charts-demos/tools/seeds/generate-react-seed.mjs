#!/usr/bin/env node
/* eslint-disable no-console */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

import {
    DEMOS_ROOT,
    DEMOS_SRC_DIR,
    MANIFEST_FILENAME,
    SEEDS_DIR,
    WORKSPACE_ROOT,
    hashDemoSource,
    listFiles,
    readDemoIds,
    readDemoSourceCommit,
    readJson,
    toPosix,
} from './seed-common.mjs';

/**
 * Generates the React seed project for each demo app: a standalone Vite application under
 * `seeds/<id>/react/` that StackBlitz (or `npm install && npm run dev`) can run with no edits.
 *
 * The demo source under `src/demos/<id>/` is the hand-maintained golden master; this copies it
 * into the seed's `src/` and emits the scaffolding around it. Nothing in a seed may reference a
 * path above its own root, because StackBlitz imports only the seed folder from GitHub.
 *
 * Usage: node tools/seeds/generate-react-seed.mjs [--out <dir>] [<demo-id> ...]
 *   --out   Write below this directory instead of `seeds/` (the freshness check uses this).
 */

export const FRAMEWORK = 'react';

/** Test files stay with the workspace: the seed has no test runner and vitest is not a seed dependency. */
const EXCLUDED_SOURCE = /\.(test|spec)\.[cm]?[jt]sx?$/;

/** Files the generator owns beside the copied source; anything else in the target is removed. */
const PRESERVED_IN_TARGET = new Set(['node_modules', 'dist']);

/** Packages the seed always needs regardless of what the demo imports. */
const RUNTIME_ALWAYS = ['react', 'react-dom'];

/** Bare import specifier -> package name (`@scope/name` or `name`), dropping any subpath. */
function toPackageName(specifier) {
    const parts = specifier.split('/');
    return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/** Every bare (non-relative) package a set of source files imports. */
function collectImportedPackages(dir, files) {
    const packages = new Set();
    const importPattern =
        /\b(?:import|export)\b[^'"]*?\bfrom\s*['"]([^'".][^'"]*)['"]|\bimport\s*['"]([^'".][^'"]*)['"]/g;
    for (const file of files) {
        if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
        const source = readFileSync(join(dir, file), 'utf8');
        for (const match of source.matchAll(importPattern)) {
            packages.add(toPackageName(match[1] ?? match[2]));
        }
    }
    return packages;
}

function humanLabel(demoId) {
    return demoId
        .split('-')
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' ');
}

/** Dependency ranges for the seed: exact `ag-charts-*` pins, everything else as the demos package declares it. */
function buildDependencies(demoId, imported) {
    const demosPackage = readJson(join(DEMOS_ROOT, 'package.json'));
    const chartsVersion = readJson(join(WORKSPACE_ROOT, 'packages', 'ag-charts-community', 'package.json')).version;

    const dependencies = {};
    for (const name of [...imported, ...RUNTIME_ALWAYS].sort()) {
        if (name.startsWith('ag-charts-')) {
            dependencies[name] = chartsVersion;
        } else if (demosPackage.dependencies[name]) {
            dependencies[name] = demosPackage.dependencies[name];
        } else {
            throw new Error(
                `src/demos/${demoId} imports "${name}", which packages/ag-charts-demos/package.json does not declare`
            );
        }
    }
    return { dependencies, devDependencies: readDevDependencies(demosPackage) };
}

function readDevDependencies(demosPackage) {
    const rootPackage = readJson(join(WORKSPACE_ROOT, 'package.json'));
    return {
        '@types/react': demosPackage.devDependencies['@types/react'],
        '@types/react-dom': demosPackage.devDependencies['@types/react-dom'],
        typescript: rootPackage.devDependencies.typescript,
        vite: demosPackage.devDependencies.vite,
    };
}

function renderPackageJson(demoId, { dependencies, devDependencies }) {
    return {
        name: `ag-charts-demo-${demoId}-${FRAMEWORK}`,
        version: '0.0.0',
        private: true,
        license: 'MIT',
        scripts: {
            dev: 'vite',
            build: 'vite build',
            preview: 'vite preview',
        },
        dependencies,
        devDependencies,
    };
}

// Mirrors packages/ag-charts-demos/tsconfig.json without its `extends`: a seed cannot reach
// the workspace's tsconfig.base.json, and the `paths` there point at workspace sources anyway.
// Written as text so the committed file is already in the repository's Prettier style.
const TSCONFIG = `{
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "node",
    "target": "esnext",
    "lib": ["es2023", "dom", "dom.iterable"],
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "strict": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "vite.config.ts"]
}
`;

const VITE_CONFIG = `import { defineConfig } from 'vite';

export default defineConfig({
    // JSX is handled by Vite's built-in esbuild transform (automatic runtime), so
    // @vitejs/plugin-react is not needed for this demo.
    esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
});
`;

const renderIndexHtml = (demoId) => `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>AG Charts demo: ${humanLabel(demoId)} (React)</title>
    </head>
    <body>
        <div id="root"></div>
        <script type="module" src="/src/main.tsx"></script>
    </body>
</html>
`;

const renderMainTsx = (demoId) => `import { createRoot } from 'react-dom/client';

import { AllCommunityModule, ModuleRegistry } from 'ag-charts-community';

import Demo from './index';

// The demo registers the modules it needs in ./index.tsx; the community bundle is
// registered here as well so every demo starts from the same baseline.
ModuleRegistry.registerModules([AllCommunityModule]);

const container = document.getElementById('root');
if (!container) {
    throw new Error('Root container #root not found');
}

createRoot(container).render(
    <main data-demo-id="${demoId}">
        <Demo />
    </main>
);
`;

const renderVendoredNote = (vendored) =>
    vendored.length === 0
        ? ''
        : `
Files under \`src/vendored/\` are copied from sibling demos that this one shares source with:
${vendored.map((file) => `\n-   \`src/demos/${file}\``).join('')}
`;

const renderReadme = (demoId, vendored) => `# AG Charts demo: ${humanLabel(demoId)} (React)

A standalone Vite + React project running the AG Charts "${humanLabel(demoId)}" demo app. Use it
to see how the demo is built, or as the starting point for an application of your own.

## Run it

\`\`\`sh
npm install
npm run dev
\`\`\`

\`npm run build\` produces a production bundle in \`dist/\`; \`npm run preview\` serves it.

## About this folder

This project is generated from the React demo source in
[\`packages/ag-charts-demos/src/demos/${demoId}\`](../../../src/demos/${demoId}) by
\`tools/seeds/generate-react-seed.mjs\`. The demo source lives in \`src/\`, with \`src/main.tsx\`
mounting it. Do not edit the seed in place: change the demo source and regenerate.
${renderVendoredNote(vendored)}
The \`ag-charts-*\` dependencies are pinned to the exact version the demo was generated against.
AG Charts Enterprise features show a watermark until a licence key is set.
`;

const GITIGNORE = `node_modules/
dist/
`;

/**
 * Writes the React seed for one demo into `<outRoot>/<id>/react`. Returns the files written,
 * relative to the seed root.
 */
export async function generateReactSeed(demoId, outRoot = SEEDS_DIR) {
    const sourceDir = join(DEMOS_SRC_DIR, demoId);
    const seedDir = join(outRoot, demoId, FRAMEWORK);
    const seedSrcDir = join(seedDir, 'src');

    const sourceFiles = listFiles(sourceDir).filter((file) => !EXCLUDED_SOURCE.test(file));
    if (!sourceFiles.includes('index.tsx')) {
        throw new Error(`src/demos/${demoId}/index.tsx is missing; the seed mounts the demo's default export`);
    }
    if (sourceFiles.includes('main.tsx')) {
        throw new Error(`src/demos/${demoId}/main.tsx would collide with the seed's own src/main.tsx`);
    }

    resetSeedDir(seedDir);
    mkdirSync(seedSrcDir, { recursive: true });
    const vendored = copyDemoSource(demoId, sourceFiles, seedDir);

    writeFileSync(join(seedSrcDir, 'main.tsx'), renderMainTsx(demoId));

    const imported = collectImportedPackages(seedSrcDir, listFiles(seedSrcDir));
    const packageJson = renderPackageJson(demoId, buildDependencies(demoId, imported));

    writeJson(join(seedDir, 'package.json'), packageJson, 2);
    writeFileSync(join(seedDir, 'tsconfig.json'), TSCONFIG);
    writeFileSync(join(seedDir, 'vite.config.ts'), VITE_CONFIG);
    writeFileSync(join(seedDir, 'index.html'), renderIndexHtml(demoId));
    writeFileSync(join(seedDir, 'README.md'), renderReadme(demoId, vendored));
    writeFileSync(join(seedDir, '.gitignore'), GITIGNORE);
    writeJson(
        join(seedDir, MANIFEST_FILENAME),
        {
            demo: demoId,
            framework: FRAMEWORK,
            sourceHash: hashDemoSource(demoId),
            sourceCommit: readDemoSourceCommit(demoId),
            vendored,
        },
        4
    );

    const files = listFiles(seedDir).filter((file) => !isPreservedPath(file));
    for (const file of files) {
        await formatGeneratedFile(join(seedDir, file), join(SEEDS_DIR, demoId, FRAMEWORK, file));
    }
    return files;
}

/**
 * Runs the workspace's Prettier over a generated file so the committed seed passes
 * `nx format:check` as written. The configuration is resolved for the file's committed
 * location whatever `outRoot` is, so the freshness check's temporary copy formats identically.
 */
async function formatGeneratedFile(path, committedPath) {
    const { inferredParser } = await prettier.getFileInfo(committedPath);
    if (!inferredParser) return;
    const config = await prettier.resolveConfig(committedPath, { editorconfig: true });
    const source = readFileSync(path, 'utf8');
    const formatted = await prettier.format(source, { ...config, filepath: committedPath });
    if (formatted !== source) writeFileSync(path, formatted);
}

/** Relative import specifiers, side-effect imports included; group 1 is the quote, group 2 the specifier. */
const RELATIVE_IMPORT = /(?<=\b(?:from|import)\s*)(['"])(\.[^'"]+)\1/g;
const SOURCE_FILE = /\.[cm]?[jt]sx?$/;
const SOURCE_EXTENSIONS = ['.ts', '.tsx'];

/**
 * Copies the demo's files into the seed's `src/`, following every relative import. A demo may
 * import from a sibling demo (procurement borrows web-analytics' world topology rather than
 * duplicating 20k lines); such files are vendored under `src/vendored/<demo>/` with the same
 * relative layout, and only the import that crosses between demos is rewritten to point there.
 * Returns the vendored files' paths relative to `src/demos`, sorted.
 */
function copyDemoSource(demoId, sourceFiles, seedDir) {
    const queue = sourceFiles.map((file) => join(DEMOS_SRC_DIR, demoId, file));
    const seen = new Set();
    const vendored = [];

    while (queue.length) {
        const file = queue.shift();
        if (seen.has(file)) continue;
        seen.add(file);

        const owner = ownerDemo(file);
        const dest = seedPathFor(file, demoId);
        if (owner !== demoId) vendored.push(toPosix(relative(DEMOS_SRC_DIR, file)));
        mkdirSync(join(seedDir, dirname(dest)), { recursive: true });

        if (!SOURCE_FILE.test(file)) {
            cpSync(file, join(seedDir, dest));
            continue;
        }

        const content = readFileSync(file, 'utf8').replace(RELATIVE_IMPORT, (match, quote, specifier) => {
            const { target, viaIndex, addedExtension } = resolveRelativeImport(file, specifier);
            queue.push(target);
            if (ownerDemo(target) === owner) return match;

            let targetPath = seedPathFor(target, demoId);
            if (viaIndex) targetPath = dirname(targetPath);
            else if (addedExtension) targetPath = targetPath.replace(/\.[^./]+$/, '');
            const rewritten = toPosix(relative(dirname(dest), targetPath));
            return `${quote}${rewritten.startsWith('.') ? rewritten : `./${rewritten}`}${quote}`;
        });
        writeFileSync(join(seedDir, dest), content);
    }

    return vendored.sort();
}

/** Which demo a source file belongs to. */
function ownerDemo(file) {
    const rel = relative(DEMOS_SRC_DIR, file);
    if (rel.startsWith('..')) {
        throw new Error(`${relative(WORKSPACE_ROOT, file)} is outside src/demos; a seed cannot include it`);
    }
    return rel.split(sep)[0];
}

/** Where a demo source file lands inside the seed, relative to the seed root. */
function seedPathFor(file, demoId) {
    const [owner, ...rest] = relative(DEMOS_SRC_DIR, file).split(sep);
    return owner === demoId ? join('src', ...rest) : join('src', 'vendored', owner, ...rest);
}

function resolveRelativeImport(fromFile, specifier) {
    const base = resolve(dirname(fromFile), specifier);
    const candidates = [
        { target: base },
        ...SOURCE_EXTENSIONS.map((ext) => ({ target: `${base}${ext}`, addedExtension: true })),
        ...SOURCE_EXTENSIONS.map((ext) => ({ target: join(base, `index${ext}`), viaIndex: true })),
    ];
    const found = candidates.find(({ target }) => statSync(target, { throwIfNoEntry: false })?.isFile());
    if (!found) {
        throw new Error(`Cannot resolve import "${specifier}" from ${relative(WORKSPACE_ROOT, fromFile)}`);
    }
    return found;
}

export function isPreservedPath(relativePath) {
    return PRESERVED_IN_TARGET.has(relativePath.split('/')[0]);
}

/** Clears a seed folder of generated content while leaving local build output and installs alone. */
function resetSeedDir(seedDir) {
    if (!existsSync(seedDir)) {
        mkdirSync(seedDir, { recursive: true });
        return;
    }
    for (const entry of readdirSync(seedDir)) {
        if (!PRESERVED_IN_TARGET.has(entry)) {
            rmSync(join(seedDir, entry), { recursive: true, force: true });
        }
    }
}

function writeJson(path, value, indent) {
    writeFileSync(path, `${JSON.stringify(value, null, indent)}\n`);
}

async function main(argv) {
    let outRoot = SEEDS_DIR;
    const ids = [];
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--out') {
            outRoot = argv[++i];
            if (!outRoot) throw new Error('--out requires a directory');
        } else {
            ids.push(argv[i]);
        }
    }

    const known = readDemoIds();
    const unknown = ids.filter((id) => !known.includes(id));
    if (unknown.length) {
        throw new Error(`Unknown demo id(s): ${unknown.join(', ')}. Registered: ${known.join(', ')}`);
    }

    for (const id of ids.length ? ids : known) {
        const files = await generateReactSeed(id, outRoot);
        console.log(`Generated ${join(outRoot, id, FRAMEWORK)} (${files.length} files)`);
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main(process.argv.slice(2)).catch((error) => {
        console.error(`generate-react-seed: ${error.message}`);
        process.exit(1);
    });
}
