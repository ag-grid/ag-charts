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

function collectExportTargets(exports, runtime, types) {
    if (typeof exports === 'string') {
        (exports.endsWith('.d.ts') ? types : runtime).push(exports);
        return;
    }
    if (exports == null || typeof exports !== 'object') return;

    for (const [key, value] of Object.entries(exports)) {
        if (key === './package.json') continue;
        if (key === 'types' || key === 'typings') {
            collectExportTargets(value, types, types);
        } else {
            collectExportTargets(value, runtime, types);
        }
    }
}

// `dist/package/main.cjs.js` -> `dist/package/main.cjs.min.js`. Only the esbuild output under `dist/` is minified.
function minifiedTwin(file) {
    if (!file.startsWith('dist/')) return undefined;
    const ext = path.extname(file);
    return `${file.slice(0, -ext.length)}.min${ext}`;
}

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Only a single `*` in the final path segment is supported, which covers every export in this repo.
function expandTarget(pkgDir, target, errors) {
    if (!target.includes('*')) return [target];

    const dir = path.posix.dirname(target);
    const base = path.posix.basename(target);
    if (dir.includes('*') || base.split('*').length !== 2) {
        errors.push({ kind: 'bad-pattern', file: target, message: `unsupported export pattern: ${target}` });
        return [];
    }

    const [prefix, suffix] = base.split('*').map(escapeRegExp);
    const pattern = new RegExp(`^${prefix}.+${suffix}$`);
    const fullDir = path.join(pkgDir, dir);
    const matches = fs.existsSync(fullDir) ? fs.readdirSync(fullDir).filter((f) => pattern.test(f)) : [];
    if (matches.length === 0) {
        errors.push({ kind: 'no-match', file: target, message: `export pattern matches no files: ${target}` });
    }
    return matches.map((f) => path.posix.join(dir, f));
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

    const runtimeTargets = [];
    const typeTargets = [];
    for (const field of ['main', 'module']) {
        if (typeof packageJson[field] === 'string') runtimeTargets.push(packageJson[field]);
    }
    for (const field of ['types', 'typings']) {
        if (typeof packageJson[field] === 'string') typeTargets.push(packageJson[field]);
    }
    collectExportTargets(packageJson.exports, runtimeTargets, typeTargets);

    const expected = new Set();
    const targetDirs = new Set();
    for (const target of new Set(runtimeTargets.map(stripDotSlash))) {
        targetDirs.add(path.posix.dirname(target));
        for (const file of expandTarget(pkgDir, target, errors)) {
            expected.add(file);
            if (!fs.existsSync(path.join(pkgDir, file))) {
                errors.push({ kind: 'missing-target', file, message: `exported file is missing: ${file}` });
            }

            const twin = minifiedTwin(file);
            if (twin == null) continue;
            expected.add(twin);
            if (!fs.existsSync(path.join(pkgDir, twin))) {
                errors.push({ kind: 'missing-twin', file: twin, message: `minified file is missing: ${twin}` });
            }
        }
    }

    // Non-recursive, so a build that started emitting shared chunks would be reported here too.
    for (const dir of targetDirs) {
        const fullDir = path.join(pkgDir, dir);
        if (!fs.existsSync(fullDir)) continue;
        for (const entry of fs
            .readdirSync(fullDir, { withFileTypes: true })
            .sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
            const file = path.posix.join(dir, entry.name);
            if (entry.isFile() && isJs(entry.name) && !expected.has(file)) {
                errors.push({
                    kind: 'unexported',
                    file,
                    message: `file is not referenced by package.json exports: ${file}`,
                });
            }
        }
    }

    if (release) {
        errors.push(...checkReleaseArtefacts(pkgDir, expected, typeTargets));
    }

    return errors;
}

function checkReleaseArtefacts(pkgDir, expected, typeTargets) {
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

    const types = [...new Set(typeTargets.map(stripDotSlash))];
    if (types.length === 0) {
        errors.push({
            kind: 'missing-types',
            file: 'package.json',
            message: 'package.json declares no type definitions',
        });
    }
    for (const target of types) {
        for (const file of expandTarget(pkgDir, target, errors)) {
            if (!fs.existsSync(path.join(pkgDir, file))) {
                errors.push({ kind: 'missing-types', file, message: `type definitions file is missing: ${file}` });
            }
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
