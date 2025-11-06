import { _ModuleSupport } from 'ag-charts-community';
import type { ExtensibleTheme } from 'ag-charts-types';

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
    border: { $path: ['/series/0/stageLabel/border'] },
    color: { $path: ['/series/0/stageLabel/color', { $ref: 'textColor' }] },
    cornerRadius: { $path: ['/series/0/stageLabel/cornerRadius'] },
    enabled: {
        $if: [
            { $eq: [{ $path: '/series/0/stageLabel/enabled' }, undefined] },
            true,
            { $path: '/series/0/stageLabel/enabled' },
        ],
    },
    fill: { $path: ['/series/0/stageLabel/fill'] },
    fillOpacity: { $path: ['/series/0/stageLabel/fillOpacity'] },
    fontSize: { $path: ['/series/0/stageLabel/fontSize', { $ref: 'fontSize' }] },
    fontStyle: { $path: ['/series/0/stageLabel/fontStyle', { $ref: 'fontStyle' }] },
    fontWeight: { $path: ['/series/0/stageLabel/fontWeight', { $ref: 'fontWeight' }] },
    format: { $path: '/series/0/stageLabel/format' },
    formatter: { $path: '/series/0/stageLabel/formatter' },
    itemStyler: { $path: '/series/0/stageLabel/itemStyler' },
    minSpacing: { $path: '/series/0/stageLabel/minSpacing' },
    padding: { $path: ['/series/0/stageLabel/padding'] },
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

export const FUNNEL_SERIES_THEME: ExtensibleTheme<'funnel'> = {
    series: {
        direction: 'vertical',
        strokeWidth: { $isUserOption: ['./strokes/0', 2, 0] },
        spacingRatio: 0.25,
        fills: {
            $applyCycle: [
                { $size: { $path: ['./data', { $path: '/data' }] } },
                [{ $path: ['/0', undefined, { $palette: 'fills' }] }],
                {
                    $applySwitch: [
                        { $path: ['/type', undefined, { $value: '$1' }] },
                        { $value: '$1' },
                        ['gradient', _ModuleSupport.FILL_GRADIENT_LINEAR_SINGLE_DEFAULTS],
                        ['pattern', _ModuleSupport.FILL_PATTERN_SINGLE_DEFAULTS],
                        ['image', _ModuleSupport.FILL_IMAGE_DEFAULTS],
                    ],
                },
            ],
        } as any,
        strokes: {
            $applyCycle: [
                { $size: { $path: ['./data', { $path: '/data' }] } },
                [{ $path: ['/0', undefined, { $palette: 'strokes' }] }],
            ],
        } as any,
        label: {
            ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'chartBackgroundColor' },
        },
        dropOff: {
            enabled: true,
            fillOpacity: 0.2,
            strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
        },
        shadow: {
            enabled: false,
            color: DEFAULT_SHADOW_COLOUR,
            xOffset: 3,
            yOffset: 3,
            blur: 5,
        },
        highlight: {
            unhighlightedItem: {
                opacity: 0.6,
            },
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
