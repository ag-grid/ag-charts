/**
 * Update AG Grid version environment variables
 *
 * Usage: node ./update-grid-version 32.2.0
 */

const fs = require('fs');

const GRID_ENV_VAR_NAME = 'PUBLIC_GRID_VERSION';

// NOTE: Only archive and production files use the grid version
const ENV_FILES = [
    './packages/ag-charts-website/.env.build.archive',
    './packages/ag-charts-website/.env.build.production',
    './packages/ag-charts-website/.env.preview.production',
];

function updateEnvFiles() {
    const newGridVersion = process.argv[2];
    const updatedFiles = [];

    if (!newGridVersion) {
        throw new Error('No grid version specified');
    }

    for (const envFile of ENV_FILES) {
        const content = fs
            .readFileSync(envFile)
            .toString()
            .split('\n')
            .map((line) => {
                const [start, end] = line.split('=');
                if (line.trim().startsWith(GRID_ENV_VAR_NAME) && end.trim() !== newGridVersion) {
                    updatedFiles.push(envFile);
                    return `${start.trim()}=${newGridVersion}`;
                }

                return line;
            })
            .join('\n');

        fs.writeFileSync(envFile, content);
    }

    return {
        updatedFiles,
        newGridVersion,
    };
}

const { newGridVersion, updatedFiles } = updateEnvFiles();

if (updatedFiles.length) {
    console.log(`Grid version ${newGridVersion} updated (${updatedFiles.length}) in ${updatedFiles}`);
} else {
    console.log(`Grid version ${newGridVersion} - no files needed to be updated`);
}
