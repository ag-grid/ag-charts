import type { AgScrollbarOptions, WithThemeParams } from 'ag-charts-community';

const SCROLLBAR_ORIENTATION_THEME: WithThemeParams<AgScrollbarOptions> = {
    enabled: { $path: '../enabled' },
    thickness: { $path: '../thickness' },
    spacing: { $path: '../spacing' },
    placement: { $path: '../placement' },
    visible: { $path: '../visible' },
    track: {
        fill: { $path: '../../track/fill' },
        stroke: { $path: '../../track/stroke' },
        fillOpacity: { $path: '../../track/fillOpacity' },
        strokeWidth: { $path: '../../track/strokeWidth' },
        lineDash: { $path: '../../track/lineDash' },
        lineDashOffset: { $path: '../../track/lineDashOffset' },
        opacity: { $path: '../../track/opacity' },
        cornerRadius: { $path: '../../track/cornerRadius' },
    },
    thumb: {
        fill: { $path: '../../thumb/fill' },
        stroke: { $path: '../../thumb/stroke' },
        fillOpacity: { $path: '../../thumb/fillOpacity' },
        strokeWidth: { $path: '../../thumb/strokeWidth' },
        lineDash: { $path: '../../thumb/lineDash' },
        lineDashOffset: { $path: '../../thumb/lineDashOffset' },
        opacity: { $path: '../../thumb/opacity' },
        cornerRadius: { $path: '../../thumb/cornerRadius' },
        minSize: { $path: '../../thumb/minSize' },
    },
};

export const SCROLLBAR_THEME: WithThemeParams<AgScrollbarOptions> = {
    enabled: false,
    thickness: 12,
    spacing: 16,
    placement: 'outer',
    visible: 'auto',
    track: {
        fill: { $ref: 'foregroundColor' },
        stroke: { $foregroundBackgroundMix: 0.15 },
        fillOpacity: 0.05,
        strokeWidth: 1,
        lineDash: [0],
        lineDashOffset: 0,
        opacity: 1,
        cornerRadius: 6,
    },
    thumb: {
        fill: { $ref: 'foregroundColor' },
        stroke: { $foregroundBackgroundMix: 0.15 },
        fillOpacity: 0.1,
        strokeWidth: 1,
        lineDash: [0],
        lineDashOffset: 0,
        opacity: 1,
        cornerRadius: 6,
        minSize: 10,
        // @ts-expect-error undocumented option
        accentColor: { $ref: 'accentColor' },
    },
    vertical: SCROLLBAR_ORIENTATION_THEME,
    horizontal: SCROLLBAR_ORIENTATION_THEME,
};
