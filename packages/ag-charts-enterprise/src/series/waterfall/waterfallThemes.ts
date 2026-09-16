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
const inherited = (leaf: string, depth = 3) => ({ $path: `${'../'.repeat(depth)}label/${leaf}` });

/**
 * The overflow triggers are self-relative, so an item label that inherits its fit options from
 * `series.label` no longer trips them on a value the user set at series level; the trigger's false
 * arm inherits the series-level resolution instead of falling back to the unmanaged default.
 */
const overflowTrigger = (siblings: string[]): Operation => ({
    $or: [
        { $isUserOption: [siblings] },
        { $isType: [{ $path: './placement' }, 'array'] },
        { $isType: [{ $path: './orientation' }, 'array'] },
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
            wrapping: {
                $if: [
                    overflowTrigger(['./maxWidth', './maxHeight', './truncate', './minimumFontSize']),
                    'on-space',
                    inherited('wrapping'),
                ],
            },
            truncate: {
                $if: [
                    overflowTrigger(['./maxWidth', './maxHeight', './wrapping', './minimumFontSize']),
                    true,
                    inherited('truncate'),
                ],
            },
            collision: {
                threshold: inherited('collision/threshold', 4),
                alwaysShow: {
                    $if: [
                        {
                            $or: [
                                {
                                    $isUserOption: [
                                        [
                                            '../maxWidth',
                                            '../maxHeight',
                                            '../wrapping',
                                            '../truncate',
                                            '../minimumFontSize',
                                        ],
                                    ],
                                },
                                { $isType: [{ $path: '../placement' }, 'array'] },
                                { $isType: [{ $path: '../orientation' }, 'array'] },
                            ],
                        },
                        false,
                        inherited('collision/alwaysShow', 4),
                    ],
                },
                ...undocumentedThemeOptions({ collideWith: inherited('collision/collideWith', 4) }),
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
            enabled: { $path: '../../border/enabled' },
            stroke: inherited(`${styleKey}/border/stroke`, 5),
            strokeWidth: inherited(`${styleKey}/border/strokeWidth`, 5),
            strokeOpacity: inherited(`${styleKey}/border/strokeOpacity`, 5),
        },
    };
}

/**
 * Every public leaf is declared here even where it has no default, so each item-level `$path` has a
 * target to inherit and a user value set at series level reaches all three bar types.
 */
const seriesLabelTheme = {
    ...LABEL_BOXING_TOP_LEVEL_DEFAULTS,
    ...LABEL_OVERFLOW_DEFAULTS,
    enabled: false,
    fillOpacity: undefined,
    color: undefined,
    fontStyle: undefined,
    fontWeight: { $ref: 'fontWeight' as const },
    fontSize: { $ref: 'fontSize' as const },
    fontFamily: { $ref: 'fontFamily' as const },
    format: undefined,
    formatter: undefined,
    itemStyler: undefined,
    maxWidth: undefined,
    maxHeight: undefined,
    minimumFontSize: undefined,
    orientation: undefined,
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
