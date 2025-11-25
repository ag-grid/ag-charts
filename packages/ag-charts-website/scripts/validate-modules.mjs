#!/usr/bin/env node
import { ESLint } from 'eslint';
import fg from 'fast-glob';
import tseslint from 'typescript-eslint';

import rule from '../../../libraries/ag-charts-eslint-rules/rules/validate-module-registration.mjs';

const files = fg.sync('src/content/**/_examples/*/main.ts');
if (files.length === 0) {
    console.error('No example files found');
    process.exit(1);
}

const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
        {
            files: ['**/*.ts'],
            languageOptions: { parser: tseslint.parser, parserOptions: { project: false, projectService: false } },
            plugins: { aglint: { rules: { 'validate-module-registration': rule } } },
            rules: { 'aglint/validate-module-registration': ['error', { warnOverRegistration: false }] },
        },
    ],
});
const results = await eslint.lintFiles(files);
const output = await (await eslint.loadFormatter('stylish')).format(results);
if (output) console.log(output);
const errors = results.reduce((a, r) => a + r.errorCount, 0);
if (!errors) console.log(`Validated ${files.length} examples - no issues.`);
process.exit(errors ? 1 : 0);
