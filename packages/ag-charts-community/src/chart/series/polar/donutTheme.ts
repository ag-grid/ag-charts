import type { ExtensibleTheme } from '../../../module/coreModules';
import { FONT_SIZE_RATIO } from '../../themes/constants';
import { DEFAULT_SHADOW_COLOUR } from '../../themes/symbols';

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
            color: { $ref: 'backgroundColor' },
            positionOffset: 0,
            positionRatio: 0.5,
        },
        calloutLine: {
            length: 10,
            strokeWidth: 2,
            colors: {
                $if: [{ $eq: [{ $path: '../strokeWidth' }, 0] }, { $path: '../fills' }, { $path: '../strokes' }],
            },
        },
        fills: { $palette: 'fills' },
        strokes: { $palette: 'strokes' },
        // @ts-expect-error undocumented option
        defaultColorRange: { $palette: 'gradients' },
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
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
            spacing: 2,
        },
    },
    legend: { enabled: true },
};
