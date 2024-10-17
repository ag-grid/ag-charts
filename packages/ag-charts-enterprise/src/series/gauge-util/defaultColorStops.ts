import { _Scale } from 'ag-charts-community';

const { ColorScale } = _Scale;

export default function defaultColorStops(colors: string[] | undefined) {
    if (colors == null) return [];

    const colorScale = new ColorScale();
    colorScale.domain = [0, 1];
    colorScale.range = colors;

    const stopCount = 5;
    return Array.from({ length: 5 }, (_, i): string => {
        return colorScale.convert(i / (stopCount - 1));
    });
}
