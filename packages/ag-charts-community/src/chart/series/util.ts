import type { Point } from '../../scene/point';
import { findMaxIndex, findMinIndex } from '../../util/binarySearch';
import type { Series, SeriesNodePickIntent } from './series';
import type { SeriesNodeDatum } from './seriesTypes';

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

function datumBoundaryPoints(datum: any, domain: any[]) {
    if (datum == null || domain.length === 0) {
        return [false, false];
    }

    const datumValue = datum.valueOf();

    const d0 = domain[0];
    const d1 = domain[domain.length - 1];

    if (typeof d0 === 'string') {
        return [datumValue === d0, datumValue === d1];
    }

    let min = d0.valueOf();
    let max = d1.valueOf();
    if (min > max) {
        [min, max] = [max, min];
    }

    return [datumValue === min, datumValue === max];
}

export function datumStylerProperties<TDatum extends { xValue: any; yValue: any }>(
    datum: TDatum,
    xKey: string,
    yKey: string,
    xDomain: any[],
    yDomain: any[]
) {
    const { xValue, yValue } = datum;
    const [min, max] = datumBoundaryPoints(yValue, yDomain);
    const [first, last] = datumBoundaryPoints(xValue, xDomain);
    return {
        datum,
        xKey,
        yKey,
        xValue,
        yValue,
        first,
        last,
        min,
        max,
    };
}

export function visibleRangeIndices(
    length: number,
    [range0, range1]: [number, number],
    xRange: (index: number) => [number, number] | undefined
) {
    const xMinIndex =
        findMinIndex(0, length - 1, (index) => {
            const x1 = xRange(index)?.[1];
            return !Number.isFinite(x1) || x1! > range0;
        }) ?? 0;

    let xMaxIndex =
        findMaxIndex(0, length - 1, (index) => {
            const x0 = xRange(index)?.[0];
            return !Number.isFinite(x0) || x0! < range1;
        }) ?? length - 1;
    xMaxIndex = Math.min(xMaxIndex + 1, length);

    return [xMinIndex, xMaxIndex];
}
