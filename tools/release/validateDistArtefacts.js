// Usage: node validateDistArtefacts.js <contentsDir>
// Checks every package under <contentsDir> (e.g. dist/packages/contents) and reports all failures before exiting.

const { validateContentsDir } = require('../package/dist-artefacts');

const contentsDir = process.argv[2];
if (!contentsDir) {
    console.error('Usage: node validateDistArtefacts.js <contentsDir>');
    process.exit(1);
}

let failed = false;
for (const { name, errors } of validateContentsDir(contentsDir, { release: true })) {
    if (errors.length === 0) {
        console.log(`[${name}] dist artefacts OK`);
        continue;
    }
    failed = true;
    for (const error of errors) {
        console.error(`ERROR: [${name}] ${error.message}`);
    }
}

process.exit(failed ? 1 : 0);
