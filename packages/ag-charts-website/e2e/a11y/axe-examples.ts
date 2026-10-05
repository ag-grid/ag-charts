import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { existsSync, readFileSync } from 'fs';
import glob from 'glob';
import { dirname, join, resolve } from 'path';

import type { CompactViolation } from '../../scripts/a11y/axe-report';
import { EXAMPLE_OPTIONS } from '../example-options';
import { SELECTORS, toExamplePageUrl, toGalleryPageUrls } from '../util';

export interface A11yExample {
    pageName: string;
    example: string;
    url: string;
}

const POC_EXAMPLES: ReadonlyArray<[pageName: string, example: string]> = [
    ['bar-series', 'grouped-category-bar'],
    ['line-series', 'simple-line'],
    ['area-series', 'simple-area'],
    ['scatter-series', 'simple-scatter'],
    ['bubble-series', 'simple-bubble'],
    ['pie-series', 'simple-pie'],
    ['heatmap-series', 'simple-heatmap'],
    ['treemap-series', 'labels'],
    ['sunburst-series', 'labels'],
    ['box-plot-series', 'simple-box-plot'],
    ['candlestick-series', 'simple-candlestick'],
    ['radar-line-series', 'simple-radar-line'],
    ['range-bar-series', 'simple-range-bar'],
    ['waterfall-series', 'simple-waterfall'],
    ['maps', 'world-colour-map'],
    ['sankey-series', 'simple-sankey'],
    ['funnel-series', 'simple-funnel'],
    ['radial-gauge', 'fill'],
    ['chord-series', 'simple-chord'],
    ['legend', 'legend-pagination'],
    ['annotations', 'annotations-toolbar'],
    ['navigator', 'navigator'],
    ['zoom', 'zoom-buttons'],
    ['context-menu', 'context-menu'],
    ['tooltips', 'default-tooltip'],
];

const GENERATED_EXAMPLES_ROOT = resolve(__dirname, '../../../../dist/generated-examples/ag-charts-website');
const IGNORED_PAGES = new Set(['benchmarks']);

/** Gallery examples that have a route; mirrors the `hidden` filter in `getGalleryExamples()` (filesData.ts). */
function getRoutableGalleryExamples(): Set<string> {
    const data = JSON.parse(readFileSync(resolve(__dirname, '../../src/content/gallery/data.json'), 'utf-8'));
    const names = new Set<string>();
    for (const group of data.series as Array<Array<{ examples?: Array<{ name: string; hidden?: boolean }> }>>) {
        for (const chartType of group) {
            for (const ex of chartType.examples ?? []) {
                if (ex.hidden !== true) names.add(ex.name);
            }
        }
    }
    return names;
}

function docsExample(pageName: string, example: string): A11yExample {
    return { pageName, example, url: toExamplePageUrl(pageName, example, 'vanilla').url };
}

/** Every example in the generation output (docs and gallery), as vanilla standalone pages. */
function getAllGeneratedExamples(): A11yExample[] {
    if (!existsSync(GENERATED_EXAMPLES_ROOT)) {
        throw new Error(
            `No generated examples at ${GENERATED_EXAMPLES_ROOT}; run \`yarn nx generate-examples ag-charts-website\` first.`
        );
    }

    const routableGallery = getRoutableGalleryExamples();
    const examples: A11yExample[] = [];
    for (const file of glob.sync('**/_examples/*/plain/vanilla/contents.json', { cwd: GENERATED_EXAMPLES_ROOT })) {
        if (existsSync(join(GENERATED_EXAMPLES_ROOT, dirname(file), 'error.txt'))) continue;

        const [pagePath, examplePath] = file.split('/_examples/');
        const example = examplePath.split('/')[0];
        if (pagePath === 'gallery') {
            if (!routableGallery.has(example)) continue;
            examples.push({ pageName: 'gallery', example, url: toGalleryPageUrls(example)[0].url });
            continue;
        }

        const pageName = pagePath.replace(/^docs\//, '');
        if (IGNORED_PAGES.has(pageName) || EXAMPLE_OPTIONS[pageName]?.[example]?.status === '404') continue;
        examples.push(docsExample(pageName, example));
    }
    return examples;
}

export function selectA11yExamples(): A11yExample[] {
    const sweepAll = process.env.AG_A11Y_ALL_EXAMPLES;
    if (sweepAll != null && sweepAll !== '') {
        return getAllGeneratedExamples();
    }
    return POC_EXAMPLES.map(([pageName, example]) => docsExample(pageName, example));
}

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
const MAX_HTML_LENGTH = 300;

export async function runAxeScan(page: Page) {
    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();

    const violations: CompactViolation[] = [];
    for (const violation of results.violations) {
        const nodes = [];
        for (const node of violation.nodes) {
            const target = node.target.map(String);
            const inChart =
                node.target.length === 1 && typeof node.target[0] === 'string'
                    ? await page.evaluate(
                          ([selector, wrapper]) => {
                              try {
                                  const element = document.querySelector(selector);
                                  return element == null ? null : element.closest(wrapper) != null;
                              } catch {
                                  return null;
                              }
                          },
                          [node.target[0], SELECTORS.wrapper] as const
                      )
                    : null;
            nodes.push({
                target,
                html: node.html.slice(0, MAX_HTML_LENGTH),
                failureSummary: node.failureSummary,
                inChart,
            });
        }
        violations.push({
            id: violation.id,
            impact: violation.impact ?? null,
            help: violation.help,
            helpUrl: violation.helpUrl,
            nodes,
        });
    }

    return { violations, axeVersion: results.testEngine.version };
}
