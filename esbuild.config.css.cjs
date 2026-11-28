const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

/** Stands for the AG Charts version in `--ag-charts-css-version`, so the source stays valid CSS. */
const VERSION_PLACEHOLDER = '__AG_CHARTS_VERSION__';
const VERSION_FILE = path.join(__dirname, 'packages/ag-charts-community/src/version.ts');

function readVersion() {
    const match = /VERSION\s*=\s*'([^']+)'/.exec(fs.readFileSync(VERSION_FILE, 'utf8'));
    if (match == null) throw new Error(`Cannot read the version from ${VERSION_FILE}`);
    return match[1];
}

/**
 * The one place a chart stylesheet is bundled. The runtime injects its output as text and `build-css.js` writes
 * it to `dist/css`, so the two cannot differ.
 *
 * @param {string} entry Path of the CSS entry point.
 * @returns {Promise<string>} The minified, bundled CSS.
 */
async function bundleCss(entry) {
    const result = await esbuild.build({
        entryPoints: [entry],
        bundle: true,
        minify: true,
        sourcemap: false,
        outdir: 'null',
        write: false,
    });
    if (result.warnings.length > 0) {
        const messages = await esbuild.formatMessages(result.warnings, { kind: 'warning' });
        throw new Error(`Warnings bundling ${entry}:\n${messages.join('\n')}`);
    }
    if (result.outputFiles.length !== 1) {
        throw new Error('Invalid CSS bundle');
    }

    return result.outputFiles[0].text.split(VERSION_PLACEHOLDER).join(readVersion());
}

module.exports = { bundleCss, VERSION_PLACEHOLDER };
