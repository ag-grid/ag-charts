#!/usr/bin/env node

/**
 * Replaces ag-charts-* dependency versions in all ag-grid package.json files
 * with `file:` paths pointing to local tarballs.
 *
 * Usage: node set-charts-dep-paths.js <ag-grid-root> <tarball-dir>
 */

const fs = require('fs');
const path = require('path');

const AG_CHARTS_PACKAGES = [
    'ag-charts-types',
    'ag-charts-locale',
    'ag-charts-core',
    'ag-charts-community',
    'ag-charts-enterprise',
];

const DEP_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

function findTarballs(tarballDir) {
    const files = fs.readdirSync(tarballDir);
    const tarballs = {};
    for (const pkg of AG_CHARTS_PACKAGES) {
        const tarball = files.find((f) => f.startsWith(pkg.replace(/-/g, '-') + '-') && f.endsWith('.tgz'));
        if (tarball) {
            tarballs[pkg] = path.resolve(tarballDir, tarball);
        }
    }
    return tarballs;
}

function findPackageJsonFiles(rootDir) {
    const results = [];

    // Read workspace packages from root package.json
    const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    results.push(path.join(rootDir, 'package.json'));

    const workspaces = rootPkg.workspaces || [];
    const patterns = Array.isArray(workspaces) ? workspaces : workspaces.packages || [];

    for (const pattern of patterns) {
        // Simple glob: handle trailing /*
        const baseDir = pattern.replace(/\/\*$/, '');
        const fullBase = path.join(rootDir, baseDir);
        if (!fs.existsSync(fullBase)) continue;

        if (pattern.endsWith('/*')) {
            // Enumerate subdirectories
            for (const entry of fs.readdirSync(fullBase, { withFileTypes: true })) {
                if (entry.isDirectory()) {
                    const pkgJson = path.join(fullBase, entry.name, 'package.json');
                    if (fs.existsSync(pkgJson)) results.push(pkgJson);
                }
            }
        } else {
            const pkgJson = path.join(fullBase, 'package.json');
            if (fs.existsSync(pkgJson)) results.push(pkgJson);
        }
    }

    return results;
}

function replaceVersions(pkgJsonPath, tarballs) {
    const content = fs.readFileSync(pkgJsonPath, 'utf8');
    const pkg = JSON.parse(content);
    let modified = false;

    for (const field of DEP_FIELDS) {
        if (!pkg[field]) continue;
        for (const [name, tarballPath] of Object.entries(tarballs)) {
            if (pkg[field][name]) {
                pkg[field][name] = `file:${tarballPath}`;
                modified = true;
            }
        }
    }

    // Also handle resolutions field (yarn 1.x)
    if (pkg.resolutions) {
        for (const [name, tarballPath] of Object.entries(tarballs)) {
            if (pkg.resolutions[name]) {
                pkg.resolutions[name] = `file:${tarballPath}`;
                modified = true;
            }
        }
    }

    if (modified) {
        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n');
        console.log(`Updated: ${pkgJsonPath}`);
    }

    return modified;
}

function main() {
    const [agGridRoot, tarballDir] = process.argv.slice(2);

    if (!agGridRoot || !tarballDir) {
        console.error('Usage: node set-charts-dep-paths.js <ag-grid-root> <tarball-dir>');
        process.exit(1);
    }

    const resolvedRoot = path.resolve(agGridRoot);
    const resolvedTarballDir = path.resolve(tarballDir);

    if (!fs.existsSync(resolvedRoot)) {
        console.error(`ag-grid root not found: ${resolvedRoot}`);
        process.exit(1);
    }

    if (!fs.existsSync(resolvedTarballDir)) {
        console.error(`Tarball directory not found: ${resolvedTarballDir}`);
        process.exit(1);
    }

    const tarballs = findTarballs(resolvedTarballDir);
    const found = Object.keys(tarballs);
    console.log(`Found tarballs for: ${found.join(', ')}`);

    if (found.length === 0) {
        console.error('No ag-charts tarballs found in tarball directory');
        process.exit(1);
    }

    const pkgJsonFiles = findPackageJsonFiles(resolvedRoot);
    console.log(`Scanning ${pkgJsonFiles.length} package.json files...`);

    let updatedCount = 0;
    for (const pkgJsonPath of pkgJsonFiles) {
        if (replaceVersions(pkgJsonPath, tarballs)) {
            updatedCount++;
        }
    }

    console.log(`Updated ${updatedCount} package.json files`);
}

main();
