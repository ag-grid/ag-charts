import type { ExtensibleTheme } from '../../../module/coreModules';
import { DEFAULT_MUTED_LABEL_COLOUR, DEFAULT_SHADOW_COLOUR } from '../../themes/symbols';

export const donutTheme: ExtensibleTheme<'donut'> = {
    series: {
        title: {
            enabled: true,
            fontWeight: 'normal' as const,
            fontSize: 14,
            fontFamily: { ref: 'fontFamily' },
            color: DEFAULT_MUTED_LABEL_COLOUR,
            spacing: 5,
        },
        calloutLabel: {
            enabled: true,
            fontSize: { ref: 'fontSize' },
            fontFamily: { ref: 'fontFamily' },
            color: { ref: 'foregroundColor' },
            offset: 3,
            minAngle: 0,
        },
        sectorLabel: {
            enabled: true,
            fontWeight: 'normal',
            fontSize: { ref: 'fontSize' },
            fontFamily: { ref: 'fontFamily' },
            color: { ref: 'backgroundColor' },
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
        innerLabels: {
            fontSize: { ref: 'fontSize' },
            fontFamily: { ref: 'fontFamily' },
            color: { ref: 'foregroundColor' },
            spacing: 2,
        },
    },
    legend: { enabled: true },
};
