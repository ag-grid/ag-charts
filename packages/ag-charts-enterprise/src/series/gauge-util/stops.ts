import { _ModuleSupport, _Scale } from 'ag-charts-community';

const { BaseProperties, Validate, COLOR_STRING, NUMBER } = _ModuleSupport;
const { ColorScale } = _Scale;

export class GaugeStopProperties extends BaseProperties {
    @Validate(NUMBER, { optional: true })
    stop?: number;

    @Validate(COLOR_STRING, { optional: true })
    color?: string = 'black';
}

export interface GaugeColorStopDatum {
    stop: number;
    color: string;
}

function discreteColorStops(colorStops: GaugeColorStopDatum[]): GaugeColorStopDatum[] {
    return colorStops.flatMap((colorStop, i, colorStops) => {
        const { stop } = colorStop;
        const nextColor = colorStops.at(i + 1)?.color;
        return nextColor != null ? [colorStop, { stop, color: nextColor }] : [colorStop];
    });
}

function getDefaultColorStops(
    defaultColorStops: string[],
    domain: number[],
    fillMode: 'continuous' | 'discrete' | undefined,
    segments: number[] | undefined
) {
    const [min, max] = domain;

    if (segments != null && fillMode !== 'continuous') {
        const colorScale = new ColorScale();
        colorScale.domain = [0, 1];
        colorScale.range = defaultColorStops;

        const colorStops = Array.from({ length: segments.length - 1 }, (_, i): GaugeColorStopDatum => {
            const stop = segments[i + 1];
            const offset = i > 0 ? i / (segments.length - 2) : 0;
            const color = colorScale.convert(offset);

            return { stop, color };
        });

        return discreteColorStops(colorStops);
    }

    return defaultColorStops.map((color, index, { length }) => ({
        color,
        stop: ((max - min) * index) / (length - 1) + min,
    }));
}

export function getColorStops(
    fills: GaugeStopProperties[],
    defaultColorStops: string[],
    domain: number[],
    fillMode: 'continuous' | 'discrete' | undefined,
    segments: number[] | undefined
): GaugeColorStopDatum[] {
    if (fills.length === 0) {
        return getDefaultColorStops(defaultColorStops, domain, fillMode, segments);
    }

    const [min, max] = domain;
    const stopOffset = fillMode === 'discrete' ? 1 : 0;
    const stops = new Float64Array(fills.length);
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
            const value0 = fills[previousDefinedStopIndex].stop ?? min;
            const value1 = fills[nextDefinedStopIndex].stop ?? max;
            stop =
                value0 +
                ((value1 - value0) * (i - previousDefinedStopIndex + stopOffset)) /
                    (nextDefinedStopIndex - previousDefinedStopIndex + stopOffset);
        } else {
            previousDefinedStopIndex = i;
        }

        stops[i] = stop;
    }

    let lastDefinedColor = fills.find((c) => c.color != null)?.color;
    let colorScale: _Scale.ColorScale | undefined;

    const colorStops = fills.map(({ color }, i): GaugeColorStopDatum => {
        const stop = stops[i];

        if (color != null) {
            lastDefinedColor = color;
        } else if (lastDefinedColor != null) {
            color = lastDefinedColor;
        } else {
            if (colorScale == null) {
                colorScale = new ColorScale();
                colorScale.domain = domain;
                colorScale.range = defaultColorStops;
            }

            color = colorScale.convert(stop);
        }

        return { stop, color };
    });

    return fillMode === 'discrete' ? discreteColorStops(colorStops) : colorStops;
}
