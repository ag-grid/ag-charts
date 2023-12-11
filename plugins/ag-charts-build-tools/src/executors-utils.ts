import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import * as ts from 'typescript';

export function readFile(filePath: string) {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;
}

export function writeJSONFile(filePath: string, data: unknown, indent = 2) {
    const dataContent = JSON.stringify(data, null, indent);
    writeFile(filePath, dataContent);
}

export function writeFile(filePath: string, newContent: unknown, indent = 2) {
    const fileContent = readFile(filePath)?.toString();

    // Only write if content changed to avoid false-positive change detection.
    if (typeof newContent === 'string' && fileContent === newContent) return;

    const outputDir = path.dirname(filePath);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(filePath, String(newContent));
}

export function parseFile(filePath: string) {
    return ts.createSourceFile('tempFile.ts', fs.readFileSync(filePath, 'utf8'), ts.ScriptTarget.Latest, true);
}

export function inputGlob(fullPath: string) {
    return glob.sync(`${fullPath}/**/*.ts`, {
        ignore: [`${fullPath}/**/*.test.ts`, `${fullPath}/**/*.spec.ts`],
    });
}
