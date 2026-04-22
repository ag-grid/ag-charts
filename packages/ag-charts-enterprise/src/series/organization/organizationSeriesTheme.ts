import type { ExtensibleTheme } from 'ag-charts-community';
import { BASE_FONT_SIZE, FONT_SIZE_RATIO } from 'ag-charts-core';

export const organizationSeriesTheme: ExtensibleTheme<'organization'> = {
    series: {
        link: {
            interpolation: {
                type: 'step',
                cornerRadius: 0,
            },
            lineDash: [],
            stroke: { $ref: 'foregroundColor' },
            strokeOpacity: 1,
            strokeWidth: 2,
        },
        tooltip: {
            enabled: false,
        },
        node: {
            cornerRadius: 12,
            fill: { $ref: 'backgroundColor' },
            padding: 20,
            stroke: { $palette: 'stroke' },
            strokeOpacity: 1,
            strokeWidth: 2,
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
                fontSize: { $rem: FONT_SIZE_RATIO.LARGE },
                fontStyle: 'normal',
                fontWeight: 'bold',
                key: 'title',
                overflowStrategy: 'ellipsis',
                spacing: 10,
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
                    wrapping: 'on-space',
                },
            },
        },
    },
};
