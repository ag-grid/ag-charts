import { type AgWaterfallSeriesItemOptions, type WithThemeParams } from 'ag-charts-community';
import {
    BAR_LABEL_COLLISION_THEME,
    COMMON_SERIES_THEME_DEFAULTS,
    FILL_GRADIENT_LINEAR_KEYED_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_KEYED_DEFAULTS,
    GLOW_THEME_DEFAULTS,
    ITEM_GLOW_BUCKETS,
    LABEL_BOXING_TOP_LEVEL_DEFAULTS,
    LABEL_PLACEMENT_STYLE_DEFAULTS,
    SERIES_TOOLTIP_THEME,
    SHADOW_THEME_DEFAULTS,
    SINGLE_SERIES_HIGHLIGHT_STYLE,
    STROKE_STYLE_THEME_DEFAULTS,
    themeLineHeight,
    withGlowThemeDefaults,
} from 'ag-charts-core';
import type { AgChartLabelPlacementStyleOptions, ExtensibleSeriesTheme } from 'ag-charts-types';

/**
 * `series.item.<type>.label.<leaf>` is three levels below `series.label.<leaf>`, and one more per
 * nested block (`border`, `collision`, `insideStyle`, `outsideStyle`).
 */
const seriesLabelPath = (leaf: string, depth = 3) => `${'../'.repeat(depth)}label/${leaf}`;

const inherited = (leaf: string, depth = 3) => ({ $path: seriesLabelPath(leaf, depth) });

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
        fillOpacity: 1,
        ...STROKE_STYLE_THEME_DEFAULTS,
        cornerRadius: 0,
        shadow: SHADOW_THEME_DEFAULTS,
        glow: GLOW_THEME_DEFAULTS,
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
            lineHeight: {
                $isUserOption: [
                    seriesLabelPath('lineHeight'),
                    inherited('lineHeight'),
                    themeLineHeight('seriesLabelLineHeight'),
                ],
            },
            fontFamily: inherited('fontFamily'),
            format: inherited('format'),
            formatter: inherited('formatter'),
            itemStyler: inherited('itemStyler'),
            maxWidth: inherited('maxWidth'),
            maxHeight: inherited('maxHeight'),
            minimumFontSize: inherited('minimumFontSize'),
            wrapping: inherited('wrapping'),
            truncate: inherited('truncate'),
            collision: {
                threshold: inherited('collision/threshold', 4),
                alwaysShow: inherited('collision/alwaysShow', 4),
                // Toggle by toggle, not as a block: a lower-priority edge is dropped once its
                // vertex has user-defined children, and an absent `shapes` reads as `true`.
                collideWith: {
                    markers: inherited('collision/collideWith/markers', 5),
                    labels: inherited('collision/collideWith/labels', 5),
                    shapes: inherited('collision/collideWith/shapes', 5),
                    seriesArea: inherited('collision/collideWith/seriesArea', 5),
                    axisLabels: inherited('collision/collideWith/axisLabels', 5),
                },
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
        // The series placement fill may be a theme-param default, which must not beat an item-level `label.fill`.
        fill: {
            $isUserOption: [
                seriesLabelPath(`${styleKey}/fill`, 4),
                inherited(`${styleKey}/fill`, 4),
                { $if: [{ $isUserOption: '../fill' }, undefined, inherited(`${styleKey}/fill`, 4)] },
            ],
        },
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
    wrapping: 'on-space' as const,
    truncate: false,
    enabled: false,
    fontStyle: undefined,
    fontWeight: { $ref: 'seriesLabelFontWeight' as const },
    fontSize: { $ref: 'seriesLabelFontSize' as const },
    lineHeight: themeLineHeight('seriesLabelLineHeight'),
    fontFamily: { $ref: 'seriesLabelFontFamily' as const },
    formatter: undefined,
    spacing: 8,
    padding: 8,
    collision: BAR_LABEL_COLLISION_THEME,
    insideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('inside'),
    outsideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('outside'),
    placement: ['inside-center' as const, 'outside-end' as const],
};

export const WATERFALL_SERIES_THEME: ExtensibleSeriesTheme<'waterfall'> = {
    series: {
        ...COMMON_SERIES_THEME_DEFAULTS,
        direction: 'vertical',
        label: seriesLabelTheme,
        item: {
            positive: itemTheme('altUp', 0),
            negative: itemTheme('altDown', 1),
            total: itemTheme('neutral', 2),
        },
        line: {
            enabled: true,
            stroke: { $palette: 'neutral.stroke' },
            ...STROKE_STYLE_THEME_DEFAULTS,
            strokeWidth: 2,
        },
        tooltip: SERIES_TOOLTIP_THEME,
        highlight: withGlowThemeDefaults(SINGLE_SERIES_HIGHLIGHT_STYLE, ITEM_GLOW_BUCKETS, {
            glow: ['positive', 'negative', 'total'].map((item) => `/series/$index/item/${item}/glow`),
        }),
    },
    legend: {
        enabled: true,
        toggleSeries: false,
    },
};
