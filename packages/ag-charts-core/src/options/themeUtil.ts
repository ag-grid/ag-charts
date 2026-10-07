import type {
    AgCartesianChartOptions,
    AgChartAllThemeParams,
    AgChartLabelFitOptions,
    AgChartLabelPlacementStyleOptions,
    AgHighlightOptions,
    AgHighlightStyleOptions,
    AgMultiSeriesHighlightOptions,
    AgSelectionOptions,
    AgSelectionStyleOptions,
    AgSeriesSegmentation,
    AgSeriesTooltip,
    FontWeight,
    LabelBoxOptions,
    Operation,
    WithThemeParams,
} from 'ag-charts-types';

import { mapValues } from '../data/object';
import { Color } from '../format/color';
import { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } from '../types/themeConstants';
import type {
    RequiredInternalAgGradientColor,
    RequiredInternalAgImageFill,
    RequiredInternalAgPatternColor,
} from './normalised/normalisedCommonOptions';

type CartesianAxis = Exclude<AgCartesianChartOptions['axes'], undefined>[0];

/** Spread undocumented theme defaults into a template; the `object` return type erases the keys so siblings stay validated. */
export function undocumentedThemeOptions(options: object): object {
    return options;
}

export const DIRECTION_SWAP_AXES: WithThemeParams<Record<string, CartesianAxis>> = {
    x: {
        position: CARTESIAN_POSITION.BOTTOM,
        type: {
            $if: [
                { $eq: [{ $path: ['/series/0/direction', undefined] }, 'horizontal'] },
                CARTESIAN_AXIS_TYPE.NUMBER,
                CARTESIAN_AXIS_TYPE.CATEGORY,
            ],
        },
    },
    y: {
        position: CARTESIAN_POSITION.LEFT,
        type: {
            $if: [
                { $eq: [{ $path: ['/series/0/direction', undefined] }, 'horizontal'] },
                CARTESIAN_AXIS_TYPE.CATEGORY,
                CARTESIAN_AXIS_TYPE.NUMBER,
            ],
        },
    },
};

export const SAFE_FILL_OPERATION: any = {
    $if: [
        {
            $or: [
                { $isGradient: { $palette: 'fill' } },
                { $isPattern: { $palette: 'fill' } },
                { $isImage: { $value: '$1' } },
            ],
        },
        { $palette: 'fillFallback' },
        { $palette: 'fill' },
    ],
};

export const SAFE_FILLS_OPERATION: any = {
    $if: [
        {
            $or: [
                { $isGradient: { $palette: 'fill' } },
                { $isPattern: { $palette: 'fill' } },
                { $isImage: { $value: '$1' } },
            ],
        },
        { $palette: 'fillsFallback' },
        { $palette: 'fills' },
    ],
};

export const SAFE_STROKE_FILL_OPERATION: any = {
    $if: [
        { $isGradient: { $palette: 'fill' } },
        { $palette: 'fillFallback' },
        {
            $if: [
                { $isPattern: { $palette: 'fill' } },
                { $path: ['/stroke', { $palette: 'fillFallback' }, { $palette: 'fill' }] },
                { $palette: 'fill' },
            ],
        },
    ],
};

export const SAFE_RANGE2_OPERATION: any = {
    $if: [
        {
            $or: [
                { $isGradient: { $palette: 'fill' } },
                { $isPattern: { $palette: 'fill' } },
                { $isImage: { $value: '$1' } },
            ],
        },
        [{ $palette: 'fillFallback' }, { $palette: 'fillFallback' }],
        { $palette: 'range2' },
    ],
};

export const FILL_GRADIENT_BLANK_DEFAULTS: RequiredInternalAgGradientColor = {
    type: 'gradient',
    gradient: 'linear',
    bounds: 'item',
    colorStops: [{ color: 'black' }],
    rotation: 0,
    reverse: false,
    colorSpace: 'rgb',
};

export const FILL_GRADIENT_LINEAR_DEFAULTS: WithThemeParams<RequiredInternalAgGradientColor> = {
    type: 'gradient',
    gradient: 'linear',
    bounds: 'item',
    colorStops: { $shallow: { $map: [{ color: { $value: '$1' } }, { $palette: 'gradient' }] } },
    rotation: 0,
    reverse: false,
    colorSpace: 'rgb',
};

