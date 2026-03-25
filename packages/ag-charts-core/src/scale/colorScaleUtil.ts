import { clamp } from '../utils/data/numbers';

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

        const stop = fills[i]?.stop;

        if (stop == null) {
            const stop0 = fills[previousDefinedStopIndex]?.stop;
            const stop1 = fills[nextDefinedStopIndex]?.stop;
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
    domain: [number, number],
    mode: ColorScaleMode
): ColorBins {
    if (fills.length === 0) {
        return { domain: [], range: [], bins: [] };
    }

    const [d0, d1] = domain;
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
    const { domain, range, mode } = colorScale;
    if (range.length === 0) return [];

    const d0 = domain[0];
    const d1 = domain.at(-1)!;
    const extent = d1 - d0 || 1;

    if (mode === 'discrete') {
        // domain has N+1 boundaries for N colours.
        const stops: GradientColorStop[] = [];
        for (let i = 0; i < range.length; i++) {
            const start = (domain[i] - d0) / extent;
            const end = (domain[i + 1] - d0) / extent;
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

export function discreteColorStops(colorStops: GradientColorStop[]): GradientColorStop[] {
    return colorStops.flatMap((colorStop, i) => {
        const { stop } = colorStop;
        const nextColor = colorStops.at(i + 1)?.color;
        return nextColor == null ? [colorStop] : [colorStop, { stop, color: nextColor }];
    });
}
