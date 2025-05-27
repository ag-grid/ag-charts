import type { RequiredInternalAgImageFill, RequiredInternalAgPatternColor } from 'ag-charts-core';
import type { AgCartesianChartOptions, WithThemeParams } from 'ag-charts-types';

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
                { $isGradient: [{ $palette: 'fill' }] },
                { $isPattern: [{ $palette: 'fill' }] },
                { $isImage: [{ $value: '$1' }] },
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
                { $isGradient: [{ $palette: 'fill' }] },
                { $isPattern: [{ $palette: 'fill' }] },
                { $isImage: [{ $value: '$1' }] },
            ],
        },
        { $palette: 'fillsFallback' },
        { $palette: 'fills' },
    ],
};

export const SAFE_STROKE_FILL_OPERATION: any = {
    $if: [
        { $isGradient: [{ $palette: 'fill' }] },
        { $palette: 'fillFallback' },
        {
            $if: [
                { $isPattern: [{ $palette: 'fill' }] },
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
                { $isGradient: [{ $palette: 'fill' }] },
                { $isPattern: [{ $palette: 'fill' }] },
                { $isImage: [{ $value: '$1' }] },
            ],
        },
        [{ $palette: 'fillFallback' }, { $palette: 'fillFallback' }],
        { $palette: 'range2' },
    ],
};

export const FILL_PATTERN_DEFAULTS: WithThemeParams<RequiredInternalAgPatternColor> = {
    type: 'pattern',
    pattern: 'forward-slanted-lines',
    width: 10,
    height: 10,
    padding: 2,
    fill: {
        $if: [
            { $or: [{ $isGradient: [{ $palette: 'fill' }] }, { $isImage: [{ $palette: 'fill' }] }] },
            { $palette: 'fillFallback' },
            {
                $if: [
                    { $isPattern: [{ $palette: 'fill' }] },
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
