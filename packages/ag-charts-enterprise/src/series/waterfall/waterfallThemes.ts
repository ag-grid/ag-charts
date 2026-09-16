import { type AgWaterfallSeriesItemOptions, type WithThemeParams } from 'ag-charts-community';
import {
    FILL_GRADIENT_LINEAR_KEYED_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_KEYED_DEFAULTS,
    LABEL_BOXING_TOP_LEVEL_DEFAULTS,
    LABEL_OVERFLOW_ALWAYS_SHOW,
    LABEL_OVERFLOW_DEFAULTS,
    LABEL_PLACEMENT_STYLE_DEFAULTS,
    SINGLE_SERIES_HIGHLIGHT_STYLE,
    undocumentedThemeOptions,
} from 'ag-charts-core';
import type { AgChartLabelPlacementStyleOptions, ExtensibleSeriesTheme, Operation } from 'ag-charts-types';

/**
 * `series.item.<type>.label.<leaf>` is three levels below `series.label.<leaf>`, and one more per
 * nested block (`border`, `collision`, `insideStyle`, `outsideStyle`).
 */
const seriesLabelPath = (leaf: string, depth = 3) => `${'../'.repeat(depth)}label/${leaf}`;

const inherited = (leaf: string, depth = 3) => ({ $path: seriesLabelPath(leaf, depth) });

/**
 * An item label opts into overflow management on its own fit siblings, or on an array-valued
 * `placement`/`orientation` — which it now inherits from `series.label`, so the trigger fires on
 * series-level configuration too. `prefix` is `.` for a leaf of the label block and `..` one level
 * deeper, in `collision`.
 */
const overflowTrigger = (prefix: '.' | '..', siblings: string[]): Operation => ({
    $or: [
        { $isUserOption: [siblings] },
        { $isType: [{ $path: `${prefix}/placement` }, 'array'] },
        { $isType: [{ $path: `${prefix}/orientation` }, 'array'] },
    ],
});

/**
 * A fit option, whose inferred default must not displace a value the user set at series level: that
 * value is explicit for every bar type, so it outranks an inference the item's own `maxWidth` or an
 * inherited `placement` array triggered. Where the series leaves it unset, the inference applies and
 * falls back to the series-level resolution rather than to the unmanaged default.
 */
const inheritedFit = (
    leaf: string,
    depth: number,
    prefix: '.' | '..',
    siblings: string[],
    inferred: string | boolean
): Operation => ({
    $isUserOption: [
        seriesLabelPath(leaf, depth),
        inherited(leaf, depth),
        { $if: [overflowTrigger(prefix, siblings), inferred, inherited(leaf, depth)] },
    ],
});

