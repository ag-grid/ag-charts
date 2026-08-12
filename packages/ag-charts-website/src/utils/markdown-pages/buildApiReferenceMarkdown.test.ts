import type { ApiReferenceType } from '@components/api-documentation/apiReferenceHelpers';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { optionsVariantPageContent } from './apiReferencePageContent';
import {
    buildOptionsApiMarkdown,
    buildOptionsVariantMarkdown,
    buildThemesApiMarkdown,
} from './buildApiReferenceMarkdown';

// The ambient test env has no site base, so the URLs below carry no `/charts` prefix.
const SITE_ROOT = 'https://www.ag-grid.com/';

// The generated reference the pages themselves render, so a renamed or dropped interface shows up
// here rather than in a silently empty twin. Produced by `nx build ag-charts-types`, which
// `nx test ag-charts-website` depends on.
const reference: ApiReferenceType = new Map(
    Object.entries(
        JSON.parse(
            readFileSync(
                join(__dirname, '../../../../../dist/packages/ag-charts-types/resolved-interfaces.AUTO.json'),
                'utf8'
            )
        )
    )
);

/** Body rows of the first markdown table, as `[property, type, default, description]`. */
function tableRows(output: string): string[][] {
    return output
        .split('\n')
        .filter((line) => line.startsWith('| ') && !line.startsWith('| --- '))
        .slice(1)
        .map((line) =>
            line
                .split(/(?<!\\)\|/)
                .slice(1, -1)
                .map((cell) => cell.trim())
        );
}

const propertyPaths = (output: string) => tableRows(output).map(([property]) => property);

describe('buildOptionsApiMarkdown', () => {
    const output = buildOptionsApiMarkdown({ reference, siteRoot: SITE_ROOT });

    it("emits frontmatter matching the page's title and description", () => {
        expect(output.startsWith('---\ntitle: "Options API"\n')).toBe(true);
        expect(output).toContain('description: "Options API reference for AG Charts');
        expect(output).toContain('\n# AgChartOptions\n');
        expect(output).toContain('Interface: `AgChartOptions`');
    });

    it('flattens the property tree the page expands on click into dotted-path rows', () => {
        const paths = propertyPaths(output);

        expect(paths).toContain('series');
        expect(paths).toContain('legend');
        expect(paths).toContain('legend.enabled');
        expect(paths.length).toBeGreaterThan(500);
    });

    it('links every variant page, so an agent can reach the per-type reference', () => {
        expect(output).toContain("- [series[type='bar']](https://www.ag-grid.com/options/series/bar/)");
        // The axes record is keyed, which the heading has to show.
        expect(output).toContain("- [axes.key[type='number']](https://www.ag-grid.com/options/axes/number/)");
        expect(output).toContain(
            "- [initialState.annotations[type='line']](https://www.ag-grid.com/options/initialState/annotations/line/)"
        );
        expect(output).toContain(
            "- [navigator.miniChart.series[type='line']](https://www.ag-grid.com/options/navigator/miniChart/series/line/)"
        );
    });
});

describe('buildOptionsVariantMarkdown', () => {
    const pageTitle = { name: 'series', type: 'bar' };
    const output = buildOptionsVariantMarkdown({
        reference,
        pageInterface: 'AgBarSeriesOptions',
        pageTitle,
        ...optionsVariantPageContent(pageTitle),
        siteRoot: SITE_ROOT,
    });

    it("titles the page as the variant, matching the HTML page's own metadata", () => {
        expect(output).toContain('title: "Options API (Bar Series)"');
        expect(output).toContain("\n# series[type='bar']\n");
        expect(output).toContain('Interface: `AgBarSeriesOptions`');
    });

    it('documents the variant interface, not the root options', () => {
        const paths = propertyPaths(output);

        expect(paths).toContain('type (required)');
        expect(paths).toContain('xKey (required)');
        expect(paths).toContain('label');
        expect(paths).toContain('label.enabled');
        expect(paths).not.toContain('legend');
    });

    it('links back to the options reference it is part of', () => {
        expect(output).toContain('[AG Charts Options API reference](https://www.ag-grid.com/options/)');
    });
});

describe('buildThemesApiMarkdown', () => {
    const output = buildThemesApiMarkdown({ reference, siteRoot: SITE_ROOT });

    it("emits frontmatter matching the page's title and description", () => {
        expect(output.startsWith('---\ntitle: "Themes API"\n')).toBe(true);
        expect(output).toContain('\n# AgChartTheme\n');
        expect(output).toContain('Interface: `AgChartTheme`');
    });

    it('lists every chart type that can be themed, and the option groups each one takes', () => {
        const paths = propertyPaths(output);

        expect(paths).toContain('overrides');
        expect(paths).toContain('overrides.bar');
        expect(paths).toContain('overrides.bar.series');
        expect(paths).toContain('overrides.bar.axes');
        expect(paths).toContain('overrides.treemap');
    });

    it('stops before the combinatorial part of the tree, and says so', () => {
        // Every chart type repeats the whole chart options tree, so expanding a fourth level runs
        // to tens of thousands of rows. The reader is told where the table stops instead.
        expect(propertyPaths(output)).not.toContain('overrides.bar.series.cornerRadius');
        expect(output).toContain('Only the first three levels of `overrides` are listed');
        expect(output).toContain('[Options API reference](https://www.ag-grid.com/options/)');
    });

    it('expands the rest of the theme in full', () => {
        const paths = propertyPaths(output);

        expect(paths).toContain('baseTheme');
        expect(paths).toContain('palette');
        expect(paths).toContain('palette.fills');
        expect(paths).toContain('params');
    });
});
