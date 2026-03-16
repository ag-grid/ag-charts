import { BaseProperties, PropertiesArray, Property } from 'ag-charts-core';
import type { AgGradientColorMode, AgGradientColorStop } from 'ag-charts-types';

import { ColorScale } from '../../scale/colorScale';
import { type GradientColorStop, resolveStopPositions } from '../../scale/colorScaleUtil';

export type { GradientColorStop } from '../../scale/colorScaleUtil';

export class StopProperties extends BaseProperties implements AgGradientColorStop {
    @Property
    stop?: number;

    @Property
    color: string = 'black';

    @Property
    name?: string;
}

export class ColorScaleProperties extends BaseProperties {
    @Property
    fills = new PropertiesArray<StopProperties>(StopProperties);

    @Property
    domain?: [number, number];

    @Property
    mode: AgGradientColorMode = 'continuous';
}

export function discreteColorStops(colorStops: GradientColorStop[]): GradientColorStop[] {
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
    }

    const d0 = Math.min(...domain);
    const d1 = Math.max(...domain);
    const isDiscrete = fillMode === 'discrete';
    const stops = resolveStopPositions(fills, d0, d1, isDiscrete);

    let lastDefinedColor = fills.find((c) => c.color != null)?.color;
    let colorScale: ColorScale | undefined;

    const colorStops = fills.map((fill, i): GradientColorStop => {
        let color = fill?.color;
        const stop = Math.max(0, Math.min(1, (stops[i] - d0) / (d1 - d0)));

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
