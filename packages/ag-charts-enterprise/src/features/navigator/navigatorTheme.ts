import { type AgNavigatorOptions, type WithThemeParams, _ModuleSupport } from 'ag-charts-community';

export const NAVIGATOR_THEME: WithThemeParams<AgNavigatorOptions> = {
    enabled: false,
    height: { $if: [{ $path: './miniChart/enabled' }, 40, 18] },
    cornerRadius: 4,
    mask: {
        fill: { $ref: 'foregroundColor' },
        fillOpacity: 0.1,
        stroke: { $ref: 'borderColor' },
        strokeWidth: 1,
    },
    minHandle: {
        fill: { $ref: 'backgroundColor' },
        stroke: { $ref: 'borderColor' },
        strokeWidth: 1,
        width: 12,
        height: 24,
        cornerRadius: 4,
    },
    maxHandle: {
        fill: { $ref: 'backgroundColor' },
        stroke: { $ref: 'borderColor' },
        strokeWidth: 1,
        width: 12,
        height: 24,
        cornerRadius: 4,
    },
    miniChart: {
        enabled: false,
        label: {
            color: { $ref: 'textColor' },
            fontSize: { $rem: [_ModuleSupport.FONT_SIZE_RATIO.SMALLER] },
            fontFamily: { $ref: 'fontFamily' } as any,
            fontWeight: { $ref: 'fontWeight' },
            spacing: 5,
        },
        padding: {
            top: 0,
            bottom: 0,
        },
        /* TODO: AG-10781 Breaking Change
        series: {
            $map: [
                {
                    $if: [
                        {
                            $or: [
                                { $eq: [{ $path: '/series/$index/type' }, 'area'] },
                                { $eq: [{ $path: '/series/$index/type' }, 'line'] },
                                { $eq: [{ $path: '/series/$index/type' }, 'range-area'] },
                            ],
                        },
                        {
                            $merge: [
                                {
                                    label: { enabled: false },
                                    marker: { enabled: { $path: ['/series/$index/marker/enabled', false] } },
                                },
                                { $value: '$1' },
                            ],
                        },
                        {
                            $if: [
                                {
                                    $or: [
                                        { $eq: [{ $path: '/series/$index/type' }, 'bar'] },
                                        { $eq: [{ $path: '/series/$index/type' }, 'bubble'] },
                                        { $eq: [{ $path: '/series/$index/type' }, 'range-bar'] },
                                        { $eq: [{ $path: '/series/$index/type' }, 'scatter'] },
                                    ],
                                },
                                { $merge: [{ label: { enabled: false } }, { $value: '$1' }] },
                                { $value: '$1' },
                            ],
                        },
                    ],
                },
                { $path: '/series' },
            ],
        },
        */
    },
};
