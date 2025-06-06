import { type WithThemeParams, _ModuleSupport } from 'ag-charts-community';
import type { RequiredInternalAgGradientColor } from 'ag-charts-core';

const {
    ThemeConstants: { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION },
    ThemeSymbols: { DEFAULT_SHADOW_COLOUR },
} = _ModuleSupport;

const isHorizontal = { $eq: [{ $path: ['/series/0/direction', undefined] }, 'horizontal'] };

// TODO: Fix OptionsGraph to allow `label: { $path: ['/series/0/stageLabel' ]}` to merge with the defaults correctly.
// Perhaps a type of `$apply` operator.
const labelOptions = {
    autoRotate: { $path: '/series/0/stageLabel/autoRotate' },
    autoRotateAngle: { $path: '/series/0/stageLabel/autoRotateAngle' },
    avoidCollisions: { $path: ['/series/0/stageLabel/avoidCollisions', true] },
    color: { $path: ['/series/0/stageLabel/color', { $ref: 'textColor' }] },
    enabled: {
        $if: [
            { $eq: [{ $path: '/series/0/stageLabel/enabled' }, undefined] },
            true,
            { $path: '/series/0/stageLabel/enabled' },
        ],
    },
    fontSize: { $path: ['/series/0/stageLabel/fontSize', { $ref: 'fontSize' }] },
    fontStyle: { $path: ['/series/0/stageLabel/fontStyle', { $ref: 'fontStyle' }] },
    fontWeight: { $path: ['/series/0/stageLabel/fontWeight', { $ref: 'fontWeight' }] },
    format: { $path: '/series/0/stageLabel/format' },
    formatter: { $path: '/series/0/stageLabel/formatter' },
    itemStyler: { $path: '/series/0/stageLabel/itemStyler' },
    minSpacing: { $path: '/series/0/stageLabel/minSpacing' },
    rotation: { $path: ['/series/0/stageLabel/rotation', 0] },
};

export const FUNNEL_SERIES_AXES: any = [
    {
        type: {
            $if: [isHorizontal, CARTESIAN_AXIS_TYPE.NUMBER, CARTESIAN_AXIS_TYPE.CATEGORY],
        },
        position: {
            $if: [
                isHorizontal,
                CARTESIAN_POSITION.LEFT,
                {
                    $if: [
                        { $eq: [{ $path: ['/series/0/stageLabel/placement', undefined] }, 'after'] },
                        CARTESIAN_POSITION.RIGHT,
                        CARTESIAN_POSITION.LEFT,
                    ],
                },
            ],
        },
        label: {
            $if: [isHorizontal, undefined, labelOptions],
        },
    },
    {
        type: {
            $if: [isHorizontal, CARTESIAN_AXIS_TYPE.CATEGORY, CARTESIAN_AXIS_TYPE.NUMBER],
        },
        position: {
            $if: [
                isHorizontal,
                {
                    $if: [
                        { $eq: [{ $path: ['/series/0/stageLabel/placement', undefined] }, 'before'] },
                        CARTESIAN_POSITION.TOP,
                        CARTESIAN_POSITION.BOTTOM,
                    ],
                },
                CARTESIAN_POSITION.BOTTOM,
            ],
        },
        label: {
            $if: [isHorizontal, labelOptions, undefined],
        },
    },
];

export const FUNNEL_SERIES_THEME: _ModuleSupport.SeriesModule<'funnel'>['themeTemplate'] = {
    series: {
        direction: 'vertical',
        strokeWidth: 0,
        spacingRatio: 0.25,
        fills: [{ $palette: 'fill' }],
        strokes: [{ $palette: 'stroke' }],
        // @ts-expect-error undocumented option
        fillGradientDefaults: {
            type: 'gradient',
            gradient: 'linear',
            bounds: 'item',
            colorStops: { $palette: 'gradient' },
            rotation: 0,
            reverse: false,
        } satisfies WithThemeParams<RequiredInternalAgGradientColor>,
        fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
        fillImageDefaults: _ModuleSupport.FILL_IMAGE_DEFAULTS,
        label: {
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'backgroundColor' },
        },
        dropOff: {
            enabled: true,
            fillOpacity: 0.2,
            strokeWidth: 0,
        },
        shadow: {
            enabled: false,
            color: DEFAULT_SHADOW_COLOUR,
            xOffset: 3,
            yOffset: 3,
            blur: 5,
        },
    },
    axes: {
        [CARTESIAN_AXIS_TYPE.NUMBER]: {
            nice: false,
            gridLine: {
                enabled: false,
            },
            crosshair: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
        },
        [CARTESIAN_AXIS_TYPE.CATEGORY]: {
            line: {
                enabled: false,
            },
        },
    },
};
