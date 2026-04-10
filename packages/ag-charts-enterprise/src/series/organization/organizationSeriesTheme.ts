import type { ExtensibleTheme } from 'ag-charts-community';
import { BASE_FONT_SIZE, FONT_SIZE_RATIO } from 'ag-charts-core';

export const organizationSeriesTheme: ExtensibleTheme<'organization'> = {
    series: {
        node: {
            cornerRadius: 12,
            fill: '#ffffff',
            stroke: '#2d5f8a',
            strokeWidth: 2,
            title: {
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $rem: FONT_SIZE_RATIO.LARGE },
                fontWeight: 'bold',
                key: 'title',
                overflowStrategy: 'ellipsis',
                spacing: 10,
                wrapping: 'on-space',
            },
            subtitle: {
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $rem: FONT_SIZE_RATIO.SMALL },
                fontWeight: 'normal',
                key: 'subtitle',
                overflowStrategy: 'ellipsis',
                spacing: 10,
                wrapping: 'on-space',
            },
            labels: {
                $apply: {
                    fontFamily: { $ref: 'fontFamily' },
                    fontSize: { $rem: 11 / BASE_FONT_SIZE },
                    fontWeight: 'normal',
                    overflowStrategy: 'ellipsis',
                    spacing: 10,
                    wrapping: 'on-space',
                },
            },
        },
    },
};
