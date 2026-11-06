// Checks that a packed package's JS artefacts match its package.json exports. Uses Node built-ins only, as the
// release script that calls it also runs in the TeamCity archive deploy, whose environment is outside this repo.

const fs = require('fs');
const path = require('path');

const JS_EXTENSIONS = ['.js', '.mjs', '.cjs'];

function isJs(file) {
    return JS_EXTENSIONS.includes(path.extname(file));
}

function stripDotSlash(target) {
    return target.replace(/^\.\//, '');
}

// Each target is tagged with the export subpath it belongs to, so the conditions of a wildcard export can be compared.
function collectExportTargets(exports, targets, subpath = '.', isTypes = false) {
    if (typeof exports === 'string') {
        targets.push({ target: stripDotSlash(exports), subpath, types: isTypes || exports.endsWith('.d.ts') });
        return;
    }
    if (exports == null || typeof exports !== 'object') return;

    for (const [key, value] of Object.entries(exports)) {
        if (key === './package.json') continue;
        const childSubpath = key.startsWith('.') ? key : subpath;
        collectExportTargets(value, targets, childSubpath, isTypes || key === 'types' || key === 'typings');
    }
}

// `dist/package/main.cjs.js` -> `dist/package/main.cjs.min.js`. Only the esbuild output under `dist/` is minified.
function minifiedTwin(file) {
    if (!file.startsWith('dist/')) return undefined;
    const ext = path.extname(file);
    return `${file.slice(0, -ext.length)}.min${ext}`;
}

// Static imports and re-exports, minified or not, side-effect imports and dynamic `import()`.
const IMPORT = /(?:^|[^\w$.])(?:import|export)\s*(?:[^'";()]*?from\s*|\(\s*)?["']([^"']+)["']/g;

function isRelative(specifier) {
    return /^\.{1,2}\//.test(specifier);
}

function importSpecifiers(pkgDir, file) {
    const source = fs.readFileSync(path.join(pkgDir, file), 'utf8');
    return [...source.matchAll(IMPORT)].map(([, specifier]) => specifier);
}

function relativeImports(pkgDir, file) {
    return importSpecifiers(pkgDir, file)
        .filter(isRelative)
        .map((specifier) => path.posix.join(path.posix.dirname(file), specifier));
}

// Stateless, so a bundle may carry its own copy and spare import maps from mapping them.
const INLINABLE_PACKAGES = new Set(['ag-charts-locale', 'ag-charts-types']);

// The minified twin of a per-module entry is its single-file bundle, so it must import no module, and must not
// inline a package the tree imports: a second copy of one would split its module state.
function checkBundle(pkgDir, entry, bundle) {
    const tree = new Set([entry]);
    const pending = [entry];
    while (pending.length > 0) {
        for (const target of relativeImports(pkgDir, pending.pop())) {
            if (tree.has(target) || !fs.existsSync(path.join(pkgDir, target))) continue;
            tree.add(target);
            pending.push(target);
        }
    }
    if (tree.size === 1 || !fs.existsSync(path.join(pkgDir, bundle))) return [];

    const errors = [];
    const bundled = new Set(importSpecifiers(pkgDir, bundle));
    for (const specifier of bundled) {
        if (!isRelative(specifier)) continue;
        errors.push({ kind: 'bundle-relative-import', file: bundle, message: `${bundle} imports ${specifier}` });
    }
    const packages = new Set([...tree].flatMap((file) => importSpecifiers(pkgDir, file)).filter((s) => !isRelative(s)));
    for (const specifier of packages) {
        if (bundled.has(specifier) || INLINABLE_PACKAGES.has(specifier)) continue;
        errors.push({
            kind: 'bundle-inlined-package',
            file: bundle,
            message: `${bundle} inlines ${specifier}, which ${entry} imports`,
        });
    }
    return errors;
}

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Only a single `*` in the final path segment is supported, which covers every export in this repo. Returns the
// strings the `*` stands for in the files that exist.
function matchSubstitutions(pkgDir, target, errors) {
    const dir = path.posix.dirname(target);
    const base = path.posix.basename(target);
    if (dir.includes('*') || base.split('*').length !== 2) {
        errors.push({ kind: 'bad-pattern', file: target, message: `unsupported export pattern: ${target}` });
        return undefined;
    }

    const [prefix, suffix] = base.split('*');
    const pattern = new RegExp(`^${escapeRegExp(prefix)}(.+)${escapeRegExp(suffix)}$`);
    const fullDir = path.join(pkgDir, dir);
    if (!fs.existsSync(fullDir)) return [];
    return fs
        .readdirSync(fullDir)
        .map((f) => pattern.exec(f)?.[1])
        .filter((match) => match != null);
}

// Every condition of a wildcard export must provide the same substitutions, so the union across conditions is what
// each one is expected to ship. A locale missing only its ESM bundle is then reported, not hidden by the others.
function expandTargets(pkgDir, targets, errors) {
    const substitutions = new Map();
    for (const { target, subpath } of targets) {
        if (!target.includes('*')) continue;
        const matches = matchSubstitutions(pkgDir, target, errors);
        if (matches == null) continue;
        if (!substitutions.has(subpath)) substitutions.set(subpath, new Set());
        for (const match of matches) substitutions.get(subpath).add(match);
    }

    const expanded = [];
    for (const { target, subpath, types } of targets) {
        if (!target.includes('*')) {
            expanded.push({ file: target, types });
            continue;
        }
        const subs = substitutions.get(subpath);
        if (subs == null) continue;
        if (subs.size === 0) {
            errors.push({ kind: 'no-match', file: target, message: `export pattern matches no files: ${target}` });
        }
        for (const sub of [...subs].sort()) expanded.push({ file: target.replace('*', sub), types, wildcard: true });
    }
    return expanded;
}

function* walkFiles(pkgDir, dir) {
    const entries = fs
        .readdirSync(path.join(pkgDir, dir), { withFileTypes: true })
        .sort((a, b) => a.name.localeCompare(b.name, 'en'));
    for (const entry of entries) {
        const file = path.posix.join(dir, entry.name);
        if (entry.isDirectory()) {
            yield* walkFiles(pkgDir, file);
        } else if (entry.isFile()) {
            yield file;
        }
    }
}

function readPackageJson(pkgDir) {
    try {
        return JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
    } catch {
        return undefined;
    }
}

function checkPackage(pkgDir, { release = false } = {}) {
    const errors = [];
    const packageJson = readPackageJson(pkgDir);
    if (packageJson == null || typeof packageJson !== 'object') {
        errors.push({
            kind: 'unreadable',
            file: 'package.json',
            message: `missing or invalid package.json in ${pkgDir}`,
        });
        return errors;
    }

    const targets = [];
    for (const field of ['main', 'module']) {
        if (typeof packageJson[field] === 'string') {
            targets.push({ target: stripDotSlash(packageJson[field]), subpath: '.', types: false });
        }
    }
    for (const field of ['types', 'typings']) {
        if (typeof packageJson[field] === 'string') {
            targets.push({ target: stripDotSlash(packageJson[field]), subpath: '.', types: true });
        }
    }
    collectExportTargets(packageJson.exports, targets);

    const expanded = expandTargets(pkgDir, targets, errors);
    const typeFiles = [...new Set(expanded.filter((t) => t.types).map((t) => t.file))];
    const expected = new Set();
    const targetDirs = new Set();
    for (const target of targets) {
        if (!target.types) targetDirs.add(path.posix.dirname(target.target));
    }
    // A file named outright is reported as `missing-target`; one only implied by a wildcard gets its own kind, as
    // `sanity-check-package.js` reports the former itself but cannot see the latter.
    const runtimeFiles = new Map();
    for (const { file, types, wildcard = false } of expanded) {
        if (!types) runtimeFiles.set(file, (runtimeFiles.get(file) ?? true) && wildcard);
    }
    // A module imported by a shipped ESM file ships too, unminified: only an entry has a minified single-file twin.
    const imported = new Set();
    const pending = [...runtimeFiles.keys()].filter(
        (file) => file.endsWith('.mjs') && fs.existsSync(path.join(pkgDir, file))
    );
    while (pending.length > 0) {
        const file = pending.pop();
        for (const target of relativeImports(pkgDir, file)) {
            if (imported.has(target)) continue;
            imported.add(target);
            expected.add(target);
            if (fs.existsSync(path.join(pkgDir, target))) {
                pending.push(target);
            } else {
                errors.push({
                    kind: 'missing-import',
                    file: target,
                    message: `${file} imports ${target}, which is not shipped`,
                });
            }
        }
    }

    for (const [file, wildcard] of runtimeFiles) {
        expected.add(file);
        if (!fs.existsSync(path.join(pkgDir, file))) {
            const kind = wildcard ? 'missing-wildcard-target' : 'missing-target';
            errors.push({ kind, file, message: `exported file is missing: ${file}` });
        }

        const twin = imported.has(file) ? undefined : minifiedTwin(file);
        if (twin == null) continue;
        expected.add(twin);
        if (!fs.existsSync(path.join(pkgDir, twin))) {
            errors.push({ kind: 'missing-twin', file: twin, message: `minified file is missing: ${twin}` });
        }
        if (file.endsWith('.mjs') && fs.existsSync(path.join(pkgDir, file))) {
            errors.push(...checkBundle(pkgDir, file, twin));
        }
    }

    // Recursive, so a build that started emitting shared chunks would be reported here too.
    const scanned = new Set();
    for (const dir of targetDirs) {
        if (!fs.existsSync(path.join(pkgDir, dir))) continue;
        for (const file of walkFiles(pkgDir, dir)) {
            if (scanned.has(file)) continue;
            scanned.add(file);
            if (isJs(file) && !expected.has(file)) {
                errors.push({
                    kind: 'unexported',
                    file,
                    message: `file is not referenced by package.json exports: ${file}`,
                });
            }
        }
    }

    if (release) {
        errors.push(...checkReleaseArtefacts(pkgDir, expected, typeFiles));
    }

    return errors;
}

function checkReleaseArtefacts(pkgDir, expected, typeFiles) {
    const errors = [];

    for (const file of expected) {
        const fullPath = path.join(pkgDir, file);
        if (!fs.existsSync(fullPath)) continue;
        const match = /\/\/# sourceMappingURL=(\S+)/.exec(fs.readFileSync(fullPath, 'utf8'));
        if (match == null) continue;
        const mapFile = path.posix.join(path.posix.dirname(file), match[1]);
        if (!fs.existsSync(path.join(pkgDir, mapFile))) {
            errors.push({
                kind: 'dangling-source-map',
                file,
                message: `${file} references ${match[1]}, which is not shipped`,
            });
        }
    }

    if (typeFiles.length === 0) {
        errors.push({
            kind: 'missing-types',
            file: 'package.json',
            message: 'package.json declares no type definitions',
        });
    }
    for (const file of typeFiles) {
        if (!fs.existsSync(path.join(pkgDir, file))) {
            errors.push({ kind: 'missing-types', file, message: `type definitions file is missing: ${file}` });
        }
    }

    return errors;
}

// Checks every `<name>/package` directory under a `dist/packages/contents`-style directory.
function validateContentsDir(contentsDir, options) {
    if (!fs.existsSync(contentsDir) || !fs.statSync(contentsDir).isDirectory()) {
        return [
            {
                name: contentsDir,
                errors: [{ kind: 'unreadable', file: contentsDir, message: `${contentsDir} does not exist` }],
            },
        ];
    }

    return fs
        .readdirSync(contentsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => {
            const pkgDir = path.join(contentsDir, entry.name, 'package');
            try {
                return { name: entry.name, errors: checkPackage(pkgDir, options) };
            } catch (e) {
                return { name: entry.name, errors: [{ kind: 'unreadable', file: pkgDir, message: String(e) }] };
            }
        });
}

module.exports = { checkPackage, validateContentsDir };
