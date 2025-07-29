import type {
    RequiredInternalAgGradientColor,
    RequiredInternalAgImageFill,
    RequiredInternalAgPatternColor,
} from 'ag-charts-core';
import type {
    AgCartesianChartOptions,
    AgHighlightOptions,
    AgHighlightStyleOptions,
    AgMultiSeriesHighlightOptions,
    LabelBoxOptions,
    WithThemeParams,
} from 'ag-charts-types';

import { Color } from '../../util/color';
import { mapValues } from '../../util/object';
import { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } from './constants';

type CartesianAxis = Exclude<AgCartesianChartOptions['axes'], undefined>[0];

export const DIRECTION_SWAP_AXES: WithThemeParams<[CartesianAxis, CartesianAxis]> = [
    {
        type: CARTESIAN_AXIS_TYPE.NUMBER,
        position: {
            $if: [
                { $eq: [{ $path: ['/series/0/direction', undefined] }, 'horizontal'] },
                CARTESIAN_POSITION.BOTTOM,
                CARTESIAN_POSITION.LEFT,
            ],
        },
    },
    {
        type: CARTESIAN_AXIS_TYPE.CATEGORY,
        position: {
            $if: [
                { $eq: [{ $path: ['/series/0/direction', undefined] }, 'horizontal'] },
                CARTESIAN_POSITION.LEFT,
                CARTESIAN_POSITION.BOTTOM,
            ],
        },
    },
];

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

export const FILL_GRADIENT_LINEAR_DEFAULTS: WithThemeParams<RequiredInternalAgGradientColor> = {
    type: 'gradient',
    gradient: 'linear',
    bounds: 'item',
    colorStops: { $palette: 'gradient' },
    rotation: 0,
    reverse: false,
};

export const FILL_GRADIENT_LINEAR_HIERARCHY_DEFAULTS: WithThemeParams<RequiredInternalAgGradientColor> = {
    ...FILL_GRADIENT_LINEAR_DEFAULTS,
    colorStops: [
        {
            $mix: [{ $path: ['/1', { $palette: 'fill' }, { $palette: 'hierarchyColors' }] }, 'black', 0.15],
        },
        {
            $mix: [{ $path: ['/1', { $palette: 'fill' }, { $palette: 'hierarchyColors' }] }, 'white', 0.15],
        },
    ] as any,
};

export const FILL_GRADIENT_LINEAR_SHADED_DEFAULTS = (
    key: string
): WithThemeParams<RequiredInternalAgGradientColor> => ({
    ...FILL_GRADIENT_LINEAR_DEFAULTS,
    colorStops: {
        $if: [
            {
                $or: [
                    { $isGradient: { $palette: `${key}.fill` } },
                    { $isPattern: { $palette: `${key}.fill` } },
                    { $isImage: { $palette: `${key}.fill` } },
                ],
            },
            {
                $map: [
                    { $path: ['/color', undefined, { $value: '$1' }] },
                    {
                        $path: ['/colorStops', undefined, { $palette: `${key}.fill` }],
                    },
                ],
            },
            [
                { $mix: [{ $palette: `${key}.fill` }, 'black', 0.15] },
                { $mix: [{ $palette: `${key}.fill` }, 'white', 0.15] },
            ],
        ],
    } as any,
});

