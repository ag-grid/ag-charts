#!/usr/bin/env ts-node

/* eslint-disable no-console */
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import * as glob from 'glob';
import { dirname, join } from 'path';

const __dirname = dirname(require.main?.filename ?? '.');

interface Example {
    path: string;
    affected: boolean;
    category: string;
    pagePath: string;
    example: string;
}

interface TestCategory {
    name: string;
    examples: Example[];
    estimatedTestCount: number;
}

const FRAMEWORKS = ['vanilla', 'typescript', 'reactFunctional', 'reactFunctionalTs', 'angular', 'vue3'];
const TESTS_PER_EXAMPLE = FRAMEWORKS.length; // Each example generates tests for each framework

function getExamples(): Example[] {
    const examples = glob
        .sync('./src/content/**/_examples/*/main.ts')
        .map((path) => {
            const astroPath = path.split('content/').at(1)!;
            const [pagePath, examplePath] = astroPath.split('/_examples/');
            const example = examplePath.replace(/\/[a-zA-Z-]+\.ts$/, '');
            const page = pagePath.replace(/^docs\//, '');

            // Merge -test pages into their base page (e.g., 'line-series-test' -> 'line-series')
            const category = page.endsWith('-test') ? page.slice(0, -5) : page;

            return {
                path,
                affected: true, // Will be updated by affected logic
                category,
                pagePath: page,
                example,
            };
        })
        .filter((example) => example.pagePath !== 'gallery' && example.pagePath !== 'benchmarks');

    // Apply affected logic if NX_BASE is set
    if (process.env.NX_BASE && process.env.AG_FORCE_ALL_TESTS !== '1') {
        const exampleGenChanged = execSync(
            `git diff --name-only ${process.env.NX_BASE} -- ../../plugins/ag-charts-generate-example-files/`
        )
            .toString()
            .split('\n')
            .some((t) => t.trim().length > 0);

        const changedFiles = new Set(
            execSync(`git diff --name-only ${process.env.NX_BASE} -- ./src/content/`)
                .toString()
                .split('\n')
                .map((v) => v.replace(/^packages\/ag-charts-website\//, './'))
        );

        let affectedCount = 0;
        for (const example of examples) {
            example.affected = exampleGenChanged || changedFiles.has(example.path);
            affectedCount += example.affected ? 1 : 0;
        }

        console.warn(`NX_BASE set - applied changed example processing, ${affectedCount} changed examples found.`);
    }

    return examples;
}

function categorizeExamples(examples: Example[]): TestCategory[] {
    const categoryMap = new Map<string, Example[]>();

    // Group examples by category
    for (const example of examples) {
        if (!categoryMap.has(example.category)) {
            categoryMap.set(example.category, []);
        }
        categoryMap.get(example.category)!.push(example);
    }

    // Convert to TestCategory objects
    const categories: TestCategory[] = [];
    for (const [categoryName, categoryExamples] of categoryMap.entries()) {
        categories.push({
            name: categoryName,
            examples: categoryExamples,
            estimatedTestCount: categoryExamples.length * TESTS_PER_EXAMPLE,
        });
    }

    // Sort by estimated test count for better distribution
    categories.sort((a, b) => b.estimatedTestCount - a.estimatedTestCount);

    return categories;
}

function generateTestFile(category: TestCategory, outputDir: string): void {
    const fileName = `examples-${category.name}.spec.ts`;
    const filePath = join(outputDir, fileName);

    const content = `// Auto-generated test file for category: ${category.name}
// Generated at: ${new Date().toISOString()}
// Test count: ${category.estimatedTestCount}

import { convertPageUrls, createTestCase, triggerExampleTooltips } from '../examples-util';
// import { contextTest } from '../context-manager';
import { test as contextTest } from '../fixture';
import { EXAMPLE_OPTIONS } from '../example-options';
import { setupIntrinsicAssertions } from '../util';

contextTest.describe('examples-${category.name}', () => {
    const config = setupIntrinsicAssertions(contextTest);

    // Category: ${category.name}
    // Examples in this category: ${category.examples.length}
    const categoryExamples = [
${category.examples.map((ex) => `        { path: '${ex.path}', affected: ${ex.affected} },`).join('\n')}
    ];

    for (const { path, affected } of categoryExamples) {
        for (const opts of convertPageUrls(path, EXAMPLE_OPTIONS)) {
            const { framework, pagePath, example } = opts;

            const testFn = affected ? contextTest : contextTest.skip;

            contextTest.describe(\`Framework: \${framework}\`, () => {
                contextTest.skip(!affected, 'unaffected example');

                contextTest.describe(\`Example \${pagePath}: \${example}\${affected ? '' : ' (!!!SKIPPED!!!)'}\`, () => {
                    createTestCase(testFn as any, opts, config, undefined, triggerExampleTooltips);
                });
            });
        }
    }
});
`;

    writeFileSync(filePath, content, 'utf8');
    console.log(`Generated test file: ${fileName} (${category.estimatedTestCount} tests)`);
}

function main(): void {
    const outputDir = __dirname;
    const generatedDir = join(outputDir, 'generated');

    // Ensure generated directory exists
    if (!existsSync(generatedDir)) {
        mkdirSync(generatedDir, { recursive: true });
    }

    console.log('Discovering examples...');
    const examples = getExamples();
    console.log(`Found ${examples.length} examples`);

    console.log('Categorizing examples...');
    const categories = categorizeExamples(examples);

    console.log('\nCategory distribution:');
    let totalTests = 0;
    for (const category of categories) {
        console.log(`  ${category.name}: ${category.examples.length} examples (${category.estimatedTestCount} tests)`);
        totalTests += category.estimatedTestCount;
    }
    console.log(`\nTotal estimated tests: ${totalTests}`);

    console.log('\nGenerating test files...');
    for (const category of categories) {
        generateTestFile(category, generatedDir);
    }

    console.log('\nGeneration complete!');
    console.log(`Generated ${categories.length} test files in ${generatedDir}`);
}

if (require.main === module) {
    main();
}
