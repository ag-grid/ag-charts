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
    AgSeriesSegmentation,
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
    } as any,
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

export function multiSeriesHighlightStyle(): WithThemeParams<AgMultiSeriesHighlightOptions<AgHighlightStyleOptions>> {
    return {
        enabled: true,
        unhighlightedItem: {
            opacity: 0.6,
        },
        unhighlightedSeries: {
            opacity: 0.2,
        },
    };
}

export function markerSeriesHighlightStyle(): WithThemeParams<AgMultiSeriesHighlightOptions<AgHighlightStyleOptions>> {
    return {
        enabled: true,
        unhighlightedSeries: {
            opacity: 0.2,
        },
    };
}

export function partWholeHighlightStyle(): WithThemeParams<AgMultiSeriesHighlightOptions<AgHighlightStyleOptions>> {
    return {
        enabled: true,
        unhighlightedItem: {
            opacity: 0.2,
        },
        unhighlightedSeries: {
            opacity: 0.2,
        },
    };
}

export function singleSeriesHighlightStyle(): WithThemeParams<AgHighlightOptions<AgHighlightStyleOptions>> {
    return {
        enabled: true,
        unhighlightedItem: {
            opacity: 0.2,
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

export const SEGMENTATION_DEFAULTS: WithThemeParams<AgSeriesSegmentation> = {
    enabled: false,
    key: 'x',
    segments: {
        $apply: [
            {
                fill: {
                    $applySwitch: [
                        { $path: 'type' },
                        { $path: '../../../fill' },
                        ['gradient', FILL_GRADIENT_LINEAR_DEFAULTS],
                        ['image', FILL_IMAGE_DEFAULTS],
                        ['pattern', FILL_PATTERN_DEFAULTS],
                    ],
                },
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
        ],
    },
};
