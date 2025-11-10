import { BaseProperties, Logger, Property } from 'ag-charts-core';
import type { AgGradientColorMode, AgGradientColorStop } from 'ag-charts-types';

import { ColorScale } from '../../scale/colorScale';

export interface GradientColorStop {
    stop: number;
    color: string;
}

export class StopProperties extends BaseProperties implements AgGradientColorStop {
    @Property
    stop?: number;

    @Property
    color?: string = 'black';
}

function stopsAreAscending(fills: AgGradientColorStop[]) {
    let currentStop: number | undefined;
    for (const fill of fills) {
        if (fill?.stop == null) continue;
        if (currentStop != null && fill.stop < currentStop) {
            return false;
        }
        currentStop = fill.stop;
    }

    return true;
}

function discreteColorStops(colorStops: GradientColorStop[]): GradientColorStop[] {
    return colorStops.flatMap((colorStop, i) => {
        const { stop } = colorStop;
        const nextColor = colorStops.at(i + 1)?.color;
        return nextColor == null ? [colorStop] : [colorStop, { stop, color: nextColor }];
    });
}

function getDefaultColorStops(defaultColorStops: string[], fillMode: AgGradientColorMode) {
    const stopOffset = fillMode === 'discrete' ? 1 : 0;

    const colorStops = defaultColorStops.map(
        (color, index, { length }): GradientColorStop => ({
            stop: (index + stopOffset) / (length - 1 + stopOffset),
            color,
        })
    );

    return fillMode === 'discrete' ? discreteColorStops(colorStops) : colorStops;
}

export function getColorStops(
    baseFills: Array<AgGradientColorStop | string>,
    defaultColorStops: string[],
    domain: number[],
    fillMode: AgGradientColorMode = 'continuous'
): GradientColorStop[] {
    const fills = baseFills.map<AgGradientColorStop>((fill) => (typeof fill === 'string' ? { color: fill } : fill));
    if (fills.length === 0) {
        return getDefaultColorStops(defaultColorStops, fillMode);
    } else if (!stopsAreAscending(fills)) {
        Logger.warnOnce(`[fills] must have the stops defined in ascending order`);
        return [];
    }

    const d0 = Math.min(...domain);
    const d1 = Math.max(...domain);
    const isDiscrete = fillMode === 'discrete';
    const stops = new Float64Array(fills.length);
    let previousDefinedStopIndex = 0;
    let nextDefinedStopIndex = -1;
    for (let i = 0; i < fills.length; i += 1) {
        const colorStop = fills[i];

        if (i >= nextDefinedStopIndex) {
            nextDefinedStopIndex = fills.length - 1;

            for (let j = i + 1; j < fills.length; j += 1) {
                if (fills[j]?.stop != null) {
                    nextDefinedStopIndex = j;
                    break;
                }
            }
        }

        let stop = colorStop?.stop;

        if (stop == null) {
            const stop0 = fills[previousDefinedStopIndex]?.stop;
            const stop1 = fills[nextDefinedStopIndex]?.stop;
            const value0 = stop0 ?? d0;
            const value1 = stop1 ?? d1;
            const stopOffset = isDiscrete && stop0 == null ? 1 : 0;
            stop =
                value0 +
                ((value1 - value0) * (i - previousDefinedStopIndex + stopOffset)) /
                    (nextDefinedStopIndex - previousDefinedStopIndex + stopOffset);
        } else {
            previousDefinedStopIndex = i;
        }

        stops[i] = Math.max(0, Math.min(1, (stop - d0) / (d1 - d0)));
    }

    let lastDefinedColor = fills.find((c) => c.color != null)?.color;
    let colorScale: ColorScale | undefined;

    const colorStops = fills.map((fill, i): GradientColorStop => {
        let color = fill?.color;
        const stop = stops[i];

        if (color != null) {
            lastDefinedColor = color;
        } else if (lastDefinedColor == null) {
            if (colorScale == null) {
                colorScale = new ColorScale();
                colorScale.domain = [0, 1];
                colorScale.range = defaultColorStops;
            }

            color = colorScale.convert(stop)!;
        } else {
            color = lastDefinedColor;
        }

        return { stop, color };
    });

    return fillMode === 'discrete' ? discreteColorStops(colorStops) : colorStops;
}
