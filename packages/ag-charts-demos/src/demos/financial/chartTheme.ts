// Up/down palette colours are literal (not var()) — the preset's volume bar reads
// them via simpleItemStyler, which bypasses the options-graph var() resolution.
// Kept in sync with the --fin-* tokens in financial.css.
const UP = '#10b981';
const DOWN = '#f43f5e';

const PALETTE = Array.from({ length: 10 }, (_, i) => `var(--fin-chart-palette-${i})`);

// Softened crosshair: the default template is a full-opacity subtleTextColor line
// dashed [5, 6], which reads as a hard rule across the plot. A fine dash at low
// opacity is enough to track the pointer without competing with the candles.
// Sharing one block keeps the price and time crosshairs identical.
const SUBTLE_CROSSHAIR = {
    strokeOpacity: 0.2,
    strokeWidth: 1,
    lineDash: [2, 5],
};

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
        // The surface every derived param is mixed against. Left at the base theme's
        // default, mixes like gridLineColor and the menu's active-row wash would be
        // computed from a background the demo does not actually paint.
        backgroundColor: 'var(--fin-panel-2)',
        // Chart-internal text (axis labels, tooltips, legends) stays monospaced so
        // figures stay column-aligned; the surrounding app chrome is system-ui.
        fontFamily: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
        fontWeight: 400,
        fontSize: 11,
        textColor: 'var(--fin-text)',
        subtleTextColor: 'var(--fin-muted)',
        // Chart chrome follows the app: surfaces carry structure by tone, so every
        // border is off rather than tinted.
        buttonBorderRadius: 0,
        buttonBackgroundColor: 'var(--fin-elevated)',
        buttonBorder: false,
        buttonTextColor: 'var(--fin-text)',
        // The chart's own chart-type menu. It is a `.ag-charts-popover` wrapping a
        // `.ag-charts-menu`, and the popover takes its surface from
        // `panelBackgroundColor` — NOT from `menuBackgroundColor`, which drives a
        // different menu. Left to the base theme it renders as a blue-black slab that
        // belongs to a different app; these pin it to the demo's neutral family, one
        // step above the card so it still reads as floating.
        panelBackgroundColor: 'var(--fin-elevated)',
        panelSubtleTextColor: 'var(--fin-muted)',
        chromeTextColor: 'var(--fin-text)',
        // Drops the outline on the popover and the chart toolbars outright, rather than
        // colouring a border to hide it.
        borderWidth: 0,
        // A menu genuinely floats, so it keeps the one elevation — matched to the
        // Radix menus in financial.css.
        popupShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
        accentColor: 'var(--fin-accent)',
        tooltipBackgroundColor: 'var(--fin-elevated)',
        tooltipBorder: false,
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
                        // Off for the peer charts. The price-volume preset re-enables it as a
                        // direct chart option on its own y axis, so the main chart keeps its
                        // crosshair and only picks up the styling below.
                        enabled: false,
                        ...SUBTLE_CROSSHAIR,
                    },
                    label: {
                        spacing: 8,
                    },
                },
                time: {
                    crosshair: {
                        enabled: false,
                        ...SUBTLE_CROSSHAIR,
                    },
                    label: {
                        spacing: 4,
                    },
                },
                'ordinal-time': {
                    crosshair: {
                        ...SUBTLE_CROSSHAIR,
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
