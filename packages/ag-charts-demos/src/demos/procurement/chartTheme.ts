// AG Charts theme and the demo's shared data-viz palette. Every chart pulls its
// colours from here. Kept in sync with the --pc-* tokens in procurement.css.
import type { AgChartTheme } from 'ag-charts-community';

import type { ShipmentStatus } from './types';

/**
 * The theme's categorical slots, in the fixed order they must be assigned in.
 *
 * **The order is the colour-vision-deficiency mechanism, not a preference.** The sequence is what
 * was validated — worst adjacent pair ΔE 12.1 under deuteranopia, 20.9 under normal vision, every
 * slot inside the lightness band, above the chroma floor and over 3:1 on the panel. Reordering or
 * cycling it silently breaks that, so a seventh series folds into the neutral rather than taking a
 * generated hue.
 *
 * Three earthy slots alternate with three cool ones and none leans magenta, so the palette stays in
 * the family of the workspace's warm neutrals and brick accent.
 *
 * Two limits hold. Only the first three slots clear the harder all-pairs rule that applies where
 * marks sit side by side in a scatter, bubble or map; beyond that the charts carry direct labels as
 * the secondary encoding. And the warm slots sit near the danger token under simulated
 * deuteranopia, so they never share a chart with status, which carries a glyph of its own.
 *
 * Literal values rather than `var(--chart-n)` because an interpolated scale — the on-time heatmap's
 * — has to parse and mix its endpoints, which it cannot do through a CSS variable. The palette
 * therefore lives both here and in procurement.css as tokens, and the two are mirrored.
 */
export const PALETTE = [
    '#ad6543', // 1 clay — the accent's own family, so a single-series chart reads as brand
    '#119d9d', // 2 teal
    '#4b55a0', // 3 indigo
    '#a87a2a', // 4 ochre
    '#3c7ebe', // 5 steel blue
    '#6a7220', // 6 olive
    '#8c8680', // 7 warm neutral — baseline and dimmed marks, never an identity
] as const;

/**
 * The palette's neutral slot: unclassified marks, baselines, and anything dimmed out of a
 * selection. The theme reserves it for exactly that, so it never reads as a category.
 */
export const NEUTRAL = PALETTE[6];

/**
 * Assigns each supplier an identity colour, in roster order.
 *
 * Supplier is the primary entity in a commodity manager's world, so it is what carries colour
 * identity: the same supplier is the same colour in the sunburst's outer ring, on its scatter
 * bubble and on its scorecard card.
 *
 * Takes the categorical slots in their fixed order, stopping before the neutral one, which has a
 * job of its own. A roster is four to six suppliers, so no slot is ever reused.
 */
export function supplierColors(supplierIds: string[]): Record<string, string> {
    const slots = PALETTE.slice(0, 6);
    return Object.fromEntries(supplierIds.map((id, index) => [id, slots[index % slots.length]]));
}

/**
 * Slate steps for the spend trend's split by subcategory.
 *
 * The theme defines categorical slots and no sequential scale, and subcategories are neither
 * category nor status: they are hierarchy. A low-chroma ramp rather than categorical slots is what
 * keeps a categorical colour meaning supplier identity everywhere in the workspace.
 *
 * Stepped in OKLCH so the steps are evenly spaced *perceptually*; four of them, because no
 * commodity in the catalogue has more than four subcategories. Each step is ΔL 0.14 from its
 * neighbour and gains chroma as it darkens, so the bands differ in two channels at once — lightness
 * alone leaves four stacked bands hard to tell apart.
 */
export const SUBCATEGORY_RAMP = ['#96a0a9', '#687783', '#3e4f5e', '#162b3c'];

/**
 * Delivery status, on the theme's RAG tokens rather than the categorical palette — the spec
 * reserves those tokens for exactly this and forbids a chart colour standing in for them, however
 * similar it looks. Mirrors the `--color-*` status tokens in procurement.css — change both.
 *
 * These are the saturated fills, because here they colour marks rather than type. Where a status
 * label is set in type, the DOM takes the matching `-text` ink instead — see `--pc-bad` and its
 * siblings. Always paired with `STATUS_ICONS`: the accessibility requirement is that status never
 * rests on colour alone.
 *
 * On time takes the muted `--color-success-muted` rather than the full fill, so the exceptions are
 * what stand out on the schedule and the map. Its 2.4:1 contrast is below the 3:1 a mark would
 * otherwise need, which the glyph and the tooltip make up for.
 */
export const STATUS_COLORS: Record<ShipmentStatus, string> = {
    'On time': '#87b094',
    'At risk': '#dfb240',
    Late: '#e23d3d',
};

/** The full `--color-success` fill, for a faint good-outcome tint where the muted on-time ink would vanish. */
export const SUCCESS_FILL = '#4ca96c';

/** Marker shape per status, so the map reads without colour. */
export const STATUS_SHAPES: Record<ShipmentStatus, 'circle' | 'diamond' | 'triangle'> = {
    'On time': 'circle',
    'At risk': 'diamond',
    Late: 'triangle',
};

/**
 * Bad-to-good ramp for delivery performance, anchored on her on-time target at the midpoint.
 *
 * The RAG tokens again, and correctly so: an on-time rate genuinely is worse-to-better, and these
 * are the same three inks `STATUS_COLORS` uses for shipment status, so the two readings reinforce
 * rather than compete.
 */
export const ON_TIME_SCALE = [STATUS_COLORS.Late, STATUS_COLORS['At risk'], STATUS_COLORS['On time']];

/** Text glyph per status, for tiles, grid cells and legends. */
export const STATUS_ICONS: Record<ShipmentStatus, string> = {
    'On time': '●',
    'At risk': '◆',
    Late: '▲',
};

/**
 * Separates the segments of a stacked bar.
 *
 * Stroked in the panel colour rather than a darker outline, so it reads as a gap cut through the
 * bar in either theme: an outline would put a line colour into a chart whose segment colours
 * already carry supplier or subcategory identity, and a gap says "these are separate bands"
 * without adding a hue.
 */
export const SEGMENT_SEPARATOR = { stroke: 'var(--pc-panel)', strokeWidth: 1 } as const;

export const THEME: AgChartTheme = {
    baseTheme: 'ag-default',
    palette: {
        fills: [...PALETTE],
        strokes: [...PALETTE],
    },
    params: {
        chartBackgroundColor: 'var(--pc-panel)',
        fontFamily: ['Red Hat Text', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        fontSize: 13,
        textColor: 'var(--pc-text)',
        subtleTextColor: 'var(--pc-muted)',
        tooltipBackgroundColor: 'var(--pc-panel)',
        tooltipTextColor: 'var(--pc-text)',
    },
    overrides: {
        common: {
            axes: {
                // Axis titles are set italic here rather than per chart: they name the unit a chart is
                // read in, which is a different kind of text from the figures and labels around them.
                number: {
                    gridLine: { style: [{ stroke: 'var(--pc-grid)', lineDash: [] }] },
                    crosshair: { enabled: false },
                    title: { fontStyle: 'italic', spacing: 8 },
                    label: { spacing: 8 },
                },
                category: {
                    gridLine: { enabled: false },
                    title: { fontStyle: 'italic' },
                    label: { spacing: 8 },
                },
                time: {
                    title: { fontStyle: 'italic' },
                },
            },
            legend: {
                spacing: 12,
                position: 'bottom',
                item: {
                    marker: { size: 12 },
                },
            },
            animation: { enabled: true },
        },
    },
};