export const FILL_GRADIENT_LINEAR_HIERARCHY_DEFAULTS: WithThemeParams<RequiredInternalAgGradientColor> = {
    ...FILL_GRADIENT_LINEAR_DEFAULTS,
    colorStops: {
        $shallow: [
            {
                color: {
                    $mix: [{ $path: ['/1', { $palette: 'fill' }, { $palette: 'hierarchyColors' }] }, 'black', 0.15],
                },
            },
            {
                color: {
                    $mix: [{ $path: ['/1', { $palette: 'fill' }, { $palette: 'hierarchyColors' }] }, 'white', 0.15],
                },
            },
        ],
    },
};

export const FILL_GRADIENT_LINEAR_SINGLE_DEFAULTS: WithThemeParams<RequiredInternalAgGradientColor> = {
    ...FILL_GRADIENT_LINEAR_DEFAULTS,
    colorStops: {
        $map: [{ color: { $value: '$1' } }, { $path: ['/0', undefined, { $palette: 'gradients' }] }],
    },
};

export const FILL_GRADIENT_LINEAR_KEYED_DEFAULTS = (
    key: 'up' | 'down' | 'altUp' | 'altDown' | 'neutral'
): WithThemeParams<RequiredInternalAgGradientColor> => ({
    ...FILL_GRADIENT_LINEAR_DEFAULTS,
    colorStops: {
        $shallow: {
            $if: [
                {
                    $or: [
                        { $isGradient: { $palette: `${key}.fill` } },
                        { $isPattern: { $palette: `${key}.fill` } },
                        { $isImage: { $palette: `${key}.fill` } },
                    ],
                },
                { $path: ['/colorStops', undefined, { $palette: `${key}.fill` }] },
                [
                    { color: { $mix: [{ $palette: `${key}.fill` }, 'black', 0.15] } },
                    { color: { $mix: [{ $palette: `${key}.fill` }, 'white', 0.15] } },
                ],
            ],
        },
    } as any,
});

export const FILL_GRADIENT_RADIAL_DEFAULTS: WithThemeParams<RequiredInternalAgGradientColor> = {
    type: 'gradient',
    gradient: 'radial',
    bounds: 'item',
    colorStops: { $shallow: { $map: [{ color: { $value: '$1' } }, { $palette: 'gradient' }] } },
    rotation: 0,
    reverse: false,
    colorSpace: 'rgb',
};

export const FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS: WithThemeParams<RequiredInternalAgGradientColor> = {
    ...FILL_GRADIENT_RADIAL_DEFAULTS,
    reverse: true,
};

export const FILL_GRADIENT_RADIAL_SERIES_DEFAULTS: WithThemeParams<RequiredInternalAgGradientColor> = {
    ...FILL_GRADIENT_RADIAL_DEFAULTS,
    bounds: 'series',
};

export const FILL_GRADIENT_RADIAL_REVERSED_SERIES_DEFAULTS: WithThemeParams<RequiredInternalAgGradientColor> = {
    ...FILL_GRADIENT_RADIAL_DEFAULTS,
    bounds: 'series',
    reverse: true,
};

export const FILL_GRADIENT_CONIC_SERIES_DEFAULTS: WithThemeParams<RequiredInternalAgGradientColor> = {
    type: 'gradient',
    gradient: 'conic',
    bounds: 'series',
    colorStops: { $map: [{ color: { $value: '$1' } }, { $palette: 'gradient' }] },
    rotation: 0,
    reverse: false,
    colorSpace: 'rgb',
};

export const FILL_PATTERN_DEFAULTS: WithThemeParams<RequiredInternalAgPatternColor> = {
    type: 'pattern',
    pattern: 'forward-slanted-lines',
    width: { $isUserOption: ['./height', { $path: './height' }, 10] },
    height: { $isUserOption: ['./width', { $path: './width' }, 10] },
    padding: 2,
    fill: {
        $if: [
            {
                $or: [{ $isGradient: { $palette: 'fill' } }, { $isImage: { $palette: 'fill' } }],
            },
            { $palette: 'fillFallback' },
            {
                $if: [
                    { $isPattern: { $palette: 'fill' } },
                    { $path: ['/fill', { $palette: 'fillFallback' }, { $palette: 'fill' }] },
                    { $palette: 'fill' },
                ],
            },
        ],
    },
    fillOpacity: 1,
    stroke: SAFE_STROKE_FILL_OPERATION,
    strokeOpacity: 1,
    strokeWidth: {
        $switch: [
            { $path: './pattern' },
            0,
            [['backward-slanted-lines', 'forward-slanted-lines', 'horizontal-lines', 'vertical-lines'], 4],
        ],
    },
    backgroundFill: 'none',
    backgroundFillOpacity: 1,
    rotation: 0,
    scale: 1,
};