function itemTheme(
    key: 'altUp' | 'altDown' | 'neutral',
    index: number
): WithThemeParams<AgWaterfallSeriesItemOptions<any>> {
    return {
        fill: {
            $applySwitch: [
                { $path: 'type' },
                {
                    $if: [
                        { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                        { $path: [`/${index}`, { $palette: 'fill' }, { $palette: 'fills' }] },
                        { $palette: `${key}.fill` },
                    ],
                },
                ['gradient', FILL_GRADIENT_LINEAR_KEYED_DEFAULTS(key)],
                ['image', FILL_IMAGE_DEFAULTS],
                ['pattern', FILL_PATTERN_KEYED_DEFAULTS(key)],
            ],
        },
        stroke: { $palette: `${key}.stroke` },
        strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
        label: {
            enabled: inherited('enabled'),
            fill: inherited('fill'),
            fillOpacity: inherited('fillOpacity'),
            cornerRadius: inherited('cornerRadius'),
            padding: inherited('padding'),
            border: {
                enabled: { $or: [{ $isUserOption: '../border' }, inherited('border/enabled', 4)] },
                stroke: inherited('border/stroke', 4),
                strokeWidth: inherited('border/strokeWidth', 4),
                strokeOpacity: inherited('border/strokeOpacity', 4),
            },
            color: inherited('color'),
            fontStyle: inherited('fontStyle'),
            fontWeight: inherited('fontWeight'),
            fontSize: inherited('fontSize'),
            fontFamily: inherited('fontFamily'),
            format: inherited('format'),
            formatter: inherited('formatter'),
            itemStyler: inherited('itemStyler'),
            maxWidth: inherited('maxWidth'),
            maxHeight: inherited('maxHeight'),
            minimumFontSize: inherited('minimumFontSize'),
            wrapping: inheritedFit(
                'wrapping',
                3,
                '.',
                ['./maxWidth', './maxHeight', './truncate', './minimumFontSize'],
                'on-space'
            ),
            truncate: inheritedFit(
                'truncate',
                3,
                '.',
                ['./maxWidth', './maxHeight', './wrapping', './minimumFontSize'],
                true
            ),
            collision: {
                threshold: inherited('collision/threshold', 4),
                alwaysShow: inheritedFit(
                    'collision/alwaysShow',
                    4,
                    '..',
                    ['../maxWidth', '../maxHeight', '../wrapping', '../truncate', '../minimumFontSize'],
                    false
                ),
                // Inherited toggle by toggle, not as a block: `resolveVertexInEdgePriority` drops a
                // lower-priority edge's value once the vertex has user-defined children, so a single
                // `$path` on `collideWith` would lose every sibling the moment an item set one
                // toggle — and `resolveCollideWith` reads an absent `seriesItems` as `false`.
                ...undocumentedThemeOptions({
                    collideWith: {
                        markers: inherited('collision/collideWith/markers', 5),
                        labels: inherited('collision/collideWith/labels', 5),
                        seriesItems: inherited('collision/collideWith/seriesItems', 5),
                        seriesArea: inherited('collision/collideWith/seriesArea', 5),
                    },
                }),
            },
            insideStyle: placementStyle('insideStyle'),
            outsideStyle: placementStyle('outsideStyle'),
            placement: inherited('placement'),
            spacing: inherited('spacing'),
            orientation: inherited('orientation'),
        },
    };
}

/**
 * The item-level placement block defers to `series.label.<styleKey>`, which has already applied the
 * per-placement colour default, so only a user value set at item level overrides it.
 */
function placementStyle(styleKey: 'insideStyle' | 'outsideStyle'): WithThemeParams<AgChartLabelPlacementStyleOptions> {
    return {
        color: { $isUserOption: ['../color', { $path: '../color' }, inherited(`${styleKey}/color`, 4)] },
        fill: inherited(`${styleKey}/fill`, 4),
        fillOpacity: inherited(`${styleKey}/fillOpacity`, 4),
        cornerRadius: inherited(`${styleKey}/cornerRadius`, 4),
        padding: inherited(`${styleKey}/padding`, 4),
        border: {
            // A placement border configured at series level — explicitly, or auto-enabled by styling
            // it — is a placement-specific decision, so it outranks the label's top-level
            // enablement, matching how `LABEL_PLACEMENT_STYLE_DEFAULTS` ranks the two at one level.
            // An item-level placement border still wins: the user value replaces this default.
            enabled: {
                $isUserOption: [
                    [seriesLabelPath(`${styleKey}/border/enabled`, 5), seriesLabelPath(`${styleKey}/border`, 5)],
                    inherited(`${styleKey}/border/enabled`, 5),
                    { $path: '../../border/enabled' },
                ],
            },
            stroke: inherited(`${styleKey}/border/stroke`, 5),
            strokeWidth: inherited(`${styleKey}/border/strokeWidth`, 5),
            strokeOpacity: inherited(`${styleKey}/border/strokeOpacity`, 5),
        },
    };
}

const seriesLabelTheme = {
    ...LABEL_BOXING_TOP_LEVEL_DEFAULTS,
    ...LABEL_OVERFLOW_DEFAULTS,
    enabled: false,
    fontStyle: undefined,
    fontWeight: { $ref: 'fontWeight' as const },
    fontSize: { $ref: 'fontSize' as const },
    fontFamily: { $ref: 'fontFamily' as const },
    formatter: undefined,
    spacing: 6,
    padding: 6,
    collision: {
        threshold: 4,
        alwaysShow: LABEL_OVERFLOW_ALWAYS_SHOW,
        ...undocumentedThemeOptions({ collideWith: { seriesItems: true } }),
    },
    insideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('chartBackgroundColor'),
    outsideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('textColor'),
    placement: 'outside-end' as const,
};

export const WATERFALL_SERIES_THEME: ExtensibleSeriesTheme<'waterfall'> = {
    series: {
        label: seriesLabelTheme,
        item: {
            positive: itemTheme('altUp', 0),
            negative: itemTheme('altDown', 1),
            total: itemTheme('neutral', 2),
        },
        line: {
            stroke: { $palette: 'neutral.stroke' },
            strokeOpacity: 1,
            lineDash: [0],
            lineDashOffset: 0,
            strokeWidth: 2,
        },
        highlight: SINGLE_SERIES_HIGHLIGHT_STYLE,
    },
    legend: {
        enabled: true,
        toggleSeries: false,
    },
};
