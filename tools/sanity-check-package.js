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

function check(type, field, filename) {
    if (!(typeof filename === 'string')) return;

    if (type === 'types' && !filename.endsWith('.d.ts')) {
        console.warn(`Field '${field}' has reference to non '.d.ts' file.`);
        exitStatus = 1;
    }

    if (type === 'cjs' && !filename.endsWith('.cjs.js') && !filename.endsWith('.cjs')) {
        console.warn(`Field '${field}' has reference to non CJS file: ${filename}`);
        exitStatus = 1;
    }

    if (type === 'esm' && !filename.endsWith('.esm.js') && !filename.endsWith('.mjs')) {
        console.warn(`Field '${field}' has reference to non ESM file: ${filename}`);
        exitStatus = 1;
    }

    if (!fs.existsSync(path.join(dir, filename))) {
        console.warn(`Field '${field}' has invalid file reference: ${filename}`);
        exitStatus = 1;
    }
}

const exportMap = {
    require: 'cjs',
    import: 'esm',
    default: 'cjs',
    types: 'types',
};

function checkExports(exports) {
    for (const key in exports) {
        if (typeof exports[key] === 'object') {
            checkExports(exports[key]);
            continue;
        }

        const type = exportMap[key] ?? 'unknown';
        check(type, key, exports[key]);
    }
}

let exitStatus = 0;
for (const field in ['types', 'typing']) {
    const filename = packageJson[field];
    check('types', field, filename);
}
for (const field in ['main']) {
    const filename = packageJson[field];
    check('cjs', field, filename);
}
for (const field in ['module']) {
    const filename = packageJson[field];
    check('esm', field, filename);
}

if (packageJson.exports != null) {
    checkExports(packageJson.exports);
}

if (exitStatus === 0) {
    console.log(`No problems found with package in ${dir}`);
}

process.exit(exitStatus);
