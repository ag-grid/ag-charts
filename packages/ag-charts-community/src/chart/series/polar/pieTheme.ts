import type { ExtensibleTheme } from '../../../module/coreModules';
import type { SeriesPaletteFactory } from '../../../module/coreModulesTypes';
import { FONT_SIZE_RATIO } from '../../themes/constants';
import { DEFAULT_MUTED_LABEL_COLOUR, DEFAULT_SHADOW_COLOUR } from '../../themes/symbols';

export const pieTheme: ExtensibleTheme<'pie'> = {
    series: {
        title: {
            enabled: true,
            fontWeight: { $ref: 'fontWeight' },
            fontSize: { $rem: [FONT_SIZE_RATIO.LARGE] },
            fontFamily: { $ref: 'fontFamily' },
            color: DEFAULT_MUTED_LABEL_COLOUR,
            spacing: 5,
        },
        calloutLabel: {
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'foregroundColor' },
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
        },
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeWidth: 0,
        lineDash: [0],
        lineDashOffset: 0,
        rotation: 0,
        sectorSpacing: 1,
        shadow: {
            enabled: false,
            color: DEFAULT_SHADOW_COLOUR,
            xOffset: 3,
            yOffset: 3,
            blur: 5,
        },
    },
    legend: { enabled: true },
};

export const piePaletteFactory: SeriesPaletteFactory<'pie'> = ({ takeColors, colorsCount }) => {
    const { fills, strokes } = takeColors(colorsCount);
    return { fills, strokes, calloutLine: { colors: strokes } };
};
