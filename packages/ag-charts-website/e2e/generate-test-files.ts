#!/usr/bin/env ts-node
/* eslint-disable no-console */
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import * as glob from 'glob';
import { dirname, join } from 'path';

import { getChangedExamples, isExampleChanged } from './changed-examples';

const __dirname = dirname(require.main?.filename ?? '.');

interface Example {
    path: string;
    affected: boolean;
    /**
     * Any file in the example changed relative to `NX_BASE` (true for everything when no diff is
     * computable). Changed examples keep the full framework sweep even when CI scopes the run to a
     * subset of frameworks — see `scopeFrameworks` in `examples-util.ts`.
     */
    changed: boolean;
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

// Internal test pages merge into their base page category (e.g. 'line-series-test' -> 'line-series').
const INTERNAL_PAGE_SUFFIXES = ['-test', '-e2e'];

function toBasePageCategory(page: string): string {
    for (const suffix of INTERNAL_PAGE_SUFFIXES) {
        if (page.endsWith(suffix)) {
            return page.slice(0, -suffix.length);
        }
    }
    return page;
}

function getExamples(): Example[] {
    // Framework scoping escalates changed examples regardless of AG_FORCE_ALL_TESTS, so the diff is
    // computed up front and the affected logic below reuses it.
    const changedExamples = getChangedExamples();

    const examples = glob
        .sync('./src/content/**/_examples/*/main.ts')
        .map((path) => {
            const astroPath = path.split('content/').at(1)!;
            const [pagePath, examplePath] = astroPath.split('/_examples/');
            const example = examplePath.replace(/\/[a-zA-Z-]+\.ts$/, '');
            const page = pagePath.replace(/^docs\//, '');

            const category = toBasePageCategory(page);

            return {
                path,
                affected: true, // Will be updated by affected logic
                changed: changedExamples == null || isExampleChanged(changedExamples, path),
                category,
                pagePath: page,
                example,
            };
        })
        .filter((example) => example.pagePath !== 'gallery' && example.pagePath !== 'benchmarks');

    // Apply affected logic if NX_BASE is set
    if (changedExamples != null && process.env.AG_FORCE_ALL_TESTS !== '1') {
        let affectedCount = 0;
        for (const example of examples) {
            example.affected = example.changed;
            affectedCount += example.affected ? 1 : 0;
        }

        console.warn(`NX_BASE set - applied changed example processing, ${affectedCount} changed examples found.`);
    }

    if (changedExamples != null) {
        const changedCount = examples.filter((example) => example.changed).length;
        console.warn(`Framework scoping - ${changedCount} changed examples will sweep every framework.`);
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
${category.examples
    .map((ex) => `        { path: '${ex.path}', affected: ${ex.affected}, changed: ${ex.changed} },`)
    .join('\n')}
    ];

    for (const { path, affected, changed } of categoryExamples) {
        // Changed examples sweep every framework; the rest follow the run's framework scope.
        for (const opts of convertPageUrls(path, EXAMPLE_OPTIONS, undefined, changed)) {
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
