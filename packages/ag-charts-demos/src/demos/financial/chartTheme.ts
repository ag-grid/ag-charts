// Up/down palette colours are literal (not var()) — the preset's volume bar reads
// them via simpleItemStyler, which bypasses the options-graph var() resolution.
// Kept in sync with the --fin-* tokens in financial.css.
const UP = '#10b981';
const DOWN = '#f43f5e';

const PALETTE = Array.from({ length: 10 }, (_, i) => `var(--fin-chart-palette-${i})`);

export const THEME = {
    baseTheme: 'ag-financial-dark' as const,
    palette: {
        fills: PALETTE,
        strokes: PALETTE,
        up: {
            fill: UP,
            stroke: UP,
        },
        down: {
            fill: DOWN,
            stroke: DOWN,
        },
    },
    params: {
        chartBackgroundColor: 'var(--fin-panel-2)',
        fontFamily: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
        fontWeight: 300,
        fontSize: 11,
        textColor: 'var(--fin-text)',
        subtleTextColor: 'var(--fin-muted)',
        buttonBorderRadius: 0,
        buttonBackgroundColor: 'var(--fin-panel-2)',
        buttonBorder: { color: 'var(--fin-border)' },
        buttonTextColor: 'var(--fin-text)',
        tooltipBackgroundColor: 'var(--fin-panel-2)',
        tooltipBorder: { color: 'var(--fin-border)' },
        tooltipTextColor: 'var(--fin-text)',
        tooltipSubtleTextColor: 'var(--fin-muted)',
    },
    overrides: {
        common: {
            // Per-tick tweens never let the page idle while streaming. Presets omit `animation` from
            // their option types, so the theme is the only lever.
            animation: {
                enabled: false,
            },
            highlight: {
                enabled: false,
            },
            axes: {
                number: {
                    crosshair: {
                        enabled: false,
                    },
                    label: {
                        spacing: 8,
                    },
                },
                time: {
                    crosshair: {
                        enabled: false,
                    },
                    label: {
                        spacing: 4,
                    },
                },
                'ordinal-time': {
                    crosshair: {
                        label: {
                            format: '%H:%M',
                        },
                    },
                },
                category: {
                    label: {
                        spacing: 4,
                    },
                },
            },
        },
    },
};
