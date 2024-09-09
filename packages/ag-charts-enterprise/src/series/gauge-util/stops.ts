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
    offset: number;
    color: string;
}

function discreteColorStops(colorStops: GaugeColorStopDatum[]): GaugeColorStopDatum[] {
    return colorStops.flatMap((colorStop, i) => {
        const { offset } = colorStop;
        const nextColor = colorStops.at(i + 1)?.color;
        return nextColor != null ? [colorStop, { offset, color: nextColor }] : [colorStop];
    });
}

function getDefaultColorStops(
    defaultColorStops: string[],
    domain: number[],
    fillMode: 'continuous' | 'discrete' | undefined,
    segments: number[] | undefined
) {
    const d0 = Math.min(...domain);
    const d1 = Math.max(...domain);

    if (segments != null && fillMode !== 'continuous') {
        const colorScale = new ColorScale();
        colorScale.domain = [0, 1];
        colorScale.range = defaultColorStops;

        const colorStops = Array.from({ length: segments.length - 1 }, (_, i): GaugeColorStopDatum => {
            const stop = segments[i + 1];
            const offset = (stop - d0) / (d1 - d0);
            const color = colorScale.convert(i > 0 ? i / (segments.length - 2) : 0);

            return { offset, color };
        });

        return discreteColorStops(colorStops);
    }

    const stops = defaultColorStops.map((color, index, { length }) => ({
        offset: index / (length - 1),
        color,
    }));

    if (fillMode === 'discrete') return discreteColorStops(stops);

    return stops;
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

    const d0 = Math.min(...domain);
    const d1 = Math.max(...domain);
    const stopOffset = fillMode === 'discrete' ? 1 : 0;
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
            const value0 = fills[previousDefinedStopIndex].stop ?? d0;
            const value1 = fills[nextDefinedStopIndex].stop ?? d1;
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
