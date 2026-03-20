const fs = require('fs');
const path = require('path');

const env = process.argv.slice(2)[0] || 'prod'; // Default to 'prod' if no argument is provided

const EXPECTED_PROD_FOLDER_CONTENTS = {
    'dist/packages': [
        'ag-charts-angular.tgz',
        'ag-charts-community.tgz',
        'ag-charts-core.tgz',
        'ag-charts-enterprise.tgz',
        'ag-charts-locale.tgz',
        'ag-charts-react.tgz',
        'ag-charts-types.tgz',
        'ag-charts-vue3.tgz',
        'ag-charts-server-side.tgz',
        'contents',
        'sbom.json',
    ],
    'dist/packages/contents': [
        'ag-charts-angular',
        'ag-charts-community',
        'ag-charts-core',
        'ag-charts-enterprise',
        'ag-charts-server-side',
        'ag-charts-locale',
        'ag-charts-react',
        'ag-charts-types',
        'ag-charts-vue3',
    ],
};

const EXPECTED_DEV_STAGING_FOLDER_CONTENTS = {
    'dist/packages': [
        'ag-charts-types',
        'ag-charts-website',
        'ag-charts-angular.tgz',
        'ag-charts-community.tgz',
        'ag-charts-core.tgz',
        'ag-charts-enterprise.tgz',
        'ag-charts-locale.tgz',
        'ag-charts-react.tgz',
        'ag-charts-types.tgz',
        'ag-charts-vue3.tgz',
        'ag-charts-server-side.tgz',
        'contents',
        'sbom.json',
    ],
    'dist/packages/contents': [
        'ag-charts-angular',
        'ag-charts-community',
        'ag-charts-core',
        'ag-charts-enterprise',
        'ag-charts-locale',
        'ag-charts-react',
        'ag-charts-types',
        'ag-charts-vue3',
        'ag-charts-server-side',
    ],
};

function checkFiles() {
    const missingFiles = [];
    const extraFiles = [];

    Object.entries(env === 'prod' ? EXPECTED_PROD_FOLDER_CONTENTS : EXPECTED_DEV_STAGING_FOLDER_CONTENTS).forEach(
        ([folder, expectedFolderFiles]) => {
            if (fs.existsSync(folder)) {
                const files = fs.readdirSync(folder);
                expectedFolderFiles.forEach((file) => {
                    if (!files.includes(file)) {
                        missingFiles.push(path.join(folder, file));
                    }
                });

                extraFiles.push(...files.filter((file) => !expectedFolderFiles.includes(file)));
            } else {
                missingFiles.push(folder);
            }
        }
    );

    let hasErrors = false;
    if (missingFiles.length > 0) {
        console.error('ERROR: The following expected files or directories are missing:');
        console.error(missingFiles.join('\n'));
        hasErrors = true;
    }
    if (extraFiles.length > 0) {
        console.error('ERROR: The following extra files or directories were found:');
        console.error(extraFiles.join('\n'));
        hasErrors = true;
    }

    if (hasErrors) {
        process.exit(1); // Exit with error if any files are missing or extra
    } else {
        console.log('All expected files are present, and no extra files found.');
    }
}

checkFiles();