export const FILL_PATTERN_SINGLE_DEFAULTS: WithThemeParams<RequiredInternalAgPatternColor> = {
    ...FILL_PATTERN_DEFAULTS,
    stroke: {
        $if: [
            { $isGradient: { $palette: 'fill' } },
            { $path: ['/0', undefined, { $palette: 'fillsFallback' }] },
            {
                $if: [
                    { $isPattern: { $palette: 'fill' } },
                    {
                        $path: [
                            '/stroke',
                            { $path: ['/0', undefined, { $palette: 'fillsFallback' }] },
                            { $path: ['/0', undefined, { $palette: 'fills' }] },
                        ],
                    },
                    { $path: ['/0', undefined, { $palette: 'fills' }] },
                ],
            },
        ],
    },
    fill: {
        $if: [
            {
                $or: [{ $isGradient: { $palette: 'fill' } }, { $isImage: { $palette: 'fill' } }],
            },
            { $path: ['/0', undefined, { $palette: 'fillsFallback' }] },
            {
                $if: [
                    { $isPattern: { $palette: 'fill' } },
                    {
                        $path: [
                            '/fill',
                            { $path: ['/0', undefined, { $palette: 'fillsFallback' }] },
                            { $path: ['/0', undefined, { $palette: 'fills' }] },
                        ],
                    },
                    { $path: ['/0', undefined, { $palette: 'fills' }] },
                ],
            },
        ],
    },
};

export const FILL_PATTERN_BLANK_DEFAULTS: RequiredInternalAgPatternColor = {
    type: 'pattern',
    pattern: 'forward-slanted-lines',
    width: 8,
    height: 8,
    padding: 1,
    fill: 'black',
    fillOpacity: 1,
    backgroundFill: 'white',
    backgroundFillOpacity: 1,
    stroke: 'black',
    strokeOpacity: 1,
    strokeWidth: 1,
    rotation: 0,
    scale: 1,
};

export const FILL_PATTERN_HIERARCHY_DEFAULTS: WithThemeParams<RequiredInternalAgPatternColor> = {
    ...FILL_PATTERN_DEFAULTS,
    fill: { $path: ['/1', { $palette: 'fill' }, { $palette: 'hierarchyColors' }] },
    stroke: { $path: ['/1', { $palette: 'fill' }, { $palette: 'hierarchyColors' }] },
};

export const FILL_PATTERN_KEYED_DEFAULTS = (
    key: 'up' | 'down' | 'altUp' | 'altDown' | 'neutral'
): WithThemeParams<RequiredInternalAgPatternColor> => ({
    ...FILL_PATTERN_DEFAULTS,
    stroke: {
        $if: [
            { $isGradient: { $palette: `${key}.fill` } },
            { $palette: 'fillFallback' },
            {
                $if: [
                    { $isPattern: { $palette: `${key}.fill` } },
                    { $path: ['/stroke', { $palette: 'fillFallback' }, { $palette: `${key}.fill` }] },
                    { $palette: `${key}.fill` },
                ],
            },
        ],
    },
});

export const FILL_IMAGE_DEFAULTS: WithThemeParams<RequiredInternalAgImageFill> = {
    type: 'image',
    backgroundFill: { $palette: 'fillFallback' },
    backgroundFillOpacity: 1,
    repeat: 'no-repeat',
    fit: 'contain',
    rotation: 0,
};

export const FILL_IMAGE_BLANK_DEFAULTS: RequiredInternalAgImageFill = {
    type: 'image',
    backgroundFill: 'black',
    backgroundFillOpacity: 1,
    rotation: 0,
    repeat: 'no-repeat',
    fit: 'contain',
    width: 8,
    height: 8,
};

export function getSequentialColors(colors: { [key: string]: string }) {
    return mapValues(colors, (value) => {
        const color = Color.fromString(value);
        return [Color.darken(color, 0.15).toString(), value, Color.lighten(color, 0.15).toString()];
    });
}

type SeriesLabelPlacement = 'inside' | 'outside';

