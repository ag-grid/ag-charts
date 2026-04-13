/**
 * Unbundled ESM build script.
 *
 * Transpiles every source file individually (no bundling) so that consumers'
 * bundlers can tree-shake at the module level.
 *
 * Usage: node tools/build-esm.cjs <projectRoot>
 *   e.g. node tools/build-esm.cjs packages/ag-charts-community
 */
const esbuild = require('esbuild');
const { plugins } = require('../esbuild.config.cjs');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = process.argv[2];
if (!projectRoot) {
    console.error('Usage: node tools/build-esm.cjs <projectRoot>');
    process.exit(1);
}

const srcDir = path.join(projectRoot, 'src');
const outDir = path.join(projectRoot, 'dist', 'package');

// Collect all non-test TypeScript source files.
const srcFiles = execSync(
    `find ${srcDir} -name '*.ts' -not -name '*.test.ts' -not -name '*.spec.ts'`,
    { encoding: 'utf8' }
)
    .trim()
    .split('\n')
    .filter(Boolean);

console.log(`[build-esm] ${srcFiles.length} source files in ${projectRoot}`);

async function run() {
    await esbuild.build({
        entryPoints: srcFiles,
        outdir: outDir,
        outbase: srcDir,
        bundle: false,
        format: 'esm',
        platform: 'browser',
        target: 'es2020',
        plugins,
        sourcemap: true,
    });

    // Copy non-TS assets (CSS, HTML) so that relative imports in the
    // transpiled JS files resolve correctly.
    const assets = execSync(
        `find ${srcDir} \\( -name '*.css' -o -name '*.html' \\) 2>/dev/null || true`,
        { encoding: 'utf8' }
    )
        .trim()
        .split('\n')
        .filter(Boolean);

    for (const asset of assets) {
        const rel = path.relative(srcDir, asset);
        const dest = path.join(outDir, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(asset, dest);
    }

    const jsCount = execSync(`find ${outDir} -name '*.js' -not -name '*.cjs.js' -not -name '*.min.*' | wc -l`, {
        encoding: 'utf8',
    }).trim();
    console.log(`[build-esm] wrote ${jsCount} ESM files to ${outDir}`);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
