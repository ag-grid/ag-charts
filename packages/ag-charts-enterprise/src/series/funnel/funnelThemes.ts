import {
    CARTESIAN_AXIS_TYPE,
    CARTESIAN_POSITION,
    DEFAULT_SHADOW_COLOUR,
    FILL_GRADIENT_LINEAR_SINGLE_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_SINGLE_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
} from 'ag-charts-core';
import type { ExtensibleTheme } from 'ag-charts-types';

const isHorizontal = { $eq: [{ $path: ['/series/0/direction', undefined] }, 'horizontal'] };
const labelOptions = { $clone: { $omit: [['placement', 'spacing'], { $path: '/series/0/stageLabel' }] } };

export const FUNNEL_SERIES_AXES: any = {
    y: {
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
    x: {
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
};

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
                        ['gradient', FILL_GRADIENT_LINEAR_SINGLE_DEFAULTS],
                        ['pattern', FILL_PATTERN_SINGLE_DEFAULTS],
                        ['image', FILL_IMAGE_DEFAULTS],
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
            ...LABEL_BOXING_DEFAULTS,
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
            enabled: { $path: ['/highlight/enabled', true] },
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
