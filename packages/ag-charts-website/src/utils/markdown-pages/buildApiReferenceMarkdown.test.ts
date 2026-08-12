import { describe, expect, it } from 'vitest';

import { optionsVariantPageContent } from './apiReferencePageContent';
import {
    buildOptionsApiMarkdown,
    buildOptionsVariantMarkdown,
    buildThemesApiMarkdown,
} from './buildApiReferenceMarkdown';

// The ambient test env has no site base, so the URLs below carry no `/charts` prefix.
const SITE_ROOT = 'https://www.ag-grid.com/';

const member = (name: string, type: any, extra: Record<string, unknown> = {}) => ({
    kind: 'member' as const,
    name,
    type,
    optional: true,
    ...extra,
});
const iface = (name: string, members: any[], extra: Record<string, unknown> = {}) => ({
    kind: 'interface' as const,
    name,
    members,
    ...extra,
});
const alias = (name: string, type: any) => ({ kind: 'typeAlias' as const, name, type });
const union = (...types: any[]) => ({ kind: 'union' as const, type: types });
const typeRef = (type: string) => ({ kind: 'typeRef' as const, type });
const variant = (name: string, discriminator: string, members: any[] = []) =>
    iface(name, [member('type', `'${discriminator}'`, { optional: false }), ...members]);

const makeReference = (nodes: Record<string, unknown>) => new Map<string, any>(Object.entries(nodes)) as any;

/**
 * The shape `getOptionsStaticPaths` fans out over: four discriminated unions, each variant carrying
 * the string literal that names its page. Real interface names, since the builders look them up.
 */
const optionsReference = makeReference({
    AgChartOptions: iface(
        'AgChartOptions',
        [
            member('series', { kind: 'array', type: typeRef('AgChartSeriesOptions') }),
            member('legend', typeRef('AgChartLegendOptions')),
        ],
        { docs: ['Configuration for the chart.'] }
    ),
    AgChartLegendOptions: iface('AgChartLegendOptions', [
        member('enabled', 'boolean', { docs: ['Whether to show the legend.'] }),
    ]),
    AgChartSeriesOptions: alias('AgChartSeriesOptions', union('AgBarSeriesOptions', 'AgLineSeriesOptions')),
    AgBarSeriesOptions: variant('AgBarSeriesOptions', 'bar', [
        member('xKey', 'string', { optional: false }),
        member('label', typeRef('AgBarSeriesLabelOptions')),
    ]),
    AgBarSeriesLabelOptions: iface('AgBarSeriesLabelOptions', [member('enabled', 'boolean')]),
    AgLineSeriesOptions: variant('AgLineSeriesOptions', 'line'),
    AgChartAxesOptions: alias('AgChartAxesOptions', union('AgNumberAxisOptions')),
    AgNumberAxisOptions: variant('AgNumberAxisOptions', 'number'),
    AgAnnotation: alias('AgAnnotation', union('AgLineAnnotation')),
    AgLineAnnotation: variant('AgLineAnnotation', 'line'),
    AgMiniChartSeriesOptions: alias('AgMiniChartSeriesOptions', union('AgMiniChartLineSeriesOptions')),
    AgMiniChartLineSeriesOptions: variant('AgMiniChartLineSeriesOptions', 'line'),
});

/**
 * `overrides` nests one entry per chart type, each holding a further group of options — the branch
 * the themes twin caps, since the real reference repeats the whole chart tree under every type.
 */
const themesReference = makeReference({
    AgChartTheme: iface(
        'AgChartTheme',
        [
            member('baseTheme', 'AgChartThemeName'),
            member('palette', typeRef('AgChartThemePalette')),
            member('overrides', typeRef('AgThemeOverrides')),
        ],
        { docs: ['This object is used to define the configuration for a custom chart theme.'] }
    ),
    AgChartThemePalette: iface('AgChartThemePalette', [member('fills', 'string[]')]),
    AgThemeOverrides: iface('AgThemeOverrides', [
        member('bar', typeRef('AgBarThemeOverrides')),
        member('line', typeRef('AgLineThemeOverrides')),
    ]),
    AgBarThemeOverrides: iface('AgBarThemeOverrides', [
        member('series', typeRef('AgBarSeriesThemeableOptions')),
        member('axes', typeRef('AgCartesianAxesTheme')),
    ]),
    AgBarSeriesThemeableOptions: iface('AgBarSeriesThemeableOptions', [member('cornerRadius', 'number')]),
    AgCartesianAxesTheme: iface('AgCartesianAxesTheme', [member('number', 'AgNumberAxisTheme')]),
    AgLineThemeOverrides: iface('AgLineThemeOverrides', [member('series', typeRef('AgBarSeriesThemeableOptions'))]),
});

/** The `Property` column of each table row, which is what carries the nesting. */
function propertyPaths(output: string): string[] {
    return output
        .split('\n')
        .filter((line) => line.startsWith('| ') && !line.startsWith('| --- '))
        .slice(1)
        .map((line) => line.split('|')[1].trim());
}

describe('buildOptionsApiMarkdown', () => {
    const output = buildOptionsApiMarkdown({ reference: optionsReference, siteRoot: SITE_ROOT });

    it("emits frontmatter matching the page's title and description", () => {
        expect(output.startsWith('---\ntitle: "Options API"\n')).toBe(true);
        expect(output).toContain('description: "Options API reference for AG Charts');
        expect(output).toContain('\n# AgChartOptions\n');
        expect(output).toContain('Configuration for the chart.');
        expect(output).toContain('Interface: `AgChartOptions`');
    });

    it('flattens the property tree the page expands on click into dotted-path rows', () => {
        expect(propertyPaths(output)).toEqual(['series', 'legend', 'legend.enabled']);
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
        reference: optionsReference,
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
        expect(propertyPaths(output)).toEqual(['type (required)', 'xKey (required)', 'label', 'label.enabled']);
    });

    it('links back to the options reference it is part of', () => {
        expect(output).toContain('[AG Charts Options API reference](https://www.ag-grid.com/options/)');
    });
});

describe('buildThemesApiMarkdown', () => {
    const output = buildThemesApiMarkdown({ reference: themesReference, siteRoot: SITE_ROOT });

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
        expect(paths).toContain('overrides.line');
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
    });
});
