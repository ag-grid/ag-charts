import type { AgScrollbarOptions, AgScrollbarThumbStyle, WithThemeParams } from 'ag-charts-community';

type ThumbTheme = WithThemeParams<Required<AgScrollbarThumbStyle>>;
type BorderParam = 'scrollbarTrackBorder' | 'scrollbarThumbBorder';

// `true` means the default border colour at width 1, `false` disables the border.
function borderStroke(param: BorderParam, colorRef: `${BorderParam}.color`): ThumbTheme['stroke'] {
    return { $if: [{ $isType: [{ $ref: param }, 'boolean'] }, { $ref: 'borderColor' }, { $ref: colorRef }] };
}

function borderStrokeWidth(param: BorderParam, widthRef: `${BorderParam}.width`): ThumbTheme['strokeWidth'] {
    return { $if: [{ $isType: [{ $ref: param }, 'boolean'] }, { $if: [{ $ref: param }, 1, 0] }, { $ref: widthRef }] };
}

const HOVER_MIX_RATIO = 0.075;

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
            // An orientation's own thumb width carries to hover, unless the shared hover width is set explicitly.
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
        stroke: borderStroke('scrollbarTrackBorder', 'scrollbarTrackBorder.color'),
        strokeWidth: borderStrokeWidth('scrollbarTrackBorder', 'scrollbarTrackBorder.width'),
        lineDash: [0],
        lineDashOffset: 0,
        opacity: 1,
        cornerRadius: { $ref: 'scrollbarTrackBorderRadius' },
    },
    thumb: {
        fill: { $ref: 'scrollbarThumbBackgroundColor' },
        stroke: borderStroke('scrollbarThumbBorder', 'scrollbarThumbBorder.color'),
        strokeWidth: borderStrokeWidth('scrollbarThumbBorder', 'scrollbarThumbBorder.width'),
        lineDash: [0],
        lineDashOffset: 0,
        opacity: 1,
        cornerRadius: { $ref: 'scrollbarThumbBorderRadius' },
        minSize: 20,
        // A per-chart thumb style still drives the hover style, as it did before the hover params existed. A hover border
        // member that does not resolve (a boolean hover border, or the default one over a boolean thumb border) derives
        // from the thumb instead.
        hoverStyle: {
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
                    { $mix: [{ $path: '../stroke' }, { $ref: 'foregroundColor' }, HOVER_MIX_RATIO] },
                    {
                        $if: [
                            { $isType: [{ $ref: 'scrollbarThumbHoverBorder.color' }, 'string'] },
                            { $ref: 'scrollbarThumbHoverBorder.color' },
                            { $mix: [{ $path: '../stroke' }, { $ref: 'foregroundColor' }, HOVER_MIX_RATIO] },
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
                                    { $isType: [{ $ref: 'scrollbarThumbHoverBorder.width' }, 'number'] },
                                    { $ref: 'scrollbarThumbHoverBorder.width' },
                                    { $path: '../strokeWidth' },
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
