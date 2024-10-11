import { type AgGaugeFillMode, _ModuleSupport, _Scale, _Util } from 'ag-charts-community';

const { BaseProperties, Validate, COLOR_STRING, NUMBER } = _ModuleSupport;
const { ColorScale } = _Scale;
const { Logger } = _Util;

export class GaugeStopProperties extends BaseProperties {
    @Validate(NUMBER, { optional: true })
    stop?: number;

    @Validate(COLOR_STRING, { optional: true })
    color?: string = 'black';
}

export interface GaugeColorStopDatum {
    offset: number;
    color: string;
}

function stopsAreAscending(fills: GaugeStopProperties[]) {
    let currentStop: number | undefined;
    for (const { stop } of fills) {
        if (stop == null) {
            continue;
        } else if (currentStop != null && stop < currentStop) {
            return false;
        }

        currentStop = stop;
    }

    return true;
}

function discreteColorStops(colorStops: GaugeColorStopDatum[]): GaugeColorStopDatum[] {
    return colorStops.flatMap((colorStop, i) => {
        const { offset } = colorStop;
        const nextColor = colorStops.at(i + 1)?.color;
        return nextColor != null ? [colorStop, { offset, color: nextColor }] : [colorStop];
    });
}

function getDefaultColorStops(defaultColorStops: string[], fillMode: AgGaugeFillMode) {
    const stopOffset = fillMode === 'discrete' ? 1 : 0;

    const colorStops = defaultColorStops.map(
        (color, index, { length }): GaugeColorStopDatum => ({
            offset: (index + stopOffset) / (length - 1 + stopOffset),
            color,
        })
    );

    return fillMode === 'discrete' ? discreteColorStops(colorStops) : colorStops;
}

export function getColorStops(
    fills: GaugeStopProperties[],
    defaultColorStops: string[],
    domain: number[],
    fillMode: AgGaugeFillMode
): GaugeColorStopDatum[] {
    if (fills.length === 0) {
        return getDefaultColorStops(defaultColorStops, fillMode);
    } else if (!stopsAreAscending(fills)) {
        Logger.warnOnce(`[fills] must have the stops defined in ascending order`);
        return [];
    }

    const d0 = Math.min(...domain);
    const d1 = Math.max(...domain);
    const isDiscrete = fillMode === 'discrete';
    const offsets = new Float64Array(fills.length);
    let previousDefinedStopIndex = 0;
    let nextDefinedStopIndex = -1;
    for (let i = 0; i < fills.length; i += 1) {
        const colorStop = fills[i];

        if (i >= nextDefinedStopIndex) {
            nextDefinedStopIndex = fills.length - 1;

            for (let j = i + 1; j < fills.length; j += 1) {
                if (fills[j].stop != null) {
                    nextDefinedStopIndex = j;
                    break;
                }
            }
        }

        let { stop } = colorStop;

        if (stop == null) {
            const stop0 = fills[previousDefinedStopIndex].stop;
            const stop1 = fills[nextDefinedStopIndex].stop;
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

        const offset = (stop - d0) / (d1 - d0);

        offsets[i] = offset;
    }

    let lastDefinedColor = fills.find((c) => c.color != null)?.color;
    let colorScale: _Scale.ColorScale | undefined;

    const colorStops = fills.map(({ color }, i): GaugeColorStopDatum => {
        const offset = offsets[i];

        if (color != null) {
            lastDefinedColor = color;
        } else if (lastDefinedColor != null) {
            color = lastDefinedColor;
        } else {
            if (colorScale == null) {
                colorScale = new ColorScale();
                colorScale.domain = [0, 1];
                colorScale.range = defaultColorStops;
            }

            color = colorScale.convert(offset);
        }

        return { offset, color };
    });

    return fillMode === 'discrete' ? discreteColorStops(colorStops) : colorStops;
}
