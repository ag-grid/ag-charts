import type { AgColorScaleColorStop } from 'ag-charts-types';

import { clamp, toFiniteNumber } from '../utils/data/numbers';

/** Colour mode for colour scale operations. */
export type ColorScaleMode = 'continuous' | 'discrete';

/** A colour stop with an optional position and optional name. */
export interface ColorScaleColorStop {
    color: string;
    stop?: number;
    name?: string;
}

export interface ColorScaleBin {
    start: number;
    end: number;
    color: string;
    name?: string;
}

export type GradientColorStop = { stop: number; color: string };

export interface ColorScaleState {
    domain: number[];
    range: string[];
    mode: ColorScaleMode;
    /**
     * The user-visible domain shown on the gradient legend axis. Independent
     * of `domain`, which carries interpolation pivots derived from the fill
     * stops. When omitted, defaults to `[domain[0], domain.at(-1)]`.
     * Can be bigint (AG-16608 heatmap); narrowed to Number where used.
     */
    displayDomain?: [number | bigint, number | bigint];
}

function toNumberOrUndefined(stop: number | bigint | undefined): number | undefined {
    return stop == null ? undefined : Number(stop);
}

function findNextDefinedStop(fills: Array<{ stop?: number }>, from: number): number {
    for (let j = from + 1; j < fills.length; j++) {
        if (fills[j]?.stop != null) return j;
    }
    return fills.length - 1;
}

/** Resolve stop positions for each fill entry, returning stops in data-space. */
export function resolveStopPositions(
    fills: Array<{ stop?: number }>,
    d0: number,
    d1: number,
    isDiscrete: boolean
): number[] {
    const stops: number[] = new Array(fills.length);
    let previousDefinedStopIndex = 0;
    let nextDefinedStopIndex = -1;

    for (let i = 0; i < fills.length; i++) {
        if (i >= nextDefinedStopIndex) {
            nextDefinedStopIndex = findNextDefinedStop(fills, i);
        }

        // A colour stop is a fractional threshold, so a bigint stop (gauge AgGaugeColorStop) narrows
        // to Number for the interpolation maths below — mixing bigint with the Number domain throws.
        const stop = toNumberOrUndefined(fills[i]?.stop);

        if (stop == null) {
            const stop0 = toNumberOrUndefined(fills[previousDefinedStopIndex]?.stop);
            const stop1 = toNumberOrUndefined(fills[nextDefinedStopIndex]?.stop);
            const value0 = stop0 ?? d0;
            const value1 = stop1 ?? d1;
            const offset = isDiscrete && stop0 == null ? 1 : 0;
            stops[i] =
                value0 +
                ((value1 - value0) * (i - previousDefinedStopIndex + offset)) /
                    (nextDefinedStopIndex - previousDefinedStopIndex + offset);
        } else {
            stops[i] = stop;
            previousDefinedStopIndex = i;
        }
    }

    return stops;
}

export function formatColorScaleBinLabel(
    bin: ColorScaleBin,
    index: number,
    bins: readonly ColorScaleBin[],
    formatValueFn: (value: number, maximumFractionDigits?: number) => string
): string {
    if (bin.name != null) {
        return bin.name;
    }

    const isLast = index === bins.length - 1;
    if (Number.isInteger(bin.start) && Number.isInteger(bin.end) && !isLast && bin.end - bin.start >= 1) {
        return `${formatValueFn(bin.start, 0)}–${formatValueFn(bin.end - 1, 0)}`;
    }

    return `${formatValueFn(bin.start)}–${formatValueFn(bin.end)}`;
}

interface ColorBins {
    domain: number[];
    range: string[];
    bins: ColorScaleBin[];
}

/**
 * Converts a fills array into domain/range arrays for ColorScale, plus bin metadata.
 */
export function computeColorBins(
    fills: ColorScaleColorStop[],
    domain: [number | bigint, number | bigint],
    mode: ColorScaleMode
): ColorBins {
    if (fills.length === 0) {
        return { domain: [], range: [], bins: [] };
    }

    // The colour domain originates from the colorKey extent, which can be bigint (AG-16608 heatmap).
    // Narrow to Number for the interpolation/clamp maths below; mixing bigint with number throws.
    const d0 = toFiniteNumber(domain[0]);
    const d1 = toFiniteNumber(domain[1]);
    const isDiscrete = mode === 'discrete';
    const resolvedStops = resolveStopPositions(fills, d0, d1, isDiscrete);
    const resolvedColors = fills.map((fill) => fill.color);

    if (isDiscrete) {
        return buildDiscreteBins(resolvedStops, resolvedColors, fills, d0, d1);
    }

    return { domain: resolvedStops, range: resolvedColors, bins: [] };
}