const SERIES_LABEL_PLACEMENT_PARAMS = {
    inside: { color: 'seriesLabelInsideTextColor', background: 'seriesLabelInsideBackgroundColor' },
    outside: { color: 'seriesLabelOutsideTextColor', background: 'seriesLabelOutsideBackgroundColor' },
} as const;

// A defined `fill` switches label boxing on, so a fully transparent background, such as the `'transparent'` default,
// must resolve to no fill at all.
const seriesLabelBackground = (placement: SeriesLabelPlacement) => {
    const param = SERIES_LABEL_PLACEMENT_PARAMS[placement].background;
    return { $if: [{ $isTransparent: { $ref: param } }, undefined, { $ref: param }] };
};

const labelBoxingFillDefaults = (placement?: SeriesLabelPlacement): WithThemeParams<LabelBoxOptions> => ({
    fill: {
        $if: [
            {
                $and: [
                    { $eq: [{ $path: './fill/type' }, 'image'] },
                    { $isUserOption: ['./fill/backgroundFill', false, true] },
                ],
            },
            { backgroundFill: 'transparent' },
            placement == null ? undefined : seriesLabelBackground(placement),
        ],
    },
});

// `false` keeps the subtle border shown when a series enables `label.border`; `true` and objects follow borderColor/borderWidth.
const seriesLabelBorderValue = (
    key: 'color' | 'width',
    base: 'borderColor' | 'borderWidth',
    offValue: Operation | number
): Operation => ({
    $isType: [
        { $ref: 'seriesLabelBorder' },
        'boolean',
        { $if: [{ $ref: 'seriesLabelBorder' }, { $ref: base }, offValue] },
        {
            $isType: [
                { $ref: `seriesLabelBorder.${key}` },
                'nullish',
                { $ref: base },
                { $ref: `seriesLabelBorder.${key}` },
            ],
        },
    ],
});

const LABEL_BOXING_BORDER_DEFAULTS: WithThemeParams<Pick<LabelBoxOptions, 'border'>> = {
    border: {
        enabled: {
            $or: [{ $isUserOption: '../border' }, { $not: { $eq: [{ $ref: 'seriesLabelBorder' }, false] } }],
        },
        strokeWidth: seriesLabelBorderValue('width', 'borderWidth', 1),
        stroke: seriesLabelBorderValue('color', 'borderColor', { $foregroundOpacity: 0.08 }),
    },
};

export const LABEL_BOXING_DEFAULTS: WithThemeParams<LabelBoxOptions> = {
    ...labelBoxingFillDefaults(),
    ...LABEL_BOXING_BORDER_DEFAULTS,
    padding: 8,
    cornerRadius: { $ref: 'seriesLabelBorderRadius' },
};

/**
 * Font weight for a series label whose default does not follow `fontWeight`. `seriesLabelFontWeight` applies only once it
 * differs from `fontWeight`, so the label keeps `fallback` until a theme sets the series label weight.
 */
export const seriesLabelFontWeightOr = (fallback: FontWeight | undefined): Operation => ({
    $if: [
        { $eq: [{ $ref: 'seriesLabelFontWeight' }, { $ref: 'fontWeight' }] },
        fallback,
        { $ref: 'seriesLabelFontWeight' },
    ],
});

/** `LABEL_BOXING_DEFAULTS` for a label that sits inside or outside its series shape, e.g. pie sector and callout labels. */
export const PLACED_LABEL_BOXING_DEFAULTS = (placement: SeriesLabelPlacement): WithThemeParams<LabelBoxOptions> => ({
    ...LABEL_BOXING_DEFAULTS,
    ...labelBoxingFillDefaults(placement),
});

/**
 * Top-level box defaults for placement-reactive labels. Box geometry (`cornerRadius`, `padding`,
 * fill and the border stroke geometry) lives here so a value set once at the top level applies to
 * both placements; `border.enabled` falls through to the placement blocks via
 * `LABEL_PLACEMENT_STYLE_DEFAULTS` (see there for the per-placement auto-enable precedence). The
 * placement blocks carry only user overrides plus conditional `color` and `fill` defaults (whose values
 * legitimately differ per inside/outside placement).
 */
export const LABEL_BOXING_TOP_LEVEL_DEFAULTS: WithThemeParams<LabelBoxOptions> = {
    ...labelBoxingFillDefaults(),
    ...LABEL_BOXING_BORDER_DEFAULTS,
    cornerRadius: { $ref: 'seriesLabelBorderRadius' },
};

