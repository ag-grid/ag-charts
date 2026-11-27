// Writes `dist/css/<package>.css` for a chart package, the stylesheet an app serves itself when it loads AG Charts
// with `injectStyles: false`. The text is what the package's JS bundle injects, built by the same `bundleCss`.
//
// ag-charts-community:  the bundled `src/styles.css` (S1).
// ag-charts-enterprise: S1, one `\n`, then the bundled `src/styles.css` (S2).

const fs = require('node:fs/promises');
const path = require('node:path');

const { bundleCss } = require('../../esbuild.config.css.cjs');

const ROOT = path.resolve(__dirname, '../..');
const COMMUNITY = 'packages/ag-charts-community';

async function buildCss(projectRoot) {
    const name = path.basename(projectRoot);
    const own = await bundleCss(path.join(ROOT, projectRoot, 'src/styles.css'));
    const css =
        projectRoot === COMMUNITY ? own : `${await bundleCss(path.join(ROOT, COMMUNITY, 'src/styles.css'))}\n${own}`;

    const outDir = path.join(ROOT, projectRoot, 'dist/css');
    await fs.rm(outDir, { recursive: true, force: true });
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(path.join(outDir, `${name}.css`), css);
}

if (require.main === module) {
    const projectRoot = process.argv[2];
    if (projectRoot !== COMMUNITY && projectRoot !== 'packages/ag-charts-enterprise') {
        console.error(`Usage: build-css.js ${COMMUNITY} | packages/ag-charts-enterprise`);
        process.exit(1);
    }
    buildCss(projectRoot).catch((e) => {
        console.error(e);
        process.exit(1);
    });
}

module.exports = { buildCss };
