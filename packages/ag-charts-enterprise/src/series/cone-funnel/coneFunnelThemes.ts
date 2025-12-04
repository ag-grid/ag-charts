import { _ModuleSupport } from 'ag-charts-community';
import { CARTESIAN_AXIS_TYPE } from 'ag-charts-core';
import type { ExtensibleTheme } from 'ag-charts-types';

export const CONE_FUNNEL_SERIES_THEME: ExtensibleTheme<'cone-funnel'> = {
    series: {
        direction: 'vertical',
        fills: {
            $applyCycle: [
                { $size: { $path: ['./data', { $path: '/data' }] } },
                {
                    $if: [
                        { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                        { $palette: 'secondSequentialColors' },
                        _ModuleSupport.SAFE_RANGE2_OPERATION,
                    ],
                },
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
        },
        strokes: {
            $applyCycle: [
                { $size: { $path: ['./data', { $path: '/data' }] } },
                {
                    $if: [
                        { $eq: [{ $palette: 'type' }, 'inbuilt'] },
                        { $palette: 'secondSequentialColors' },
                        _ModuleSupport.SAFE_RANGE2_OPERATION,
                    ],
                },
            ],
        },
        strokeWidth: { $isUserOption: ['./strokes/0', 2, 0] },
        label: {
            ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
            placement: 'before',
            spacing: 4,
        },
        tooltip: {
            range: { $path: ['/tooltip/range', 'nearest'] },
        },
        highlight: {
            highlightedItem: {
                stroke: `rgba(0, 0, 0, 0.4)`,
                strokeWidth: 2,
            },
        },
    },
    seriesArea: {
        padding: {
            top: 20,
            bottom: 20,
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
