import type { ExtensibleTheme } from '../../../module/coreModules';
import { FONT_SIZE_RATIO } from '../../themes/constants';
import { DEFAULT_SHADOW_COLOUR } from '../../themes/symbols';
import { SAFE_FILLS_OPERATION, singleSeriesHighlightStyle } from '../../themes/util';

export const donutTheme: ExtensibleTheme<'donut'> = {
    series: {
        title: {
            enabled: true,
            fontWeight: { $ref: 'fontWeight' },
            fontSize: { $rem: [FONT_SIZE_RATIO.LARGE] },
            fontFamily: { $ref: 'fontFamily' },
            color: { $ref: 'subtleTextColor' },
            spacing: 5,
        },
        calloutLabel: {
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
            offset: 3,
            minAngle: 0.001,
        },
        sectorLabel: {
            enabled: true,
            fontWeight: { $ref: 'fontWeight' },
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            color: { $ref: 'chartBackgroundColor' },
            positionOffset: 0,
            positionRatio: 0.5,
        },
        calloutLine: {
            length: 10,
            strokeWidth: 2,
            colors: {
                $map: [
                    {
                        $if: [
                            {
                                $or: [
                                    { $isGradient: [{ $value: '$1' }] },
                                    { $isPattern: [{ $value: '$1' }] },
                                    { $isImage: [{ $value: '$1' }] },
                                ],
                            },
                            { $path: ['../../strokes/$index', { $ref: 'foregroundColor' }] },
                            { $value: '$1' },
                        ],
                    },
                    {
                        $if: [
                            { $eq: [{ $path: '../strokeWidth' }, 0] },
                            { $path: '../fills' },
                            { $path: '../strokes' },
                        ],
                    },
                ],
            },
        },
        fills: { $palette: 'fills' },
        strokes: { $palette: 'strokes' },
        // @ts-expect-error undocumented option
        defaultColorRange: { $palette: 'gradients' },
        defaultPatternFills: SAFE_FILLS_OPERATION,
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeWidth: 0,
        lineDash: [0],
        lineDashOffset: 0,
        rotation: 0,
        sectorSpacing: 1,
        innerRadiusRatio: {
            $if: [{ $eq: [{ $path: ['./innerRadiusOffset', undefined] }, undefined] }, 0.7, undefined],
        },
        shadow: {
            enabled: false,
            color: DEFAULT_SHADOW_COLOUR,
            xOffset: 3,
            yOffset: 3,
            blur: 5,
        },
        innerLabels: {
            $apply: [
                {
                    fontSize: { $ref: 'fontSize' },
                    fontFamily: { $ref: 'fontFamily' },
                    fontWeight: { $ref: 'fontWeight' },
                    color: { $ref: 'textColor' },
                    spacing: 2,
                },
            ],
        } as any,
        highlight: singleSeriesHighlightStyle(),
    },
    legend: { enabled: true },
};
