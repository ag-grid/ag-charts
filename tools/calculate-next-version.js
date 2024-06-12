const fs = require('fs');

const ignoreList = ['external/ag-shared'];

const versions = new Set();
const packageDirectories = JSON.parse(fs.readFileSync('package.json').toString())?.workspaces?.packages;
for (const packageDir of packageDirectories) {
    if (ignoreList.includes(packageDir)) continue;

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
const now = new Date();
const todayStr = now.toISOString().split('T')[0].replaceAll('-', '');
let time = -1;
let newVersion;
let newSuffix;
do {
    if (newSuffix != null) {
        time = now.getUTCHours() * 100 + now.getUTCMinutes();
    }
    newSuffix = `${suffix}.${todayStr}${time >= 0 ? '.' + time : ''}`;
    newVersion = `${semverPart}-${newSuffix}`;
} while (newSuffix <= oldSuffix);

console.log(newVersion);
