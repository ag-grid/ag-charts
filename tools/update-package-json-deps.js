const fs = require('fs');

const depToUpdate = process.argv[2];
const version = process.argv[3];

if (depToUpdate == null || version == null) {
    console.error('Usage: ' + process.argv0 + ' [package-to-update] [new-version]');
}

console.log(`Updating references to ${depToUpdate}@${version}`);

const packageDirectories = JSON.parse(fs.readFileSync('package.json').toString())?.workspaces?.packages;
for (const packageDir of packageDirectories) {
    const packageJsonFilename = `${packageDir}/package.json`;
    if (!fs.existsSync(packageJsonFilename)) continue;

    let updated = false;
    const packageJson = JSON.parse(fs.readFileSync(packageJsonFilename).toString());
    if (packageJson.name === depToUpdate) {
        updated ||= packageJson.version !== version;
        packageJson.version = version;
    }

    for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
        if (packageJson[depType] && depToUpdate in packageJson[depType]) {
            updated |= packageJson[depType][depToUpdate] !== version;
            packageJson[depType][depToUpdate] = version;
        }
    }

    if (updated) {
        console.log(`Updating ${packageJsonFilename}`);
        fs.writeFileSync(packageJsonFilename, JSON.stringify(packageJson, null, 2));
    }
}
