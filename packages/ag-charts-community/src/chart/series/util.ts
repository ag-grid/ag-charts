import type { ChartAxis } from '../chartAxis';
import type { ProcessedDataDef } from '../data/dataModel';

export function convertValuesToScaleByDefs<T extends string>({
    defs,
    values,
    xAxis,
    yAxis,
}: {
    defs: [string, ProcessedDataDef[]][];
    values: Record<T, unknown>;
    xAxis: ChartAxis | undefined;
    yAxis: ChartAxis | undefined;
}): Record<T, number> {
    if (!(xAxis && yAxis)) {
        throw new Error('Axes must be defined');
    }
    const result: Record<string, number> = {};
    for (const [searchId, [{ def }]] of defs) {
        if (Object.hasOwn(values, searchId)) {
            const { scale } = def.type === 'key' ? xAxis : yAxis;
            result[searchId] = Math.round(scale.convert((values as any)[searchId]));
        }
    }
    return result;
}