function buildDiscreteBins(
    stops: number[],
    colors: string[],
    fills: ColorScaleColorStop[],
    d0: number,
    d1: number
): ColorBins {
    const domain: number[] = [];
    const range: string[] = [];
    const bins: ColorScaleBin[] = [];

    for (let i = 0; i < fills.length; i++) {
        const binStart = i === 0 ? d0 : stops[i - 1];
        const binEnd = stops[i];
        const clampedStart = clamp(d0, binStart, d1);
        const clampedEnd = Math.max(clampedStart, clamp(d0, binEnd, d1));

        domain.push(clampedStart);
        range.push(colors[i]);
        bins.push({
            start: clampedStart,
            end: clampedEnd,
            color: colors[i],
            name: fills[i].name,
        });
    }

    // Include the last bin's end as a final boundary so the gradient legend
    // can render proportional bands and extend the axis to the full range.
    domain.push(bins.at(-1)!.end);

    return { domain, range, bins };
}

/**
 * Derives normalised [0, 1] colour stops from a configured ColorScale's
 * domain, range, and mode. Suitable for gradient rendering (e.g. gradient legend).
 */
export function deriveNormalizedStops(colorScale: ColorScaleState): GradientColorStop[] {
    const { domain, range, mode, displayDomain } = colorScale;
    if (range.length === 0) return [];

    // `domain` holds Number interpolation pivots. `displayDomain` is the user-visible range and can be
    // bigint (AG-16608 heatmap), so narrow it to Number for the [0,1] fraction maths below.
    const [d0, d1] = displayDomain
        ? [toFiniteNumber(displayDomain[0]), toFiniteNumber(displayDomain[1])]
        : [domain[0], domain.at(-1)!];
    const extent = d1 - d0 || 1;

    if (mode === 'discrete') {
        // domain has N+1 boundaries for N colours. Clamp to [0, 1] so
        // boundaries outside `displayDomain` collapse to the nearest edge.
        const stops: GradientColorStop[] = [];
        for (let i = 0; i < range.length; i++) {
            const start = clamp(0, (domain[i] - d0) / extent, 1);
            const end = clamp(0, (domain[i + 1] - d0) / extent, 1);
            if (end < start) continue;
            stops.push({ stop: start, color: range[i] });
            if (end > start) stops.push({ stop: end, color: range[i] });
        }
        return stops;
    }

    // Continuous mode: if domain has fewer entries than range (fallback path
    // with a 2-element domain and N colours), evenly space the stops.
    if (domain.length < range.length) {
        const count = Math.max(range.length - 1, 1);
        return range.map((color, i) => ({ stop: i / count, color }));
    }

    return domain.map((v, i) => ({ stop: (v - d0) / extent, color: range[i] }));
}

/** Formats a discrete bin range label from its boundaries. */
export function formatColorBinLabel(
    start: number,
    end: number,
    index: number,
    count: number,
    formatValue: (value: number, maximumFractionDigits?: number) => string
): string {
    const bin: ColorScaleBin = { start, end, color: '' };
    return formatColorScaleBinLabel(bin, index, { length: count } as readonly ColorScaleBin[], formatValue);
}

/**
 * Returns the label for the discrete bin containing `value`, derived from the
 * ColorScale's domain and the original fills.
 */
export function findDiscreteColorBinLabel(
    colorScale: ColorScaleState,
    fills: AgColorScaleColorStop[],
    value: number,
    formatValueFn: (value: number, maximumFractionDigits?: number) => string
): string | undefined {
    const { domain, range, mode } = colorScale;
    if (mode !== 'discrete' || range.length === 0) return undefined;

    // domain has N+1 boundaries for N colours — find which bin the value falls into.
    let i = 0;
    while (i < range.length - 1 && value >= domain[i + 1]) i++;

    return fills[i]?.name ?? formatColorBinLabel(domain[i], domain[i + 1], i, range.length, formatValueFn);
}

export function discreteColorStops(colorStops: GradientColorStop[]): GradientColorStop[] {
    return colorStops.flatMap((colorStop, i) => {
        const { stop } = colorStop;
        const nextColor = colorStops.at(i + 1)?.color;
        return nextColor == null ? [colorStop] : [colorStop, { stop, color: nextColor }];
    });
}
