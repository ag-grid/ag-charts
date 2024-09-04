import { _Scale } from 'ag-charts-community';

const { ColorScale } = _Scale;

type ColorStop = { stop?: number; color?: string };

export interface GaugeColorStopDatum {
    stop: number;
    color: string;
}
export function getColorStops(
    properties: { colorStops: ColorStop[]; defaultColorStops: string[] },
    domain: number[],
    mode: 'continuous' | 'segmented'
) {
    const [min, max] = domain;
    const domainRange = max - min;

    const { colorStops, defaultColorStops } = properties;
    if (colorStops.length === 0) {
        return defaultColorStops.map((color, index, { length }) => ({
            color,
            stop: ((max - min) * index) / (length - 1) + min,
        }));
    }

    const segmented = mode === 'segmented';
    const rangeDelta = segmented ? 1 : 0;

    const stops = new Float64Array(colorStops.length);
    let previousDefinedStopIndex = 0;
    let nextDefinedStopIndex = -1;
    for (let i = 0; i < colorStops.length; i += 1) {
        const colorStop = colorStops[i];

        if (i >= nextDefinedStopIndex) {
            nextDefinedStopIndex = colorStops.length - 1;

            for (let j = i + 1; j < colorStops.length; j += 1) {
                if (colorStops[j].stop != null) {
                    nextDefinedStopIndex = j;
                    break;
                }
            }
        }

        let { stop } = colorStop;

        if (stop == null) {
            const value0 = colorStops[previousDefinedStopIndex].stop ?? min;
            const value1 = colorStops[nextDefinedStopIndex].stop ?? max;
            stop =
                value0 +
                ((value1 - value0) * (i - previousDefinedStopIndex)) /
                    (nextDefinedStopIndex - previousDefinedStopIndex + rangeDelta);
        } else {
            previousDefinedStopIndex = i;
        }

        stops[i] = stop;
    }

    let colorScale: _Scale.ColorScale | undefined;
    let lastDefinedColor = colorStops.find((c) => c.color != null)?.color;

    return colorStops.map(({ color }, i): GaugeColorStopDatum => {
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

            if (segmented) {
                const nextStop = i < stops.length - 1 ? stops[i + 1] : max;
                const adjustedStop = (stop / (domainRange - (nextStop - stop))) * domainRange + min;
                color = colorScale.convert(adjustedStop);
            } else {
                color = colorScale.convert(stop);
            }
        }

        return { stop, color };
    });
}
