import { describe, expect, it } from 'vitest';

import { type FallbackNavItem, type FallbackNavOptions, buildFallbackNav } from './apiReferenceFallbackNav';

const prop = (name: string, type: any) => ({ kind: 'member' as const, name, type, optional: true });
const iface = (name: string, members: any[]) => ({ kind: 'interface' as const, name, members });

// A cut-down `AgChartOptions`: a plain member, a nested interface, and `series` as an
// `InterfaceArray` whose variants each have a page of their own.
const optionsReference = () =>
    new Map<string, any>(
        Object.entries({
            AgChartOptions: iface('AgChartOptions', [
                prop('data', { kind: 'array', type: 'any' }),
                prop('legend', 'AgLegendOptions'),
                prop('series', { kind: 'array', type: 'AgChartSeriesOptions' }),
            ]),
            AgLegendOptions: iface('AgLegendOptions', [prop('item', 'AgLegendItemOptions')]),
            AgLegendItemOptions: iface('AgLegendItemOptions', [prop('marker', 'AgLegendMarkerOptions')]),
            AgLegendMarkerOptions: iface('AgLegendMarkerOptions', [prop('size', 'number')]),
            AgChartSeriesOptions: {
                kind: 'typeAlias',
                name: 'AgChartSeriesOptions',
                type: { kind: 'union', type: ['AgBarSeriesOptions', 'AgLineSeriesOptions'] },
            },
            AgBarSeriesOptions: iface('AgBarSeriesOptions', [prop('type', "'bar'"), prop('fill', 'string')]),
            AgLineSeriesOptions: iface('AgLineSeriesOptions', [prop('type', "'line'"), prop('stroke', 'string')]),
        })
    );

const optionsNav = (overrides: Partial<FallbackNavOptions> = {}) =>
    buildFallbackNav({
        reference: optionsReference(),
        rootInterface: 'AgChartOptions',
        rootLabel: 'options',
        basePath: '/charts/options/',
        config: { specialTypes: { AgChartSeriesOptions: 'InterfaceArray' } },
        depth: 2,
        ...overrides,
    });

function flatten(item: FallbackNavItem, depth = 0): string[] {
    const current = `${'  '.repeat(depth)}${item.label} ${item.href}${item.isCurrentPage ? ' (current)' : ''}`;
    return [current, ...item.children.flatMap((child) => flatten(child, depth + 1))];
}

describe('buildFallbackNav', () => {
    it('lists two levels, linking members to anchors and variants to their pages', () => {
        expect(flatten(optionsNav())).toEqual([
            'options /charts/options/ (current)',
            '  data /charts/options/#reference-AgChartOptions-data',
            '  legend /charts/options/#reference-AgChartOptions-legend',
            '    item /charts/options/#reference-AgChartOptions-legend-item',
            '  series /charts/options/#reference-AgChartOptions-series',
            "    series[type='bar'] /charts/options/series/bar/",
            "    series[type='line'] /charts/options/series/line/",
        ]);
    });

    it("also lists the current page's own members", () => {
        expect(flatten(optionsNav({ pageInterface: 'AgBarSeriesOptions' }))).toEqual([
            'options /charts/options/',
            '  data /charts/options/#reference-AgChartOptions-data',
            '  legend /charts/options/#reference-AgChartOptions-legend',
            '    item /charts/options/#reference-AgChartOptions-legend-item',
            '  series /charts/options/#reference-AgChartOptions-series',
            "    series[type='bar'] /charts/options/series/bar/ (current)",
            '      type /charts/options/series/bar/#reference-AgBarSeriesOptions-type',
            '      fill /charts/options/series/bar/#reference-AgBarSeriesOptions-fill',
            "    series[type='line'] /charts/options/series/line/",
        ]);
    });

    it('keeps the path to a page past the depth cut-off, and nothing else past it', () => {
        const reference = optionsReference();
        reference.set(
            'AgChartOptions',
            iface('AgChartOptions', [prop('data', 'any'), prop('navigator', 'AgNavigatorOptions')])
        );
        reference.set(
            'AgNavigatorOptions',
            iface('AgNavigatorOptions', [prop('height', 'number'), prop('miniChart', 'AgMiniChartOptions')])
        );
        reference.set(
            'AgMiniChartOptions',
            iface('AgMiniChartOptions', [
                prop('padding', 'AgLegendOptions'),
                prop('series', { kind: 'array', type: 'AgChartSeriesOptions' }),
            ])
        );

        expect(flatten(optionsNav({ reference }))).toEqual([
            'options /charts/options/ (current)',
            '  data /charts/options/#reference-AgChartOptions-data',
            '  navigator /charts/options/#reference-AgChartOptions-navigator',
            '    height /charts/options/#reference-AgChartOptions-navigator-height',
            '    miniChart /charts/options/#reference-AgChartOptions-navigator-miniChart',
            '      series /charts/options/#reference-AgChartOptions-navigator-miniChart-series',
            "        navigator.miniChart.series[type='bar'] /charts/options/navigator/miniChart/series/bar/",
            "        navigator.miniChart.series[type='line'] /charts/options/navigator/miniChart/series/line/",
        ]);
    });

    it('does not expand members listed in noExpand', () => {
        const nav = optionsNav({ config: { specialTypes: {}, noExpand: ['legend'] } });
        expect(nav.children.find((item) => item.label === 'legend')?.children).toEqual([]);
    });

    it('links nested-page members to their pages', () => {
        const reference = new Map<string, any>(
            Object.entries({
                AgChartTheme: iface('AgChartTheme', [
                    prop('palette', 'AgChartThemePalette'),
                    prop('overrides', 'AgBaseChartThemeOverrides'),
                ]),
                AgChartThemePalette: iface('AgChartThemePalette', [prop('fills', { kind: 'array', type: 'string' })]),
                AgBaseChartThemeOverrides: iface('AgBaseChartThemeOverrides', [
                    prop('bar', 'AgBarSeriesThemeOverrides'),
                ]),
                AgBarSeriesThemeOverrides: iface('AgBarSeriesThemeOverrides', [prop('series', 'any')]),
            })
        );

        const nav = buildFallbackNav({
            reference,
            rootInterface: 'AgChartTheme',
            rootLabel: 'theme',
            basePath: '/charts/themes-api/',
            config: { specialTypes: { AgBaseChartThemeOverrides: 'NestedPage' } },
            pageInterface: 'AgBarSeriesThemeOverrides',
            depth: 2,
        });

        expect(flatten(nav)).toEqual([
            'theme /charts/themes-api/',
            '  palette /charts/themes-api/#reference-AgChartTheme-palette',
            '    fills /charts/themes-api/#reference-AgChartTheme-palette-fills',
            '  overrides /charts/themes-api/#reference-AgChartTheme-overrides',
            '    bar /charts/themes-api/overrides/bar/ (current)',
            '      series /charts/themes-api/overrides/bar/#reference-AgBarSeriesThemeOverrides-series',
        ]);
    });
});
