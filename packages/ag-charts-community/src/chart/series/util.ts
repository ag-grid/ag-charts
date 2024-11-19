import type { Point } from '../../scene/point';
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
