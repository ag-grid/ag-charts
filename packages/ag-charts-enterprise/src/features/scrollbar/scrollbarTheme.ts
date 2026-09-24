import type { AgScrollbarOptions, WithThemeParams } from 'ag-charts-community';

type ScrollbarBorderParam = 'scrollbarTrackBorder' | 'scrollbarThumbBorder';

// `true` means the default border colour at width 1, `false` disables the border.
function borderStroke(param: ScrollbarBorderParam) {
    return {
        $if: [{ $isType: [{ $ref: param }, 'boolean'] }, { $ref: 'borderColor' }, { $ref: `${param}.color` }],
    } as const;
}

function borderStrokeWidth(param: ScrollbarBorderParam) {
    return {
        $if: [{ $isType: [{ $ref: param }, 'boolean'] }, { $if: [{ $ref: param }, 1, 0] }, { $ref: `${param}.width` }],
    } as const;
}

// Hover values derived from a thumb value. A boolean hover (or thumb) border param falls back to deriving from the
// resolved thumb style, as the dotted hover-border refs have nothing to resolve against.
const HOVER_MIX_RATIO = 0.075;
const hoverFromThumb = (path: string) => ({ $mix: [{ $path: path }, { $ref: 'foregroundColor' }, HOVER_MIX_RATIO] });
const isAnyThumbBorderBoolean = {
    $or: [
        { $isType: [{ $ref: 'scrollbarThumbHoverBorder' }, 'boolean'] },
        { $isType: [{ $ref: 'scrollbarThumbBorder' }, 'boolean'] },
    ],
};

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
            fill: { $path: '../../../thumb/hoverStyle/fill' },
            stroke: { $path: '../../../thumb/hoverStyle/stroke' },
            strokeWidth: { $path: '../../../thumb/hoverStyle/strokeWidth' },
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
        stroke: borderStroke('scrollbarTrackBorder'),
        strokeWidth: borderStrokeWidth('scrollbarTrackBorder'),
        lineDash: [0],
        lineDashOffset: 0,
        opacity: 1,
        cornerRadius: { $ref: 'scrollbarTrackBorderRadius' },
    },
    thumb: {
        fill: { $ref: 'scrollbarThumbBackgroundColor' },
        stroke: borderStroke('scrollbarThumbBorder'),
        strokeWidth: borderStrokeWidth('scrollbarThumbBorder'),
        lineDash: [0],
        lineDashOffset: 0,
        opacity: 1,
        cornerRadius: { $ref: 'scrollbarThumbBorderRadius' },
        minSize: 20,
        // A per-chart thumb style still drives the hover style, as it did before the hover params existed.
        hoverStyle: {
            fill: {
                $isUserOption: ['../fill', hoverFromThumb('../fill'), { $ref: 'scrollbarThumbHoverBackgroundColor' }],
            },
            stroke: {
                $isUserOption: [
                    '../stroke',
                    hoverFromThumb('../stroke'),
                    {
                        $if: [
                            isAnyThumbBorderBoolean,
                            hoverFromThumb('../stroke'),
                            { $ref: 'scrollbarThumbHoverBorder.color' },
                        ],
                    },
                ],
            },
            strokeWidth: {
                $isUserOption: [
                    '../strokeWidth',
                    { $path: '../strokeWidth' },
                    {
                        $if: [
                            { $isType: [{ $ref: 'scrollbarThumbHoverBorder' }, 'boolean'] },
                            { $if: [{ $ref: 'scrollbarThumbHoverBorder' }, { $path: '../strokeWidth' }, 0] },
                            {
                                $if: [
                                    { $isType: [{ $ref: 'scrollbarThumbBorder' }, 'boolean'] },
                                    { $path: '../strokeWidth' },
                                    { $ref: 'scrollbarThumbHoverBorder.width' },
                                ],
                            },
                        ],
                    },
                ],
            },
        },
    },
    vertical: SCROLLBAR_ORIENTATION_THEME,
    horizontal: SCROLLBAR_ORIENTATION_THEME,
};