/**
 * Per-placement `border.enabled` default, applying only where the placement styles no border of its
 * own — any other border property set on a placement auto-enables it, whatever the top level says.
 */
const LABEL_PLACEMENT_BORDER_DEFAULTS: WithThemeParams<Pick<LabelBoxOptions, 'border'>> = {
    border: { enabled: { $path: '../../border/enabled' } },
};

/**
 * A series' `insideStyle`/`outsideStyle` theme block: the per-placement border default plus `color` and
 * `fill` from the placement's theme params where the user set no `label.color` / `label.fill`, since
 * placement keys beat top-level label keys.
 */
export const LABEL_PLACEMENT_STYLE_DEFAULTS = (
    placement: SeriesLabelPlacement,
    colorRef: keyof AgChartAllThemeParams = SERIES_LABEL_PLACEMENT_PARAMS[placement].color
): WithThemeParams<AgChartLabelPlacementStyleOptions> => ({
    ...LABEL_PLACEMENT_BORDER_DEFAULTS,
    color: { $isUserOption: ['../color', { $path: '../color' }, { $ref: colorRef }] },
    fill: { $if: [{ $isUserOption: '../fill' }, undefined, seriesLabelBackground(placement)] },
});

/**
 * Setting any one of `maxWidth`, `maxHeight`, `wrapping`, `truncate`, `minimumFontSize` or an
 * array-valued `placement`/`orientation` opts the label into overflow management, so the unset ones
 * resolve to a coherent set rather than leaving the label to overflow untouched. These are theme
 * defaults, so an explicit user value on any of them still wins.
 *
 * `wrapping` and `truncate` trigger off each other by presence rather than by value; reading either
 * by value would form a dependency cycle.
 */
export const LABEL_OVERFLOW_DEFAULTS: WithThemeParams<AgChartLabelFitOptions> = {
    wrapping: {
        $if: [
            {
                $or: [
                    { $isUserOption: [['./maxWidth', './maxHeight', './truncate', './minimumFontSize']] },
                    { $isType: [{ $path: './placement' }, 'array'] },
                    { $isType: [{ $path: './orientation' }, 'array'] },
                ],
            },
            'on-space',
            undefined,
        ],
    },
    truncate: {
        $if: [
            {
                $or: [
                    { $isUserOption: [['./maxWidth', './maxHeight', './wrapping', './minimumFontSize']] },
                    { $isType: [{ $path: './placement' }, 'array'] },
                    { $isType: [{ $path: './orientation' }, 'array'] },
                ],
            },
            true,
            undefined,
        ],
    },
};

/** `truncate` for a label auto-sized to its container: on, unless the deprecated `overflowStrategy` says `'hide'`. */
export const AUTO_SIZED_LABEL_TRUNCATE: Operation = {
    $isUserOption: ['./overflowStrategy', { $eq: [{ $path: './overflowStrategy' }, 'ellipsis'] }, true],
};

/** Counterpart to {@link LABEL_OVERFLOW_DEFAULTS}, assigned to `label.collision.alwaysShow` one level deeper. */
export const LABEL_OVERFLOW_ALWAYS_SHOW: Operation = {
    $if: [
        {
            $or: [
                {
                    $isUserOption: [
                        ['../maxWidth', '../maxHeight', '../wrapping', '../truncate', '../minimumFontSize'],
                    ],
                },
                { $isType: [{ $path: '../placement' }, 'array'] },
                { $isType: [{ $path: '../orientation' }, 'array'] },
            ],
        },
        false,
        true,
    ],
};

/** `label.collision` for bar-like series, whose labels must also avoid other series' bars. */
export const BAR_LABEL_COLLISION_THEME = {
    threshold: 4,
    alwaysShow: LABEL_OVERFLOW_ALWAYS_SHOW,
    ...undocumentedThemeOptions({ collideWith: { seriesItems: true } }),
};

export const MULTI_SERIES_HIGHLIGHT_STYLE: WithThemeParams<AgMultiSeriesHighlightOptions<AgHighlightStyleOptions>> = {
    enabled: { $circular: { $path: '/highlight/enabled' } },
    unhighlightedItem: {
        opacity: 0.6,
    },
    unhighlightedSeries: {
        opacity: 0.2,
    },
};

