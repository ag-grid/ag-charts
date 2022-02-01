import {
    AgBarSeriesOptions,
    AgBarSeriesLabelOptions,
    AgChartOptions,
    AgAreaSeriesOptions,
    AgHistogramSeriesOptions,
    AgLineSeriesOptions,
    AgPieSeriesOptions,
    AgScatterSeriesOptions,
    AgTreemapSeriesOptions,
    AgOHLCSeriesOptions,
} from '../agChartOptions';
import { BarLabelPlacement } from '../series/cartesian/barSeries';

type Transforms<Source, Result extends {[R in keyof Source]?: any}, Keys extends keyof Source & keyof Result = keyof Source & keyof Result> = {
    [Property in Keys]: (p: Source[Property], src: Source) => Result[Property];
};

export function transform<
    I,
    R extends {[RKey in keyof I]: O[RKey]},
    T extends Transforms<I, R>,
    O extends {[OKey in keyof T]: ReturnType<T[OKey]>} & {[OKey in Exclude<keyof I, keyof T>]: I[OKey] },
>(input: I, transforms: T): O {
    const result: Partial<O> = {};

    for (const p in input) {
        const t = (transforms as any)[p] || ((x: any) => x);
        (result as any)[p] = t(input[p], input);
    }

    return result as O;
}

function is2dArray<E>(input: E[]|E[][]): input is E[][] {
    return input != null && input instanceof Array && input[0] instanceof Array;
}

function yNamesMapping(p: string[] | Record<string, string> | undefined, src: AgBarSeriesOptions): Record<string, string> {
    if (p == null) { return {}; }

    if (!(p instanceof Array)) { return p; }

    const yKeys = src.yKeys;
    if (yKeys == null || is2dArray(yKeys)) {
        throw new Error('AG Charts - yNames and yKeys mismatching configuration.');
    }

    const result: Record<string, string> = {};
    yKeys.forEach((k, i) => {
        result[k] = p[i];
    });

    return result;
}

function yKeysMapping(p: string[ ]| string[][] | undefined, src: AgBarSeriesOptions): string[][] {
    if (p == null) { return [[]]; }

    if (is2dArray(p)) {
        return p;
    }

    return src.grouped ? p.map(v => [v]) : [p];
}

function labelMapping(p: AgBarSeriesLabelOptions | undefined): Omit<AgBarSeriesLabelOptions, 'placement'> & { placement?: BarLabelPlacement } | undefined {
    if (p == null) { return undefined; }

    const { placement } = p;
    return {
        ...p,
        placement:
            placement === 'inside' ? BarLabelPlacement.Inside :
            placement === 'outside' ? BarLabelPlacement.Outside :
            undefined,
    }
}

export function barSeriesTransform<T extends AgBarSeriesOptions>(options: T): T {
    let result = {
        ...options,
        yKeys: options.yKeys || [options.yKey],
    };
    delete result['yKey'];

    return transform(result, {
        yNames: yNamesMapping,
        yKeys: yKeysMapping,
        label: labelMapping,
    }) as T;
}

type SeriesTypes = NonNullable<AgChartOptions['series']>[number];
type SeriesType<T extends SeriesTypes['type']> = 
    T extends 'area' ? AgAreaSeriesOptions :
    T extends 'bar' ? AgBarSeriesOptions :
    T extends 'column' ? AgBarSeriesOptions :
    T extends 'histogram' ? AgHistogramSeriesOptions :
    T extends 'line' ? AgLineSeriesOptions :
    T extends 'pie' ? AgPieSeriesOptions :
    T extends 'scatter' ? AgScatterSeriesOptions :
    T extends 'treemap' ? AgTreemapSeriesOptions :
    T extends 'ohlc' ? AgOHLCSeriesOptions :
    never;
function identityTransform<T>(input: T): T { return input; };

const SERIES_TRANSFORMS: {
    [ST in NonNullable<SeriesTypes['type']>]: <T extends SeriesType<ST>>(p: T) => T
} = {
    area: identityTransform,
    bar: barSeriesTransform,
    column: barSeriesTransform,
    histogram: identityTransform,
    line: identityTransform,
    ohlc: identityTransform,
    pie: identityTransform,
    scatter: identityTransform,
    treemap: identityTransform,
};

export function applySeriesTransform<S extends SeriesTypes>(options: S): S {
    const type = options.type;
    const transform = SERIES_TRANSFORMS[type || 'line'] as Function;
    return transform(options);
}
