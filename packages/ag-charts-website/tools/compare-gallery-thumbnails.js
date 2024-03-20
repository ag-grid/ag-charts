#!node

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');

const fail = (msg, usage) => {
    console.error(msg);
    if (usage) {
        console.error(`Usage: ${process.argv[1]} [-u] <input-dir> <compare-dir>`);
        console.error(`Flags: `);
        console.error(`-u   Update snapshots.`);
    }
    process.exit(1);
};

// Parse argv.
let argv = process.argv.slice(2);
const flags = new Set(argv.filter((v) => v.startsWith('-')));

const update = flags.has('-u');
const ci = flags.has('-ci');

argv = argv.filter((v) => !v.startsWith('-'));
if (argv.length !== 2) {
    fail('Wrong number of arguments', true);
}

const inputDir = argv.shift();
const compareDir = argv.shift();

// Validate argv inputs.
if (!fs.existsSync(inputDir)) {
    fail('Input dir not found: ' + inputDir);
}

if (!fs.existsSync(compareDir)) {
    fail('Compare dir not found: ' + compareDir);
}

// Main process.
let snapshots = {
    created: 0,
    updated: 0,
    mismatching: 0,
    matched: 0,
    skipped: 0,
};
const mismatched = [];
const inputs = glob.sync('**/ag-default-platform-agnostic.png', { cwd: inputDir });
for (const input of inputs) {
    const inputPath = path.join(inputDir, input);
    const comparePath = path.join(compareDir, input);

    if (fs.existsSync(path.join(path.dirname(comparePath), '.skip'))) {
        console.log('\x1b[33m%s\x1b[0m', `[skipped] ${comparePath}`);
        snapshots.skipped++;
        continue;
    }

    if (!fs.existsSync(comparePath)) {
        if (ci) {
            mismatched.push(`[missing] ${inputPath}\n     [vs] ${comparePath}`);
            snapshots.mismatching++;
            continue;
        }

        fs.mkdirSync(path.dirname(comparePath), { recursive: true });
        fs.copyFileSync(inputPath, comparePath);

        console.log(`[created] ${comparePath}`);

        snapshots.created++;
        continue;
    }

    const inputImage = PNG.sync.read(fs.readFileSync(inputPath));
    const compareImage = PNG.sync.read(fs.readFileSync(comparePath));
    const diffImage = new PNG({ width: 600, height: 375 });
    const match = pixelmatch(inputImage.data, compareImage.data, diffImage.data, 600, 375, {
        threshold: 0,
    });

    if (match === 0) {
        console.log('\x1b[32m%s\x1b[0m', `[matched] ${inputPath}\n     [vs] ${comparePath}`);
        snapshots.matched++;
        continue;
    }

    if (update) {
        fs.copyFileSync(inputPath, comparePath);
        console.log('\x1b[33m%s\x1b[0m', `[updated] ${comparePath}`);
        snapshots.updated++;
        continue;
    }

    mismatched.push(`[mismatched] ${inputPath}\n        [vs] ${comparePath}`);
    snapshots.mismatching++;
}

console.log('\n\nResults:');
console.table(snapshots);

if (snapshots.mismatching > 0) {
    console.log('\x1b[31m%s\x1b[0m', '\n\nFailures:');
    mismatched.forEach((m) => console.error('\x1b[31m%s\x1b[0m', m));
    process.exit(1);
} else {
    process.exit(0);
}
