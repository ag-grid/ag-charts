import type { ExtensibleTheme } from 'ag-charts-community';
import { BASE_FONT_SIZE, FONT_SIZE_RATIO } from 'ag-charts-core';

export const organizationSeriesTheme: ExtensibleTheme<'organization'> = {
    // Opt org charts into the Zoom feature with org-specific defaults. The `axes: 'xy'` and
    // `keepAspectRatio` overrides are scoped to this series module's theme template and do NOT
    // leak to cartesian charts. The `autoScaling.enabled: false` keeps the viewport stable
    // across data changes; `onDataChange.strategy: 'preserveRatios'` keeps the current
    // zoom window proportional on data updates. `minVisibleItems: 1` activates the
    // `getZoomRangeFittingItems` code path (implemented in Phase 4 to enforce the 1:1 cap).
    zoom: {
        enabled: true,
        enableAxisDragging: false,
        enableAxisScrolling: false,
        enablePanning: true,
        enableScrolling: true,
        enableTwoFingerZoom: true,
        enableDoubleClickToReset: true,
        axes: 'xy',
        keepAspectRatio: true,
        anchorPointX: 'pointer',
        anchorPointY: 'pointer',
        autoScaling: { enabled: false },
        onDataChange: { strategy: 'preserveRatios' },
        minVisibleItems: 1,
        buttons: {
            visible: 'hover',
            buttons: {
                $shallowSimple: [
                    { icon: 'zoom-out', value: 'zoom-out', section: 'scale' },
                    { icon: 'zoom-in', value: 'zoom-in', section: 'scale' },
                    { icon: 'reset', value: 'reset', section: 'reset' },
                ],
            },
        },
    },
    series: {
        innerSpacing: 20,
        outerSpacing: 40,
        verticalSpacing: 52,
        expander: {
            height: 24,
            spacing: 4,
        },
        highlight: {
            enabled: { $path: ['/highlight/enabled', true] },
            highlightedItem: {
                stroke: { $foregroundBackgroundMix: 0.5 },
                strokeWidth: 2,
            },
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
            padding: 8,
            stroke: { $foregroundBackgroundMix: 0.2 },
            strokeOpacity: 1,
            strokeWidth: 1,
            image: {
                key: 'image',
                width: 50,
                height: 50,
                position: 'top',
                shape: 'circle',
                spacing: 8,
            },
            title: {
                color: { $ref: 'foregroundColor' },
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $rem: FONT_SIZE_RATIO.SMALL },
                fontStyle: 'normal',
                fontWeight: 'bold',
                key: 'title',
                overflowStrategy: 'ellipsis',
                spacing: 4,
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
                spacing: 4,
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
                    spacing: 4,
                    textAlign: 'center',
                    wrapping: 'on-space',
                },
            },
        },
    },
};
