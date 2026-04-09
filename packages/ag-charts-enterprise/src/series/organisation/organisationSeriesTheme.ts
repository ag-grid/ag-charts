import type { ExtensibleTheme } from 'ag-charts-community';

export const organisationSeriesTheme: ExtensibleTheme<'organization'> = {
    series: {
        node: {
            cornerRadius: 12,
            fill: '#ffffff',
            stroke: '#2d5f8a',
            strokeWidth: 2,
            title: {
                fontSize: 14,
                fontWeight: 'bold',
                key: 'title',
                overflowStrategy: 'ellipsis',
                spacing: 10,
                wrapping: 'on-space',
            },
            subtitle: {
                fontSize: 12,
                fontWeight: 'normal',
                key: 'subtitle',
                overflowStrategy: 'ellipsis',
                spacing: 10,
                wrapping: 'on-space',
            },
        },
    },
};
