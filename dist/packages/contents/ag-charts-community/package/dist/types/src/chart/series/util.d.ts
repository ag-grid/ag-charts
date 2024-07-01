import type { ChartAxis } from '../chartAxis';
import type { ProcessedDataDef } from '../data/dataModel';
export declare function convertValuesToScaleByDefs<T extends string>({ defs, values, xAxis, yAxis, }: {
    defs: [string, ProcessedDataDef][];
    values: Record<T, unknown>;
    xAxis: ChartAxis | undefined;
    yAxis: ChartAxis | undefined;
}): Record<T, number>;
