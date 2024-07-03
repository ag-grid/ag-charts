const fs = require('fs');

const filename = 'packages/ag-charts-enterprise/src/license/licenseManager.ts';
const prefix = 'private static readonly RELEASE_INFORMATION: string = ';

console.log(`Updating RELEASE_INFORMATION in ${filename}`);

const newValue = btoa(String(new Date().getTime()));

let updateCount = 0;
const content = fs
    .readFileSync(filename)
    .toString()
    .split('\n')
    .map((line) => {
        if (line.trim().startsWith(prefix)) {
            const [start, end] = line.split(' = ');
            updateCount++;
            return `${start} = '${newValue}';`;
        }

        return line;
    })
    .join('\n');

fs.writeFileSync(filename, content);

if (updateCount === 0) {
    console.error('RELEASE_INFORMATION was not updated!');
    process.exit(1);
}
