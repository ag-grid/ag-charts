import type { ExtensibleTheme } from 'ag-charts-community';
import { BASE_FONT_SIZE, FONT_SIZE_RATIO } from 'ag-charts-core';

export const organizationSeriesTheme: ExtensibleTheme<'organization'> = {
    series: {
        innerSpacing: 20,
        // outerSpacing: 40,
        verticalSpacing: 40,
        expander: {
            height: 24,
        },
        link: {
            interpolation: {
                type: 'step',
                cornerRadius: 8,
            },
            lineDash: [],
            stroke: { $foregroundBackgroundMix: 0.2 },
            strokeOpacity: 1,
            strokeWidth: 1,
        },
        tooltip: {
            enabled: false,
        },
        node: {
            cornerRadius: 4,
            fill: { $foregroundBackgroundMix: 0.02 },
            padding: 16,
            stroke: { $foregroundBackgroundMix: 0.2 },
            strokeOpacity: 1,
            strokeWidth: 1,
            image: {
                key: 'image',
                width: 50,
                height: 50,
                position: 'top',
                shape: 'square',
                spacing: 10,
            },
            title: {
                color: { $ref: 'foregroundColor' },
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $rem: FONT_SIZE_RATIO.SMALL },
                fontStyle: 'normal',
                fontWeight: 'bold',
                key: 'title',
                overflowStrategy: 'ellipsis',
                spacing: 10,
                textAlign: 'center',
                wrapping: 'on-space',
            },
            subtitle: {
                color: { $ref: 'foregroundColor' },
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $rem: FONT_SIZE_RATIO.SMALL },
                fontStyle: 'normal',
                fontWeight: 'normal',
                key: 'subtitle',
                overflowStrategy: 'ellipsis',
                spacing: 10,
                textAlign: 'center',
                wrapping: 'on-space',
            },
            labels: {
                $apply: {
                    color: { $ref: 'foregroundColor' },
                    fontFamily: { $ref: 'fontFamily' },
                    fontSize: { $rem: 11 / BASE_FONT_SIZE },
                    fontStyle: 'normal',
                    fontWeight: 'normal',
                    overflowStrategy: 'ellipsis',
                    spacing: 10,
                    textAlign: 'center',
                    wrapping: 'on-space',
                },
            },
        },
    },
};
