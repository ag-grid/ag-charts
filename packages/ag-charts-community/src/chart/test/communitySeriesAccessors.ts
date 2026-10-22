import { expect } from 'vitest';

import type { LabelObstacle, Path, PlacedLabel, PointLabelDatum, RotatableText, Text } from 'ag-charts-core';

import { type SeriesSelectionName, getSeriesAt, getSeriesSelectionNodes } from './seriesAccessors';
import { type ChartOrProxy } from './utils';

// `placedLabelData` is protected on the series that run the placement engine (line, area, scatter, bubble, …).
interface PlacedLabelHost<TDatum extends PointLabelDatum> {
    placedLabelData?: PlacedLabel<TDatum>[];
}

/**
 * The labels the placement engine settled on for a series: where each sits, which candidate placement it took and the
 * datum it was placed for. `TDatum` is the label datum the test reads (the series' node datum is nested under
 * `datum.datum`). Fails for a series that keeps no placed labels, so a test cannot pass over a series type that never did.
 */
export function getPlacedLabelData<TDatum extends PointLabelDatum = PointLabelDatum>(
    chartOrProxy: ChartOrProxy<any>,
    index = 0
): PlacedLabel<TDatum>[] {
    const { placedLabelData } = getSeriesAt(chartOrProxy, index) as unknown as PlacedLabelHost<TDatum>;
    expect(placedLabelData, `series ${index} placed labels`).toBeDefined();
    return placedLabelData!;
}

// `getLabelObstacles` is declared by `ISeries` as optional; only the series that contribute obstacles implement it.
interface LabelObstacleHost {
    getLabelObstacles?: () => LabelObstacle[] | undefined;
}

/**
 * The obstacles a series hands the label placement engine so other series' labels avoid it, empty when it contributes
 * none. Fails for a series that cannot contribute obstacles at all.
 */
export function getSeriesLabelObstacles(chartOrProxy: ChartOrProxy<any>, index = 0): LabelObstacle[] {
    const series = getSeriesAt(chartOrProxy, index) as unknown as LabelObstacleHost;
    expect(series.getLabelObstacles, `series ${index} label obstacles`).toBeTypeOf('function');
    return series.getLabelObstacles!() ?? [];
}

/**
 * The label nodes a series has on the scene graph and is showing, in selection order. `selection` picks the labels
 * drawn for the datums (`labelSelection`, the default) or for the highlighted datum (`highlightLabelSelection`).
 * `TDatum` is the datum the series wrote onto each label node.
 * Use `getVisibleLabelNodes` (`utils`) instead when only text, size, position or the datum are read of the datums'
 * labels; this one is for the highlight selection and for what `RotatableText` adds (`getBBox`, `rotation`, boxing).
 */
export function getVisibleLabelTextNodes<TDatum = unknown>(
    chartOrProxy: ChartOrProxy<any>,
    index = 0,
    selection: Extract<SeriesSelectionName, 'labelSelection' | 'highlightLabelSelection'> = 'labelSelection'
): RotatableText<TDatum>[] {
    return getSeriesSelectionNodes<RotatableText<TDatum>>(chartOrProxy, selection, index).filter(
        (node) => node.visible
    );
}

// The box a label draws behind its text is private to `Text`; `Rect.cornerRadius` is write-only, so the resolved
// radius is read back off the box's first corner.
interface LabelBoxHost {
    boxing?: { topLeftCornerRadius: number };
}

/** The corner radius of the box behind a label's text, or `undefined` when the label draws no box. */
export function getLabelBoxCornerRadius(node: Text): number | undefined {
    return (node as unknown as LabelBoxHost).boxing?.topLeftCornerRadius;
}

// The area series' two paths are private to the cartesian series, which builds them from `pathsPerSeries`.
interface PathsHost {
    paths?: Path[];
}

/**
 * The paths a cartesian series draws its line or area with. An area series has its fill first and its stroke second.
 * Fails for a series that draws none.
 */
export function getSeriesPaths(chartOrProxy: ChartOrProxy<any>, index = 0): Path[] {
    const { paths } = getSeriesAt(chartOrProxy, index) as unknown as PathsHost;
    expect(paths, `series ${index} paths`).toBeDefined();
    return paths!;
}