export const MARKER_SERIES_HIGHLIGHT_STYLE: WithThemeParams<AgMultiSeriesHighlightOptions<AgHighlightStyleOptions>> = {
    enabled: { $circular: { $path: '/highlight/enabled' } },
    unhighlightedSeries: {
        opacity: 0.2,
    },
};

export const PART_WHOLE_HIGHLIGHT_STYLE: WithThemeParams<AgMultiSeriesHighlightOptions<AgHighlightStyleOptions>> = {
    enabled: { $circular: { $path: '/highlight/enabled' } },
    unhighlightedItem: {
        opacity: 0.2,
    },
    unhighlightedSeries: {
        opacity: 0.2,
    },
};

export const SINGLE_SERIES_HIGHLIGHT_STYLE: WithThemeParams<AgHighlightOptions<AgHighlightStyleOptions>> = {
    enabled: { $circular: { $path: '/highlight/enabled' } },
    unhighlightedItem: {
        opacity: 0.2,
    },
};

/** Interaction defaults for series whose public options omit `showInLegend`. */
export const SERIES_INTERACTION_THEME_DEFAULTS = { cursor: 'default', nodeClickRange: 'exact' } as const;

/** Solid, fully opaque stroke; the theme value every stroked element starts from. */
export const STROKE_STYLE_THEME_DEFAULTS = { strokeOpacity: 1, lineDash: [0], lineDashOffset: 0 };

/** Font size, family and weight taken from the theme params; most text theme blocks spread this. */
export const FONT_THEME_DEFAULTS = {
    fontSize: { $ref: 'fontSize' },
    fontFamily: { $ref: 'fontFamily' },
    fontWeight: { $ref: 'fontWeight' },
} as const;

/** Disabled drop shadow; the theme value every series and marker `shadow` starts from. */
export const SHADOW_THEME_DEFAULTS = { enabled: false, color: '#00000080', xOffset: 3, yOffset: 3, blur: 5 };

type SeriesTooltipTheme = WithThemeParams<Pick<AgSeriesTooltip<never>, 'range' | 'position' | 'interaction'>>;

/** Series tooltip defaults, following the chart `tooltip` range and position. */
export const SERIES_TOOLTIP_THEME: SeriesTooltipTheme = {
    range: {
        $if: [
            { $eq: [{ $path: ['/tooltip/range', 'exact'] }, 'area'] },
            'exact',
            { $path: ['/tooltip/range', 'exact'] },
        ],
    },
    position: {
        anchorTo: { $path: ['/tooltip/position/anchorTo', 'pointer'] },
        placement: { $path: ['/tooltip/position/placement', undefined] },
        xOffset: { $path: ['/tooltip/position/xOffset', 0] },
        yOffset: { $path: ['/tooltip/position/yOffset', 0] },
        // Chart-anchored tooltips sit flush; pointer/node use a 12px gap.
        offset: {
            $path: ['/tooltip/position/offset', { $if: [{ $eq: [{ $path: './anchorTo' }, 'chart'] }, 0, 12] }],
        },
    },
    interaction: { enabled: false },
};

/** Tooltip defaults for series that pick the nearest datum unless the chart sets `tooltip.range`. */
export const NEAREST_TOOLTIP_THEME: SeriesTooltipTheme = {
    ...SERIES_TOOLTIP_THEME,
    range: { $path: ['/tooltip/range', 'nearest'] },
};

/** Tooltip defaults for marker series: the nearest datum, even for an `area` chart range, anchored to its node. */
export const NEAREST_NODE_TOOLTIP_THEME: SeriesTooltipTheme = {
    ...SERIES_TOOLTIP_THEME,
    range: {
        $if: [
            { $eq: [{ $path: ['/tooltip/range', 'nearest'] }, 'area'] },
            'nearest',
            { $path: ['/tooltip/range', 'nearest'] },
        ],
    },
    position: {
        ...SERIES_TOOLTIP_THEME.position,
        anchorTo: { $path: ['/tooltip/position/anchorTo', 'node'] },
    },
};

/** A `fill` switched on its `type`: solid `defaultFill`, or `gradient`, image or pattern defaults. */
export function fillThemeTemplate(gradient: unknown, defaultFill: unknown = { $palette: 'fill' }) {
    return {
        $applySwitch: [
            { $path: 'type' },
            defaultFill,
            ['gradient', gradient],
            ['image', FILL_IMAGE_DEFAULTS],
            ['pattern', FILL_PATTERN_DEFAULTS],
        ],
    };
}

