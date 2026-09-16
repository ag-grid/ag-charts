import { describe, expect, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { setupEnterpriseModules } from '../../setup';

setupEnterpriseModules();

const ITEM_TYPES = ['positive', 'negative', 'total'] as const;

const resolveSeries = (series: object, theme?: object): Record<string, any> => {
    const options = { series: [series], ...(theme == null ? {} : { theme }) } as unknown as AgChartOptions;
    const { processedOptions } = new _ModuleSupport.ChartOptions(
        options,
        {} as AgChartOptions,
        {},
        {},
        {}
    ) as unknown as { processedOptions: { series: Record<string, any>[] } };
    return processedOptions.series[0];
};

const resolveLabels = (series: object, theme?: object) => {
    const resolved = resolveSeries({ type: 'waterfall', xKey: 'x', yKey: 'y', ...series }, theme);
    return {
        positive: resolved.item.positive.label,
        negative: resolved.item.negative.label,
        total: resolved.item.total.label,
    };
};

const setPath = (target: Record<string, any>, path: string, value: unknown) => {
    const keys = path.split('.');
    let node = target;
    for (const key of keys.slice(0, -1)) {
        node[key] ??= {};
        node = node[key];
    }
    node[keys.at(-1)!] = value;
    return target;
};

const getPath = (source: Record<string, any>, path: string) =>
    path.split('.').reduce<any>((node, key) => node?.[key], source);

/**
 * Captured on the base commit, before `series.label` existed: the resolved `item.<type>.label`
 * subtree for a waterfall configured with no label options at all. Identical for all three bar
 * types. Pinning it literally is the gate for "an item-level-only waterfall renders as it does today".
 */
const BASELINE_ITEM_LABEL = {
    enabled: false,
    border: { enabled: false, stroke: 'rgba(24, 29, 31, 0.08)', strokeWidth: 1 },
    cornerRadius: 4,
    padding: 6,
    fontFamily:
        '"IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
    fontSize: 12,
    fontWeight: 400,
    collision: { threshold: 4, alwaysShow: true, collideWith: { seriesItems: true } },
    insideStyle: { color: '#ffffff', border: { enabled: false } },
    outsideStyle: { color: '#181d1f', border: { enabled: false } },
    placement: 'outside-end',
    spacing: 6,
};

describe('waterfall series-level label', () => {
    describe('resolves identically to the pre-change theme', () => {
        it('with no label configuration', () => {
            const labels = resolveLabels({});

            for (const itemType of ITEM_TYPES) {
                expect(labels[itemType]).toStrictEqual(BASELINE_ITEM_LABEL);
            }
        });

        it('with item-level fit options, which have no image-snapshot coverage', () => {
            const labels = resolveLabels({
                item: {
                    positive: { label: { maxWidth: 80, maxHeight: 40, truncate: false, collision: { threshold: 12 } } },
                },
            });

            expect(labels.positive).toStrictEqual({
                ...BASELINE_ITEM_LABEL,
                enabled: true,
                maxWidth: 80,
                maxHeight: 40,
                wrapping: 'on-space',
                truncate: false,
                collision: { threshold: 12, alwaysShow: false, collideWith: { seriesItems: true } },
            });
            expect(labels.negative).toStrictEqual(BASELINE_ITEM_LABEL);
            expect(labels.total).toStrictEqual(BASELINE_ITEM_LABEL);
        });
    });

    // One row per public leaf of `AgWaterfallSeriesLabelOptions`, plus the undocumented
    // `collision.collideWith` the theme already carried. `maxIneffective: 0` in the theme-provenance
    // suite is blind to absent inheritance, so a missed leaf must fail here or nowhere.
    const leaves: [leaf: string, seriesValue: unknown, itemValue: unknown][] = [
        ['fontSize', 20, 30],
        ['fontFamily', 'Arial', 'Courier'],
        ['fontStyle', 'italic', 'normal'],
        ['fontWeight', 'bold', 'normal'],
        ['color', '#ff0000', '#00ff00'],
        ['fill', '#111111', '#222222'],
        ['fillOpacity', 0.5, 0.25],
        ['cornerRadius', 7, 9],
        ['padding', 11, 13],
        ['border.stroke', '#333333', '#444444'],
        ['border.strokeWidth', 3, 5],
        ['border.strokeOpacity', 0.4, 0.6],
        ['maxWidth', 80, 90],
        ['maxHeight', 40, 50],
        ['minimumFontSize', 8, 9],
        ['wrapping', 'always', 'never'],
        ['collision.threshold', 12, 16],
        ['collision.alwaysShow', false, true],
        ['collision.collideWith.seriesItems', false, true],
        ['insideStyle.color', '#aa0000', '#bb0000'],
        ['insideStyle.fill', '#aa1111', '#bb1111'],
        ['insideStyle.fillOpacity', 0.7, 0.8],
        ['insideStyle.cornerRadius', 2, 3],
        ['insideStyle.padding', 14, 15],
        ['insideStyle.border.stroke', '#aa2222', '#bb2222'],
        ['insideStyle.border.strokeWidth', 6, 7],
        ['insideStyle.border.strokeOpacity', 0.3, 0.2],
        ['outsideStyle.color', '#cc0000', '#dd0000'],
        ['outsideStyle.fill', '#cc1111', '#dd1111'],
        ['outsideStyle.fillOpacity', 0.65, 0.85],
        ['outsideStyle.cornerRadius', 12, 13],
        ['outsideStyle.padding', 16, 17],
        ['outsideStyle.border.stroke', '#cc2222', '#dd2222'],
        ['outsideStyle.border.strokeWidth', 8, 9],
        ['outsideStyle.border.strokeOpacity', 0.15, 0.35],
        ['placement', 'inside-center', 'inside-start'],
        ['spacing', 3, 5],
        ['orientation', 'vertical', 'horizontal'],
    ];

    describe.each(leaves)('%s', (leaf, seriesValue, itemValue) => {
        it('set at series level applies to every bar type', () => {
            const labels = resolveLabels({ label: setPath({ enabled: true }, leaf, seriesValue) });

            for (const itemType of ITEM_TYPES) {
                expect(getPath(labels[itemType], leaf)).toStrictEqual(seriesValue);
            }
        });

        it('set at item level wins for that bar type only', () => {
            const labels = resolveLabels({
                label: setPath({ enabled: true }, leaf, seriesValue),
                item: { negative: { label: setPath({}, leaf, itemValue) } },
            });

            expect(getPath(labels.negative, leaf)).toStrictEqual(itemValue);
            expect(getPath(labels.positive, leaf)).toStrictEqual(seriesValue);
            expect(getPath(labels.total, leaf)).toStrictEqual(seriesValue);
        });
    });

    // `truncate` is excluded from the table: its theme default is an expression keyed off the other
    // fit options, so a bare `truncate` at one level changes the resolution of `wrapping` at both.
    it('inherits `truncate` from series level', () => {
        const labels = resolveLabels({ label: { enabled: true, truncate: true } });

        for (const itemType of ITEM_TYPES) {
            expect(labels[itemType].truncate).toBe(true);
        }
    });

    describe('callback leaves', () => {
        // The options pipeline wraps every callback, so a resolved callback is never reference-equal
        // to the one supplied — inheritance is asserted by invoking it instead.
        const formatter = () => 'formatted';
        const itemStyler = () => ({ fill: '#123456' });

        it('inherit `formatter` from series level', () => {
            const labels = resolveLabels({ label: { enabled: true, formatter } });

            for (const itemType of ITEM_TYPES) {
                expect(labels[itemType].formatter?.({ value: 1 })).toBe('formatted');
            }
        });

        it('inherit `itemStyler` from series level', () => {
            const labels = resolveLabels({ label: { enabled: true, itemStyler } });

            for (const itemType of ITEM_TYPES) {
                expect(labels[itemType].itemStyler?.({ value: 1 })).toEqual({ fill: '#123456' });
            }
        });
    });

    describe('auto-enable inference', () => {
        it('still fires for an item-level label that omits `enabled`', () => {
            const labels = resolveLabels({ item: { positive: { label: { fontSize: 20 } } } });

            expect(labels.positive.enabled).toBe(true);
            expect(labels.negative.enabled).toBe(false);
            expect(labels.total.enabled).toBe(false);
        });

        it('fires for every bar type from a series-level label that omits `enabled`', () => {
            const labels = resolveLabels({ label: { fontSize: 20 } });

            for (const itemType of ITEM_TYPES) {
                expect(labels[itemType].enabled).toBe(true);
                expect(labels[itemType].fontSize).toBe(20);
            }
        });
    });

    describe('user theme', () => {
        // The ticket fixes user `item.<type>.label` over user `series.label`, but is silent on a user
        // theme's item label versus an inline series label. Theme-space resolution ranks the whole
        // theme below inline options, matching the existing axis `parentLevel` inheritance; see
        // `AI decisions` -> "Theme precedence ordering" for the rejected alternative.
        const theme = {
            overrides: { waterfall: { series: { item: { positive: { label: { fontSize: 44 } } } } } },
        };

        it('item label from a user theme applies to its bar type', () => {
            const labels = resolveLabels({ label: { enabled: true } }, theme);

            expect(labels.positive.fontSize).toBe(44);
            expect(labels.negative.fontSize).toBe(12);
        });

        it('a user theme series label reaches every bar type', () => {
            const labels = resolveLabels(
                { label: { enabled: true } },
                { overrides: { waterfall: { series: { label: { fontSize: 26 } } } } }
            );

            for (const itemType of ITEM_TYPES) {
                expect(labels[itemType].fontSize).toBe(26);
            }
        });
    });
});
