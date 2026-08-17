import { describe, expect, it } from 'vitest';

import { REFERENCE_ROOT_LINKS, getReferencePageLinks } from './apiReferencePageLinks';

// The ambient test env has no site base, so the hrefs below carry no `/charts` prefix.
const member = (name: string, type: any, extra: Record<string, unknown> = {}) => ({
    kind: 'member' as const,
    name,
    type,
    optional: true,
    ...extra,
});
const iface = (name: string, members: any[]) => ({ kind: 'interface' as const, name, members });
const alias = (name: string, type: any) => ({ kind: 'typeAlias' as const, name, type });
const union = (...types: any[]) => ({ kind: 'union' as const, type: types });
const variant = (name: string, discriminator: string) =>
    iface(name, [member('type', `'${discriminator}'`, { optional: false })]);

const makeReference = (nodes: Record<string, unknown>) => new Map<string, any>(Object.entries(nodes)) as any;

/** The four discriminated unions `/options/` fans its per-type pages out over. */
const optionsReference = makeReference({
    AgChartSeriesOptions: alias('AgChartSeriesOptions', union('AgBarSeriesOptions', 'AgLineSeriesOptions')),
    AgBarSeriesOptions: variant('AgBarSeriesOptions', 'bar'),
    AgLineSeriesOptions: variant('AgLineSeriesOptions', 'line'),
    AgChartAxesOptions: alias('AgChartAxesOptions', union('AgNumberAxisOptions')),
    AgNumberAxisOptions: variant('AgNumberAxisOptions', 'number'),
    AgAnnotation: alias('AgAnnotation', union('AgLineAnnotation')),
    AgLineAnnotation: variant('AgLineAnnotation', 'line'),
    AgMiniChartSeriesOptions: alias('AgMiniChartSeriesOptions', union('AgMiniChartLineSeriesOptions')),
    AgMiniChartLineSeriesOptions: variant('AgMiniChartLineSeriesOptions', 'line'),
});

/**
 * `/themes-api/` gives every `overrides` entry — one per chart type — a page of its own, keyed off
 * the interface named here. A reference without that interface has no override pages at all.
 */
const themesReference = makeReference({
    AgBaseChartThemeOverrides: iface('AgBaseChartThemeOverrides', [
        member('common', 'AgBaseThemeableChartOptions'),
        member('bar', 'AgBarThemeOverrides'),
    ]),
});

describe('getReferencePageLinks', () => {
    it('links every options page, labelled as the variant heading the page renders', () => {
        expect(getReferencePageLinks(optionsReference, 'options')).toEqual([
            // The axes record is keyed, which the heading has to show.
            { href: '/options/axes/number/', label: "axes.key[type='number']" },
            { href: '/options/series/bar/', label: "series[type='bar']" },
            { href: '/options/series/line/', label: "series[type='line']" },
            { href: '/options/initialState/annotations/line/', label: "initialState.annotations[type='line']" },
            {
                href: '/options/navigator/miniChart/series/line/',
                label: "navigator.miniChart.series[type='line']",
            },
        ]);
    });

    it('links every themes override page', () => {
        expect(getReferencePageLinks(themesReference, 'themes-api')).toEqual([
            { href: '/themes-api/overrides/common/', label: 'common' },
            { href: '/themes-api/overrides/bar/', label: 'bar' },
        ]);
    });

    it('resolves both reference roots, so a page can link to the one it belongs to', () => {
        expect(REFERENCE_ROOT_LINKS.options).toEqual({ href: '/options/', label: 'Options API' });
        expect(REFERENCE_ROOT_LINKS['themes-api']).toEqual({ href: '/themes-api/', label: 'Themes API' });
    });
});
