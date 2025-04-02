const fs = require('fs');
const path = require('path');

// Parse command-line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.length < 2) {
    console.log(`Usage: node generate-ag-charts-types-defaults.js <input_directory> <output_file>`);
    console.log(
        `Example: node generate-ag-charts-types-defaults.js ./node_modules/ag-charts-types ./ag-charts-types-defaults.d.ts`
    );
    process.exit(0);
}

const INPUT_DIR = path.resolve(process.cwd(), args[0]);
const OUTPUT_FILE = path.resolve(process.cwd(), args[1]);
const IMPORT_SOURCE = 'ag-charts-types';

const outputLines = [];

// Function to recursively get all .d.ts files
function getAllDtsFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllDtsFiles(filePath));
        } else if (file.endsWith('.d.ts')) {
            results.push(filePath);
        }
    });
    return results;
}

// Get all .d.ts files
const files = getAllDtsFiles(INPUT_DIR);

// Process each file
files.forEach((file) => {
    const input = fs.readFileSync(file, 'utf8');
    input.split('\n').forEach((line) => {
        const genericTypeMatch = line.match(/^export\s+type\s+(\w+)<(.*?)>\s+=\s+/);
        const simpleTypeMatch = line.match(/^export\s+type\s+(\w+)\s+=\s+/);

        if (genericTypeMatch) {
            // Generic type found
            const typeName = genericTypeMatch[1];
            if (!typeName.startsWith('Ag')) return;

            const genericParams = genericTypeMatch[2].split(',').map((param) => param.trim().split(' ')[0]);
            const defaultParams = genericParams.map((p) => `${p} = unknown`).join(', ');

            outputLines.push(`import { ${typeName} as ${typeName}_no_default } from '${IMPORT_SOURCE}';`);
            outputLines.push(
                `export type ${typeName}<${defaultParams}> = ${typeName}_no_default<${genericParams.join(', ')}>;`
            );
        } else if (simpleTypeMatch) {
            // Non-generic type found
            const typeName = simpleTypeMatch[1];
            if (!typeName.startsWith('Ag')) return;

            outputLines.push(`import { ${typeName} } from '${IMPORT_SOURCE}';`);
            outputLines.push(`export { ${typeName} };`);
        }
    });
});

// Write the output file
fs.writeFileSync(OUTPUT_FILE, outputLines.join('\n'), 'utf8');
console.log(`Generated: ${OUTPUT_FILE}`);
