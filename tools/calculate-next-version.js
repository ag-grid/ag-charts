const fs = require('fs');

const versions = new Set();
const packageDirectories = JSON.parse(fs.readFileSync('package.json').toString())?.workspaces?.packages;
for (const packageDir of packageDirectories) {
    const packageJsonFilename = `${packageDir}/package.json`;
    if (!fs.existsSync(packageJsonFilename)) continue;
    const packageJson = JSON.parse(fs.readFileSync(packageJsonFilename).toString());
    if (packageJson.private === true) continue;

    versions.add(packageJson.version);
}

if (versions.size !== 1) {
    console.error("Didn't find exactly one version to increment: ", versions);
    process.exit(1);
}

const currentVersion = versions.values().next().value;
let [semverPart, oldSuffix] = currentVersion.split('-');

const suffix = oldSuffix?.split('.')[0] ?? 'beta';
const todayStr = new Date().toISOString().split('T')[0].replaceAll('-', '');
let index = 0;
let newVersion;
let newSuffix;
do {
    newSuffix = `${suffix}.${todayStr}${index > 0 ? '.' + index : ''}`;
    newVersion = `${semverPart}-${newSuffix}`;
} while (newSuffix <= oldSuffix);

console.log(newVersion);