export const FILL_GRADIENT_RADIAL_DEFAULTS: WithThemeParams<RequiredInternalAgGradientColor> = {
    type: 'gradient',
    gradient: 'radial',
    bounds: 'item',
    colorStops: { $palette: 'gradient' },
    rotation: 0,
    reverse: false,
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

export const FILL_GRADIENT_CONIC_DEFAULTS: WithThemeParams<RequiredInternalAgGradientColor> = {
    type: 'gradient',
    gradient: 'conic',
    bounds: 'series',
    colorStops: { $palette: 'gradient' },
    rotation: 0,
    reverse: false,
};

export const FILL_PATTERN_DEFAULTS: WithThemeParams<RequiredInternalAgPatternColor> = {
    type: 'pattern',
    pattern: 'forward-slanted-lines',
    width: 10,
    height: 10,
    padding: 2,
    fill: {
        $if: [
            { $or: [{ $isGradient: { $palette: 'fill' } }, { $isImage: { $palette: 'fill' } }] },
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
    strokeWidth: 4,
    backgroundFill: 'none',
    backgroundFillOpacity: 1,
    rotation: 0,
    scale: 1,
};

export const FILL_PATTERN_HIERARCHY_DEFAULTS = {
    ...FILL_PATTERN_DEFAULTS,
    fill: { $path: ['/1', { $palette: 'fill' }, { $palette: 'hierarchyColors' }] },
    stroke: { $path: ['/1', { $palette: 'fill' }, { $palette: 'hierarchyColors' }] },
};

export const FILL_IMAGE_DEFAULTS: WithThemeParams<RequiredInternalAgImageFill> = {
    type: 'image',
    backgroundFill: { $palette: 'fillFallback' },
    backgroundFillOpacity: 1,
    repeat: 'no-repeat',
    fit: 'contain',
    rotation: 0,
};

export function getSequentialColors(colors: { [key: string]: string }) {
    return mapValues(colors, (value) => {
        const color = Color.fromString(value);
        return [Color.darken(color, 0.15).toString(), value, Color.lighten(color, 0.15).toString()];
    });
}

const ITEM_HIGHLIGHT_BASE_STYLE: WithThemeParams<AgHighlightStyleOptions> = {
    stroke: { $path: ['../../highlightStyle/item/stroke', `rgba(0, 0, 0, 0.4)`] },
    strokeWidth: { $path: ['../../highlightStyle/item/strokeWidth', 2] },
    strokeOpacity: { $path: ['../../highlightStyle/item/strokeOpacity', undefined] },
    opacity: { $path: ['../../highlightStyle/item/opacity', 1] },
};

const ITEM_HIGHLIGHT_STYLE: WithThemeParams<AgHighlightStyleOptions> = {
    ...ITEM_HIGHLIGHT_BASE_STYLE,
    fill: { $path: ['../../highlightStyle/item/fill', `rgba(255,255,255, 0.33)`] },
    fillOpacity: { $path: ['../../highlightStyle/item/fillOpacity', undefined] },
};

export const LABEL_BOXING_DEFAULTS: WithThemeParams<LabelBoxOptions> = {
    padding: 8,
    cornerRadius: 4,
    fill: {
        $if: [
            {
                $and: [
                    { $eq: [{ $path: './fill/type' }, 'image'] },
                    { $isUserOption: ['./fill/backgroundFill', false, true] },
                ],
            },
            { backgroundFill: 'transparent' } as any,
            undefined,
        ],
    },
    border: {
        enabled: { $isUserOption: ['../border', true, false] },
        strokeWidth: 1,
        stroke: { $foregroundOpacity: 0.08 },
    },
};

export function multiSeriesHighlightStyle(
    hasFill: boolean = true
): WithThemeParams<AgMultiSeriesHighlightOptions<AgHighlightStyleOptions>> {
    return {
        enabled: true,
        highlightedItem: hasFill ? ITEM_HIGHLIGHT_STYLE : ITEM_HIGHLIGHT_BASE_STYLE,
        unhighlightedItem: {
            strokeWidth: { $path: ['../../highlightStyle/series/strokeWidth', undefined] },
        },
        highlightedSeries: {
            strokeWidth: { $path: ['../../highlightStyle/series/strokeWidth', undefined] },
        },
        unhighlightedSeries: {
            opacity: { $path: ['../../highlightStyle/series/dimOpacity', undefined] },
        },
    };
}

export function singleSeriesHighlightStyle(
    hasFill: boolean = true
): WithThemeParams<AgHighlightOptions<AgHighlightStyleOptions>> {
    return {
        enabled: true,
        highlightedItem: hasFill ? ITEM_HIGHLIGHT_STYLE : ITEM_HIGHLIGHT_BASE_STYLE,
        unhighlightedItem: {
            strokeWidth: { $path: ['../../highlightStyle/series/strokeWidth', undefined] },
            opacity: { $path: ['../../highlightStyle/series/dimOpacity', undefined] },
        },
    };
}

export const LEGEND_CONTAINER_THEME: any = {
    border: {
        enabled: false,
        stroke: { $foregroundBackgroundMix: 0.25 },
        strokeOpacity: 1,
        strokeWidth: 1,
    },
    cornerRadius: 4,
    fillOpacity: 1,
    padding: {
        $if: [{ $eq: [{ $path: './border/enabled' }, true] }, 5, { $isUserOption: ['./fill', 5, 0] }],
    },
};