/** Per-item {@link fillThemeTemplate} for an `$applyCycle` over palette `fills`, where `$1` is the cycled colour. */
export function cycledFillThemeTemplate(gradient: unknown, pattern: unknown = FILL_PATTERN_DEFAULTS) {
    return {
        $applySwitch: [
            { $path: ['/type', undefined, { $value: '$1' }] },
            { $value: '$1' },
            ['gradient', gradient],
            ['pattern', pattern],
            ['image', FILL_IMAGE_DEFAULTS],
        ],
    };
}

/** Series-level defaults every migrated series module spreads into its `themeTemplate.series`. */
export const COMMON_SERIES_THEME_DEFAULTS = { ...SERIES_INTERACTION_THEME_DEFAULTS, showInLegend: true } as const;

/** Per-type interpolation defaults keyed off the resolved `type`; `defaultType` may itself be an operation. */
export function interpolationThemeTemplate(defaultType: unknown = 'linear') {
    return {
        $applySwitch: [
            { $path: ['type', defaultType] },
            {},
            ['linear', { type: 'linear' }],
            ['smooth', { type: 'smooth', tension: 1 }],
            ['step', { type: 'step', position: 'end' }],
        ],
    };
}

export const SERIES_SELECTION_THEME: WithThemeParams<AgSelectionOptions<AgSelectionStyleOptions>> = {
    enabled: { $path: ['/selection/enabled', false] },
    containment: { $path: ['/selection/containment', 'any'] },
    selectedItem: {
        strokeWidth: 2,
    },
    unselectedItem: {
        opacity: 0.6,
    },
    unselectedSeries: {
        opacity: 0.2,
    },
};

export const LEGEND_CONTAINER_THEME: any = {
    border: {
        enabled: { $isType: [{ $ref: 'legendBorder' }, 'boolean', { $ref: 'legendBorder' }, true] },
        // `legendBorder: false` keeps the legend's own stroke for a border enabled through the legend options.
        stroke: {
            $isType: [
                { $ref: 'legendBorder' },
                'boolean',
                { $if: [{ $ref: 'legendBorder' }, { $ref: 'borderColor' }, { $foregroundBackgroundMix: 0.25 }] },
                { $if: [{ $ref: 'legendBorder.color' }, { $ref: 'legendBorder.color' }, { $ref: 'borderColor' }] },
            ],
        },
        strokeOpacity: 1,
        strokeWidth: {
            $isType: [
                { $ref: 'legendBorder' },
                'boolean',
                { $if: [{ $ref: 'legendBorder' }, { $ref: 'borderWidth' }, 1] },
                {
                    $isType: [
                        { $ref: 'legendBorder.width' },
                        'number',
                        { $ref: 'legendBorder.width' },
                        { $ref: 'borderWidth' },
                    ],
                },
            ],
        },
    },
    cornerRadius: { $ref: 'legendBorderRadius' },
    fillOpacity: 1,
    padding: {
        $if: [
            {
                $or: [{ $eq: [{ $path: './border/enabled' }, true] }, { $isUserOption: ['./fill', true, false] }],
            },
            { $ref: 'legendPadding' },
            0,
        ],
    },
};

export const SEGMENTATION_DEFAULTS: WithThemeParams<AgSeriesSegmentation> = {
    enabled: false,
    key: 'x',
    segments: {
        $apply: {
            fill: fillThemeTemplate(FILL_GRADIENT_LINEAR_DEFAULTS, { $path: '../../../fill' }),
            stroke: { $path: '../../../stroke' },
            fillOpacity: { $path: '../../../fillOpacity' },
            strokeWidth: {
                $isUserOption: [
                    './stroke',
                    {
                        $isUserOption: [
                            '../../../strokeWidth',
                            { $path: '../../../strokeWidth' },
                            {
                                $if: [
                                    { $greaterThan: [{ $path: '../../../strokeWidth' }, 0] },
                                    { $path: '../../../strokeWidth' },
                                    2,
                                ],
                            },
                        ],
                    },
                    { $path: '../../../strokeWidth' },
                ],
            },
            strokeOpacity: { $path: '../../../strokeOpacity' },
            lineDash: { $path: '../../../lineDash' },
            lineDashOffset: { $path: '../../../lineDashOffset' },
        },
    },
};
