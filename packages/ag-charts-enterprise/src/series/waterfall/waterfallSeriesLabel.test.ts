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
        ['format', '#{.2f}', '#{.0f}'],
        ['maxWidth', 80, 90],
        ['maxHeight', 40, 50],
        ['minimumFontSize', 8, 9],
        ['wrapping', 'always', 'never'],
        ['collision.threshold', 12, 16],
        ['collision.alwaysShow', false, true],
        ['collision.collideWith.seriesItems', false, true],
        ['collision.collideWith.seriesArea', true, false],
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

    // `border.enabled` is the one leaf that is not a plain `$path`: it keeps the item-level
    // "any border property set here enables the border" rule and ORs in the series-level resolution.
    describe('border auto-enable', () => {
        it('a border property set at series level enables the border on every bar type', () => {
            const labels = resolveLabels({ label: { enabled: true, border: { stroke: '#333333' } } });

            for (const itemType of ITEM_TYPES) {
                expect(labels[itemType].border).toStrictEqual({ enabled: true, stroke: '#333333', strokeWidth: 1 });
            }
        });

        it('a border property set at item level enables the border for that bar type only', () => {
            const labels = resolveLabels({
                label: { enabled: true },
                item: { positive: { label: { border: { stroke: '#444444' } } } },
            });

            expect(labels.positive.border.enabled).toBe(true);
            expect(labels.negative.border.enabled).toBe(false);
            expect(labels.total.border.enabled).toBe(false);
        });
    });

    // The fit options (`wrapping`, `truncate`, `collision.alwaysShow`) carry an inferred default that
    // fires off the item's own fit siblings and off an array-valued `placement`/`orientation` — which
    // an item now inherits from the series. An explicit series-level value is a user value for every
    // bar type, so it has to beat that inference; only an unset one may be inferred.
    describe('fit options against the overflow inference', () => {
        it('keep explicit series-level values when an inherited `placement` array fires the inference', () => {
            const labels = resolveLabels({
                label: {
                    enabled: true,
                    placement: ['outside-end', 'inside-center'],
                    wrapping: 'never',
                    truncate: false,
                    collision: { alwaysShow: true },
                },
            });

            for (const itemType of ITEM_TYPES) {
                expect(labels[itemType].wrapping).toBe('never');
                expect(labels[itemType].truncate).toBe(false);
                expect(labels[itemType].collision.alwaysShow).toBe(true);
            }
        });

        it('keep explicit series-level values when an item-level `maxWidth` fires the inference', () => {
            const labels = resolveLabels({
                label: { enabled: true, wrapping: 'never', truncate: false, collision: { alwaysShow: true } },
                item: { positive: { label: { maxWidth: 80 } } },
            });

            expect(labels.positive.maxWidth).toBe(80);
            for (const itemType of ITEM_TYPES) {
                expect(labels[itemType].wrapping).toBe('never');
                expect(labels[itemType].truncate).toBe(false);
                expect(labels[itemType].collision.alwaysShow).toBe(true);
            }
        });

        it('still infer the managed set where the series sets no fit options', () => {
            const labels = resolveLabels({ label: { enabled: true, placement: ['outside-end', 'inside-center'] } });

            for (const itemType of ITEM_TYPES) {
                expect(labels[itemType].wrapping).toBe('on-space');
                expect(labels[itemType].truncate).toBe(true);
                expect(labels[itemType].collision.alwaysShow).toBe(false);
            }
        });

        it('let an item-level fit option override the series-level one for that bar type', () => {
            const labels = resolveLabels({
                label: { enabled: true, wrapping: 'never', truncate: false },
                item: { negative: { label: { wrapping: 'always', truncate: true } } },
            });

            expect(labels.negative.wrapping).toBe('always');
            expect(labels.negative.truncate).toBe(true);
            expect(labels.positive.wrapping).toBe('never');
            expect(labels.positive.truncate).toBe(false);
        });
    });

    // `insideStyle`/`outsideStyle` carry their own `border.enabled`, defaulting to the label's
    // top-level border enablement. The item's placement blocks have to read the series-level
    // placement enablement where there is one, not just the item's top-level border.
    describe('placement-specific border enablement', () => {
        it('inherits a placement border enabled at series level', () => {
            const labels = resolveLabels({
                label: { enabled: true, outsideStyle: { border: { enabled: true, stroke: '#ff0000' } } },
            });

            for (const itemType of ITEM_TYPES) {
                expect(labels[itemType].outsideStyle.border).toStrictEqual({ enabled: true, stroke: '#ff0000' });
                expect(labels[itemType].border.enabled).toBe(false);
                expect(labels[itemType].insideStyle.border.enabled).toBe(false);
            }
        });

        it('inherits a placement border auto-enabled at series level', () => {
            const labels = resolveLabels({
                label: { enabled: true, outsideStyle: { border: { stroke: '#ff0000' } } },
            });

            for (const itemType of ITEM_TYPES) {
                expect(labels[itemType].outsideStyle.border.enabled).toBe(true);
                expect(labels[itemType].insideStyle.border.enabled).toBe(false);
            }
        });

        it('keeps a placement border disabled at series level while the top-level border is enabled', () => {
            const labels = resolveLabels({
                label: { enabled: true, border: { stroke: '#333333' }, outsideStyle: { border: { enabled: false } } },
            });

            for (const itemType of ITEM_TYPES) {
                expect(labels[itemType].border.enabled).toBe(true);
                expect(labels[itemType].insideStyle.border.enabled).toBe(true);
                expect(labels[itemType].outsideStyle.border.enabled).toBe(false);
            }
        });

        it('lets an item-level placement border override the series-level one for that bar type', () => {
            const labels = resolveLabels({
                label: { enabled: true, outsideStyle: { border: { enabled: false } } },
                item: { positive: { label: { outsideStyle: { border: { stroke: '#444444' } } } } },
            });

            expect(labels.positive.outsideStyle.border).toStrictEqual({ enabled: true, stroke: '#444444' });
            expect(labels.negative.outsideStyle.border.enabled).toBe(false);
            expect(labels.total.outsideStyle.border.enabled).toBe(false);
        });
    });

    // `collision.collideWith` is inherited toggle by toggle, not as a block: a lower-priority edge
    // is dropped once its vertex has user-defined children, so an item setting one toggle would
    // otherwise lose its siblings — and `resolveCollideWith` reads an absent one as `false`.
    describe('collideWith partial overrides', () => {
        it('keeps the inherited theme default when an item sets another toggle', () => {
            const labels = resolveLabels({
                label: { enabled: true },
                item: { positive: { label: { collision: { collideWith: { seriesArea: true } } } } },
            });

            expect(labels.positive.collision.collideWith).toStrictEqual({ seriesItems: true, seriesArea: true });
            expect(labels.negative.collision.collideWith).toStrictEqual({ seriesItems: true });
        });

        it('keeps an explicit series-level sibling when an item sets another toggle', () => {
            const labels = resolveLabels({
                label: { enabled: true, collision: { collideWith: { markers: false, seriesItems: false } } },
                item: { positive: { label: { collision: { collideWith: { seriesArea: false } } } } },
            });

            expect(labels.positive.collision.collideWith).toStrictEqual({
                markers: false,
                seriesItems: false,
                seriesArea: false,
            });
        });

        it('lets an item override a toggle the series set explicitly', () => {
            const labels = resolveLabels({
                label: { enabled: true, collision: { collideWith: { seriesItems: false, labels: false } } },
                item: { positive: { label: { collision: { collideWith: { seriesItems: true } } } } },
            });

            expect(labels.positive.collision.collideWith).toStrictEqual({ labels: false, seriesItems: true });
            expect(labels.negative.collision.collideWith).toStrictEqual({ labels: false, seriesItems: false });
        });
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
