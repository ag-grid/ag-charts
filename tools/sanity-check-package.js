const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
if (!fs.readdirSync(dir)) {
    console.error("Can't find direction: " + dir);
    process.exit(1);
}

const packageJsonFile = fs.readFileSync(path.join(dir, 'package.json'));
if (!packageJsonFile) {
    console.error("Can't find package.json: " + dir);
    process.exit(1);
}

const packageJson = JSON.parse(packageJsonFile.toString());

let exitStatus = 0;

async function check(type, field, filename) {
    if (!(typeof filename === 'string')) return;
    const fullFilename = path.join(dir, filename);

    let success = true;
    if (type === 'types' && !filename.endsWith('.d.ts')) {
        console.warn(`[${packageJson.name}] ${filename}: Field '${field}' has reference to non '.d.ts' file.`);
        success = false;
    }

    if (type === 'cjs' && !filename.endsWith('.cjs.js') && !filename.endsWith('.cjs')) {
        console.warn(`[${packageJson.name}] ${filename}: Field '${field}' has reference to non CJS file: ${filename}`);
        success = false;
    }

    if (type === 'esm' && !filename.endsWith('.esm.js') && !filename.endsWith('.mjs')) {
        console.warn(`[${packageJson.name}] ${filename}: Field '${field}' has reference to non ESM file: ${filename}`);
        success = false;
    }

    if (!fs.existsSync(path.join(dir, filename))) {
        console.warn(`[${packageJson.name}] ${filename}: Field '${field}' has invalid file reference: ${filename}`);
        success = false;
    }
    if (success) {
        console.log(`[${packageJson.name}] ${filename} check success.`);
    } else {
        exitStatus = 1;
    }
}

function checkOneExists(...filenames) {
    if (!filenames.some((f) => fs.existsSync(path.join(dir, f)))) {
        console.warn(`[${packageJson.name}]: Didn't find any files with name(s): ${filenames.join(' / ')}`);
        exitStatus = 1;
    }
}

const exportMap = {
    require: 'cjs',
    import: 'esm',
    default: 'cjs',
    types: 'types',
};

async function checkExports(exports) {
    for (const key in exports) {
        if (typeof exports[key] === 'object') {
            await checkExports(exports[key]);
            continue;
        }

        const type = exportMap[key] ?? 'unknown';
        await check(type, key, exports[key]);
    }
}

async function run() {
    for (const field of ['types', 'typing']) {
    const filename = packageJson[field];
        await check('types', field, filename);
}
    for (const field of ['main']) {
    const filename = packageJson[field];
        await check('cjs', field, filename);
}
    for (const field of ['module']) {
    const filename = packageJson[field];
        await check('esm', field, filename);
}

if (packageJson.exports != null) {
        await checkExports(packageJson.exports);
}

checkOneExists('README.md');
checkOneExists('LICENSE.txt', 'LICENSE.html');

if (exitStatus === 0) {
        console.log(`[${packageJson.name}]: No problems found with package in ${dir}`);
    }
}

run()
    .then(() => process.exit(exitStatus))
    .catch(() => process.exit(1));
