import type { ChartOptions } from '../../module/optionModules';
import type {
    AgCartesianSeriesOptions,
    AgHierarchySeriesOptions,
    AgPolarSeriesOptions,
} from '../../options/agChartOptions';
import { Debug } from '../../util/debug';
import { isGroupableSeries, isStackableSeries } from '../factory/seriesTypes';
import type { SeriesGrouping } from '../series/seriesStateManager';

export type SeriesOptions = AgCartesianSeriesOptions | AgPolarSeriesOptions | AgHierarchySeriesOptions;

/**
 * Groups the series options objects if they are of type `column` or `bar` and places them in an array at the index where the first instance of this series type was found.
 * Returns an array of arrays containing the ordered and grouped series options objects.
 */
export function groupSeriesByType(seriesOptions: SeriesOptions[]) {
    const groupMap: Record<string, { type: 'group'; opts: SeriesOptions[] }> = {};
    const stackMap: Record<string, { type: 'stack'; opts: SeriesOptions[] }> = {};
    const defaultUnstackedGroup = 'default-ag-charts-group';

    const result = [];
    for (const s of seriesOptions) {
        const { stacked, stackGroup, grouped, xKey } = s as any;

        if (!stacked && !grouped) {
            // No need to use index for these cases.
            result.push({ type: 'ungrouped' as const, opts: [s] });
            continue;
        }

        const groupingKey = (stacked ? stackGroup ?? 'stacked' : 'grouped') ?? defaultUnstackedGroup;

        const indexKey = `${s.type}-${xKey}-${groupingKey}`;
        if (stacked) {
            const updated = (stackMap[indexKey] ??= { type: 'stack', opts: [] });
            if (updated.opts.length === 0) result.push(updated);
            updated.opts.push(s);
        } else if (grouped) {
            const updated = (groupMap[indexKey] ??= { type: 'group', opts: [] });
            if (updated.opts.length === 0) result.push(updated);
            updated.opts.push(s);
        } else {
            result.push({ type: 'ungrouped' as const, opts: [s] });
        }
    }

    return result;
}

/**
 * Transforms provided series options array into an array containing series options which are compatible with standalone charts series options.
 */
export function processSeriesOptions(chartOptions: ChartOptions) {
    const preprocessed = chartOptions.processedOptions!.series!;

    const result: SeriesOptions[] = [];
    const grouped = groupSeriesByType(preprocessed);
    const groupCount = grouped.reduce(
        (result, next) => {
            if (next.type === 'ungrouped') return result;

            const seriesType = next.opts[0].type!;
            result[seriesType] ??= 0;
            result[seriesType] += next.type === 'stack' ? 1 : next.opts.length;
            return result;
        },
        {} as Record<string, number>
    );

    const groupIdx: Record<string, number> = {};
    const addSeriesGroupingMeta = (group: { type: 'group' | 'stack' | 'ungrouped'; opts: SeriesOptions[] }) => {
        let stackIdx = 0;
        const seriesType = group.opts[0].type!;
        groupIdx[seriesType] ??= 0;

        if (group.type === 'stack') {
            for (const opts of group.opts) {
                (opts as any).seriesGrouping = {
                    groupIndex: groupIdx[seriesType],
                    groupCount: groupCount[seriesType],
                    stackIndex: stackIdx++,
                    stackCount: group.opts.length,
                } as SeriesGrouping;
            }
            groupIdx[seriesType]++;
        } else if (group.type === 'group') {
            for (const opts of group.opts) {
                (opts as any).seriesGrouping = {
                    groupIndex: groupIdx[seriesType],
                    groupCount: groupCount[seriesType],
                    stackIndex: 0,
                    stackCount: 0,
                } as SeriesGrouping;
                groupIdx[seriesType]++;
            }
        }

        return group.opts;
    };

    Debug.create(true, 'opts')('processSeriesOptions() - series grouping: ', grouped);

    for (const group of grouped) {
        const seriesType = group.opts[0].type;
        if (isGroupableSeries(seriesType) || isStackableSeries(seriesType)) {
            result.push(...addSeriesGroupingMeta(group));
        } else {
            result.push(...group.opts);
        }
    }

    return result;
}
