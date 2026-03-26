#!/usr/bin/env node
import { ESLint } from 'eslint';
import unusedImports from 'eslint-plugin-unused-imports';
import fg from 'fast-glob';
import tseslint from 'typescript-eslint';

import rule from '../../../libraries/ag-charts-eslint-rules/rules/validate-module-registration.mjs';

const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');

const files = fg.sync('src/content/**/_examples/*/main.ts');
if (files.length === 0) {
    console.error('No example files found');
    process.exit(1);
}

// First pass: validate and fix module registration
const moduleEslint = new ESLint({
    overrideConfigFile: true,
    fix: shouldFix,
    overrideConfig: [
        {
            files: ['**/*.ts'],
            languageOptions: { parser: tseslint.parser, parserOptions: { project: false, projectService: false } },
            plugins: { aglint: { rules: { 'validate-module-registration': rule } } },
            rules: { 'aglint/validate-module-registration': ['error', { warnOverRegistration: true }] },
        },
    ],
});
const moduleResults = await moduleEslint.lintFiles(files);

if (shouldFix) {
    await ESLint.outputFixes(moduleResults);
}

const moduleOutput = await (await moduleEslint.loadFormatter('stylish')).format(moduleResults);
if (moduleOutput) console.log(moduleOutput);

const moduleErrors = moduleResults.reduce((a, r) => a + r.errorCount, 0);

// Second pass (only if --fix): clean up unused and duplicate imports
if (shouldFix) {
    const importEslint = new ESLint({
        overrideConfigFile: true,
        fix: true,
        overrideConfig: [
            {
                files: ['**/*.ts'],
                languageOptions: { parser: tseslint.parser, parserOptions: { project: false, projectService: false } },
                plugins: { 'unused-imports': unusedImports },
                rules: {
                    'unused-imports/no-unused-imports': 'error',
                    'no-duplicate-imports': 'error',
                },
            },
        ],
    });
    const importResults = await importEslint.lintFiles(files);
    await ESLint.outputFixes(importResults);

    const importFixedCount = importResults.reduce((a, r) => a + r.fixableErrorCount, 0);
    if (importFixedCount > 0) {
        console.log(`Cleaned up unused and duplicate imports in ${importFixedCount} files.`);
    }
}

if (!moduleErrors) console.log(`Validated ${files.length} examples - no issues.`);
process.exit(moduleErrors ? 1 : 0);
