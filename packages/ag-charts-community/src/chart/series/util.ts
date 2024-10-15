import type { Point } from '../../scene/point';
import type { ChartAxis } from '../chartAxis';
import type { ProcessedDataDef } from '../data/dataModel';
import type { Series, SeriesNodePickIntent } from './series';
import type { SeriesNodeDatum } from './seriesTypes';

export function convertValuesToScaleByDefs<T extends string>({
    defs,
    values,
    xAxis,
    yAxis,
}: {
    defs: [string, ProcessedDataDef][];
    values: Record<T, unknown>;
    xAxis: ChartAxis | undefined;
    yAxis: ChartAxis | undefined;
}): Record<T, number> {
    if (!(xAxis && yAxis)) {
        throw new Error('Axes must be defined');
    }
    const result: Record<string, number> = {};
    for (const [searchId, { def }] of defs) {
        if (Object.hasOwn(values, searchId)) {
            const { scale } = def.type === 'key' ? xAxis : yAxis;
            result[searchId] = Math.round(scale.convert((values as any)[searchId]));
        }
    }
    return result;
}

type PickedNode = {
    series: Series<any, any>;
    datum: SeriesNodeDatum;
    distance: number;
};

// x/y are local canvas coordinates in CSS pixels, not actual pixels
export function pickNode(
    inputSeries: Series<any, any>[],
    point: Point,
    intent: SeriesNodePickIntent,
    exactMatchOnly?: boolean
): PickedNode | undefined {
    // Iterate through series in reverse, as later declared series appears on top of earlier
    // declared series.
    const reverseSeries = [...inputSeries].reverse();

    let result: { series: Series<any, any>; datum: SeriesNodeDatum; distance: number } | undefined;
    for (const series of reverseSeries) {
        if (!series.visible || !series.contentGroup.visible) {
            continue;
        }
        const { match, distance } = series.pickNode(point, intent, exactMatchOnly) ?? {};
        if (!match || distance == null) {
            continue;
        }
        if (!result || result.distance > distance) {
            result = { series, distance, datum: match };
        }
        if (distance === 0) {
            break;
        }
    }

    return result;
}
