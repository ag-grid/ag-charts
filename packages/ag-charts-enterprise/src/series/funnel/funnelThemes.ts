import {
    CARTESIAN_AXIS_TYPE,
    CARTESIAN_POSITION,
    FILL_GRADIENT_LINEAR_SINGLE_DEFAULTS,
    FILL_PATTERN_SINGLE_DEFAULTS,
    FONT_THEME_DEFAULTS,
    LABEL_BOXING_TOP_LEVEL_DEFAULTS,
    LABEL_OVERFLOW_ALWAYS_SHOW,
    LABEL_OVERFLOW_DEFAULTS,
    LABEL_PLACEMENT_STYLE_DEFAULTS,
    SERIES_INTERACTION_THEME_DEFAULTS,
    SHADOW_THEME_DEFAULTS,
    STROKE_STYLE_THEME_DEFAULTS,
    cycledFillThemeTemplate,
    undocumentedThemeOptions,
} from 'ag-charts-core';
import type { ExtensibleSeriesTheme } from 'ag-charts-types';

const isHorizontal = { $eq: [{ $path: ['/series/0/direction', undefined] }, 'horizontal'] };
const isRtl = { $eq: [{ $path: ['/enableRtl', false] }, true] };
const isPlacementAfter = { $eq: [{ $path: ['/series/0/stageLabel/placement', undefined] }, 'after'] };
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
                // `before`/`after` are reading-order sides, so RTL mirrors them.
                {
                    $if: [
                        isPlacementAfter,
                        { $if: [isRtl, CARTESIAN_POSITION.LEFT, CARTESIAN_POSITION.RIGHT] },
                        { $if: [isRtl, CARTESIAN_POSITION.RIGHT, CARTESIAN_POSITION.LEFT] },
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

export const FUNNEL_SERIES_THEME: ExtensibleSeriesTheme<'funnel'> = {
    series: {
        ...SERIES_INTERACTION_THEME_DEFAULTS,
        direction: 'vertical',
        strokeWidth: { $isUserOption: ['./strokes/0', 2, 0] },
        fillOpacity: 1,
        ...STROKE_STYLE_THEME_DEFAULTS,
        cornerRadius: 0,
        spacingRatio: 0.25,
        fills: {
            $applyCycle: [
                { $size: { $path: ['./data', { $path: '/data' }] } },
                [{ $path: ['/0', undefined, { $palette: 'fills' }] }],
                cycledFillThemeTemplate(FILL_GRADIENT_LINEAR_SINGLE_DEFAULTS, FILL_PATTERN_SINGLE_DEFAULTS),
            ],
        },
        strokes: {
            $applyCycle: [
                { $size: { $path: ['./data', { $path: '/data' }] } },
                [{ $path: ['/0', undefined, { $palette: 'strokes' }] }],
            ],
        },
        label: {
            ...LABEL_BOXING_TOP_LEVEL_DEFAULTS,
            ...LABEL_OVERFLOW_DEFAULTS,
            enabled: true,
            ...FONT_THEME_DEFAULTS,
            padding: 8,
            spacing: 8,
            collision: {
                threshold: 4,
                alwaysShow: LABEL_OVERFLOW_ALWAYS_SHOW,
                // A value label must avoid the neighbouring stages; its own stage is excluded separately.
                ...undocumentedThemeOptions({ collideWith: { seriesItems: true } }),
            },
            insideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('chartBackgroundColor'),
            outsideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('textColor'),
            placement: 'inside-center',
        },
        dropOff: {
            enabled: true,
            fillOpacity: 0.2,
            strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
            ...STROKE_STYLE_THEME_DEFAULTS,
        },
        tooltip: { interaction: { enabled: false } },
        shadow: SHADOW_THEME_DEFAULTS,
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
