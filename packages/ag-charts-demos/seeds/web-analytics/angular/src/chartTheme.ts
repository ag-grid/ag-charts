// AG Charts theme and the demo's shared data-viz palette. Every chart pulls its
// colours from here. Kept in sync with the --wa-* tokens in web-analytics.css.
import type { AgChartTheme } from 'ag-charts-community';

import { PAGE_TITLES } from './data';
import type { AnnotationType } from './types';

// Assigned in order and never cycled: the order is what keeps neighbours separable under CVD, and only
// adjacent pairs are reliably distinct, so charts pairing arbitrary slots need a second channel.
export const PALETTE = [
    '#2a78d6', // 0 blue
    '#eb6834', // 1 orange
    '#1baf7a', // 2 aqua
    '#eda100', // 3 yellow
    '#e87ba4', // 4 magenta
    '#008300', // 5 green
    '#4a3aa7', // 6 violet
    '#e34948', // 7 red
    '#8e44ad', // 8 plum
] as const;

// Below the palette's chroma floor, so it can never be mistaken for a series colour.
export const NEUTRAL = '#94a3b8';

/** One colour per page, so a page reads the same in every chart; pages past the palette read grey. */
export const pageColor = (title: string) => PALETTE[PAGE_TITLES.indexOf(title)] ?? NEUTRAL;

/** Funnel stages are ordinal, so one hue darkens with depth instead of changing. */
export const FUNNEL_COLORS = ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#104281'];

/** Single-hue ramp for continuous magnitude (heatmap cells, choropleth shapes). */
export const SEQUENTIAL_BLUE = ['#cde2fb', '#9ec5f4', '#3987e5', '#184f95', '#0d366b'];

export const ANNOTATION_COLOR: Record<AnnotationType, string> = {
    product: 'var(--wa-muted)',
    marketing: PALETTE[3],
};

export const THEME: AgChartTheme = {
    baseTheme: 'ag-default',
    palette: {
        fills: [...PALETTE],
        strokes: [...PALETTE],
    },
    params: {
        chartBackgroundColor: 'var(--wa-panel)',
        fontFamily: ['Urbanist', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        fontSize: 13,
        textColor: 'var(--wa-text)',
        subtleTextColor: 'var(--wa-muted)',
        tooltipBackgroundColor: 'var(--wa-panel)',
        tooltipTextColor: 'var(--wa-text)',
    },
    overrides: {
        common: {
            axes: {
                number: {
                    gridLine: { style: [{ stroke: 'var(--wa-grid)', lineDash: [] }] },
                    crosshair: {
                        enabled: false,
                    },
                    title: {
                        spacing: 8,
                    },
                    label: {
                        spacing: 8,
                    },
                },
                category: {
                    gridLine: { enabled: false },
                    label: {
                        spacing: 8,
                    },
                },
                time: {
                    gridLine: { enabled: false },
                    crosshair: {
                        enabled: false,
                    },
                    title: {
                        spacing: 8,
                    },
                    label: {
                        spacing: 8,
                    },
                },
                'ordinal-time': {
                    gridLine: { enabled: false },
                    label: {
                        spacing: 8,
                    },
                },
            },
            legend: {
                spacing: 8,
                position: 'bottom',
                item: {
                    marker: {
                        shape: 'circle',
                        size: 12,
                    },
                },
            },
            gradientLegend: {
                position: 'right',
                gradient: { thickness: 12, preferredLength: 240 },
                spacing: 16,
                scale: { padding: 8 },
            },
            animation: {
                enabled: true,
            },
        },
        area: {
            series: {
                interpolation: {
                    type: 'smooth',
                },
                marker: { enabled: true, fillOpacity: 0 },
                highlight: {
                    highlightedItem: {
                        fillOpacity: 1,
                    },
                },
            },
        },
    },
};
