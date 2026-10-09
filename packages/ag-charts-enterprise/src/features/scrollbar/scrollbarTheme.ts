import type { AgScrollbarOptions, Operation, WithThemeParams } from 'ag-charts-community';
import { themeBorderColor, themeBorderWidth } from 'ag-charts-core';

const HOVER_MIX_RATIO = 0.075;
// The thumb colour mixed towards the foreground, for a hover border that sets no colour of its own.
const HOVER_STROKE: Operation = { $mix: [{ $path: '../stroke' }, { $ref: 'foregroundColor' }, HOVER_MIX_RATIO] };

const SCROLLBAR_ORIENTATION_THEME: WithThemeParams<AgScrollbarOptions> = {
    enabled: { $path: '../enabled' },
    thickness: { $path: '../thickness' },
    spacing: { $path: '../spacing' },
    tickSpacing: { $path: '../tickSpacing' },
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
        hoverStyle: {
            fill: {
                $isUserOption: [
                    '../../../thumb/hoverStyle/fill',
                    { $path: '../../../thumb/hoverStyle/fill' },
                    {
                        $isUserOption: [
                            '../fill',
                            { $mix: [{ $path: '../fill' }, { $ref: 'foregroundColor' }, HOVER_MIX_RATIO] },
                            { $path: '../../../thumb/hoverStyle/fill' },
                        ],
                    },
                ],
            },
            stroke: {
                $isUserOption: [
                    '../../../thumb/hoverStyle/stroke',
                    { $path: '../../../thumb/hoverStyle/stroke' },
                    {
                        $isUserOption: [
                            '../stroke',
                            { $mix: [{ $path: '../stroke' }, { $ref: 'foregroundColor' }, HOVER_MIX_RATIO] },
                            { $path: '../../../thumb/hoverStyle/stroke' },
                        ],
                    },
                ],
            },
            strokeWidth: {
                $isUserOption: [
                    '../../../thumb/hoverStyle/strokeWidth',
                    { $path: '../../../thumb/hoverStyle/strokeWidth' },
                    {
                        $isUserOption: [
                            '../strokeWidth',
                            { $path: '../strokeWidth' },
                            { $path: '../../../thumb/hoverStyle/strokeWidth' },
                        ],
                    },
                ],
            },
        },
    },
};

export const SCROLLBAR_THEME: WithThemeParams<AgScrollbarOptions> = {
    enabled: false,
    enableAxisScrolling: false,
    enableSeriesAreaScrolling: true,
    thickness: { $ref: 'scrollbarThickness' },
    spacing: 16,
    tickSpacing: 0,
    placement: 'outer',
    visible: 'auto',
    track: {
        fill: { $ref: 'scrollbarTrackBackgroundColor' },
        stroke: themeBorderColor('scrollbarTrackBorder'),
        strokeWidth: themeBorderWidth('scrollbarTrackBorder', { on: 1 }),
        lineDash: [0],
        lineDashOffset: 0,
        opacity: 1,
        cornerRadius: { $ref: 'scrollbarTrackBorderRadius' },
    },
    thumb: {
        fill: { $ref: 'scrollbarThumbBackgroundColor' },
        stroke: themeBorderColor('scrollbarThumbBorder'),
        strokeWidth: themeBorderWidth('scrollbarThumbBorder', { on: 1 }),
        lineDash: [0],
        lineDashOffset: 0,
        opacity: 1,
        cornerRadius: { $ref: 'scrollbarThumbBorderRadius' },
        minSize: 20,
        hoverStyle: {
            // A per-chart thumb style carries to hover, unless the hover style is set explicitly.
            fill: {
                $isUserOption: [
                    '../fill',
                    { $mix: [{ $path: '../fill' }, { $ref: 'foregroundColor' }, HOVER_MIX_RATIO] },
                    { $ref: 'scrollbarThumbHoverBackgroundColor' },
                ],
            },
            stroke: {
                $isUserOption: [
                    '../stroke',
                    HOVER_STROKE,
                    themeBorderColor('scrollbarThumbHoverBorder', { on: HOVER_STROKE, unset: HOVER_STROKE }),
                ],
            },
            strokeWidth: {
                $isUserOption: [
                    '../strokeWidth',
                    { $path: '../strokeWidth' },
                    themeBorderWidth('scrollbarThumbHoverBorder', {
                        on: {
                            $if: [{ $greaterThan: [{ $path: '../strokeWidth' }, 0] }, { $path: '../strokeWidth' }, 1],
                        },
                        unset: { $path: '../strokeWidth' },
                    }),
                ],
            },
        },
    },
    vertical: SCROLLBAR_ORIENTATION_THEME,
    horizontal: SCROLLBAR_ORIENTATION_THEME,
};
