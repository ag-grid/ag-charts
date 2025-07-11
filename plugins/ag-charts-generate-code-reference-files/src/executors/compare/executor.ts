/* eslint-disable no-console */
import { gitCurrentBranch, inputGlob, readGitFiles, writeFile, writeJSONFile } from 'ag-shared/plugin-utils';
import { createPatch } from 'diff';
import { readFileSync } from 'fs';
import * as ts from 'typescript';

import { extractTypeMap } from '../../doc-interfaces/type-extractor';

interface CompareOptions {
    commit: string;
    inputs: string[];
    output: string;
}

export default async function (options: CompareOptions) {
    try {
        console.log('-'.repeat(80));
        console.log('Compare docs reference files...');
        console.log(`Comparing local HEAD with ${options.commit}`);
        console.log('Using Typescript version:', ts.version);

        const gitFiles = readCommitFiles(options.inputs, options.commit);
        const localFiles = readInputFiles(options.inputs);

        const gitMapper = await extractTypeMap(gitFiles);
        const localMapper = await extractTypeMap(localFiles);
        const patches = diffTypes(gitMapper, localMapper);

        // await writeJSONFile(`${options.output}.debug.json`, Object.fromEntries(patches));
        await writeFile(options.output, renderHtmlReport(options, patches));

        console.log(`Report generated - written to ${options.output}.`);
        console.log('-'.repeat(80));

        return { success: true };
    } catch (e) {
        console.error(e, { options });
        return { success: false };
    }
}

function readInputFiles(inputs: string[]): string[] {
    return inputs.flatMap(inputGlob).map((filePath: string) => readFileSync(filePath, 'utf8'));
}

function readCommitFiles(inputs: string[], commit: string): string[] {
    return inputs.flatMap((filePath) => readGitFiles(filePath, commit));
}

function diffTypes(before: Map<string, string>, after: Map<string, string>): Map<string, string> {
    const patches = new Map<string, string>();
    const beforeKeys = new Set(before.keys());

    for (const [key, newValue] of after.entries()) {
        if (beforeKeys.has(key)) {
            beforeKeys.delete(key);
            const oldValue = before.get(key)!;
            if (oldValue === newValue) continue;
            patches.set(key, createPatch(key, oldValue, newValue));
        } else {
            patches.set(key, createPatch(key, '', newValue));
        }
    }

    for (const key of beforeKeys) {
        const oldValue = before.get(key)!;
        patches.set(key, createPatch(key, oldValue, ''));
    }

    return patches;
}

function renderHtmlReport(options: CompareOptions, patches: Map<string, string>): string {
    const fullPatch = Array.from(patches.values()).join('\n');
    const gitBranch = gitCurrentBranch();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Type Diff Report</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/diff2html/bundles/css/diff2html.min.css" />
</head>
<body>
    <h1>Type Diff Report</h1>
    <h2>${options.commit} <small>vs.</small> ${gitBranch}</h2>
    <div id="diff"></div>
    <script src="https://cdn.jsdelivr.net/npm/diff2html/bundles/js/diff2html-ui.min.js"></script>
    <script>
        new Diff2HtmlUI(
            document.getElementById('diff'),
            ${JSON.stringify(fullPatch)},
            { matching: 'lines', outputFormat: 'side-by-side' }
        ).draw();
    </script>
</body>
</html>`;
}
