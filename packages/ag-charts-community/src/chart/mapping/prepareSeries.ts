import type {
    AgCartesianSeriesOptions,
    AgChartOptions,
    AgHierarchySeriesOptions,
    AgPolarSeriesOptions,
} from '../../options/agChartOptions';
import { Debug } from '../../util/debug';
import { Logger } from '../../util/logger';
import { isGroupableSeries, isSeriesStackedByDefault, isStackableSeries } from '../factory/seriesTypes';
import type { SeriesGrouping } from '../series/seriesStateManager';

export type SeriesOptions = AgCartesianSeriesOptions | AgPolarSeriesOptions | AgHierarchySeriesOptions;

/**
 * Groups the series options objects if they are of type `column` or `bar` and places them in an array at the index where the first instance of this series type was found.
 * Returns an array of arrays containing the ordered and grouped series options objects.
 */
export function groupSeriesByType(seriesOptions: SeriesOptions[]) {
    const groupMap: Record<string, { type: 'group'; opts: SeriesOptions[] }> = {};
    const stackMap: Record<string, { type: 'stack'; opts: SeriesOptions[] }> = {};
    const anyStacked: Record<string, boolean> = {};
    const defaultUnstackedGroup = 'default-ag-charts-group';

    const result = [];
    for (const s of seriesOptions) {
        const type = s.type ?? 'line';

        const stackable = isStackableSeries(type);
        const groupable = isGroupableSeries(type);
        if (!stackable && !groupable) {
            // No need to use index for these cases.
            result.push({ type: 'ungrouped' as const, opts: [s] });
            continue;
        }

        const { stacked: sStacked, stackGroup: sStackGroup, grouped: sGrouped = undefined, xKey } = s as any;

        const stacked = sStackGroup != null || sStacked === true;
        anyStacked[type] ??= false;
        anyStacked[type] ||= stacked && stackable;
        const grouped = sGrouped === true;
        let groupingKey = [sStackGroup ?? (sStacked === true ? 'stacked' : undefined), grouped ? 'grouped' : undefined]
            .filter((v) => v != null)
            .join('-');

        if (!groupingKey) {
            groupingKey = defaultUnstackedGroup;
        }

        const indexKey = `${type}-${xKey}-${groupingKey}`;
        if (stacked && stackable) {
            const updated = (stackMap[indexKey] ??= { type: 'stack', opts: [] });
            if (updated.opts.length === 0) result.push(updated);
            updated.opts.push(s);
        } else if (grouped && groupable) {
            const updated = (groupMap[indexKey] ??= { type: 'group', opts: [] });
            if (updated.opts.length === 0) result.push(updated);
            updated.opts.push(s);
        } else {
            result.push({ type: 'ungrouped' as const, opts: [s] });
        }
    }

    if (!Object.values(anyStacked).some((v) => v)) {
        return result;
    }

    return result;
}

/**
 * Transforms provided series options array into an array containing series options which are compatible with standalone charts series options.
 */
export function processSeriesOptions(_opts: AgChartOptions, seriesOptions: SeriesOptions[]) {
    const result: SeriesOptions[] = [];

    const uniqueIds = new Map<string, number>();
    const checkId = (id: string | undefined, index: number): number | undefined => {
        if (id === undefined) return undefined;
        const firstIndex = uniqueIds.get(id);
        if (firstIndex === undefined) {
            uniqueIds.set(id, index);
        }
        return firstIndex;
    };

    type BarOptions = { stacked?: boolean; grouped?: boolean };
    const preprocessed = seriesOptions.map((series: SeriesOptions & BarOptions, index: number) => {
        // Change the default for bar/columns when yKey is used to be grouped rather than stacked.
        const sType = series.type ?? 'line';
        const groupable = isGroupableSeries(sType);
        const stackable = isStackableSeries(sType);
        const stackedByDefault = isSeriesStackedByDefault(sType);
        const idMatchIndex = checkId(series.id, index);

        if (series.grouped && !groupable) {
            Logger.warnOnce(`unsupported grouping of series type: ${sType}`);
        }

        if (series.stacked && !stackable) {
            Logger.warnOnce(`unsupported stacking of series type: ${sType}`);
        }

        // AG-10089 Ignore duplicate user input id values:
        if (idMatchIndex !== undefined) {
            Logger.warnOnce(
                `series[${index}].id "${series.id}" ignored because it duplicates series[${idMatchIndex}].id`
            );
            series = { ...series };
            delete series.id;
        }

        if (!groupable && !stackable) {
            return series;
        }

        let stacked = false;
        let grouped = false;
        if (series.stacked === undefined && series.grouped === undefined) {
            stacked = stackable && stackedByDefault;
            grouped = groupable && !stacked;
        } else if (series.stacked === undefined) {
            stacked = stackable && stackedByDefault && !(series.grouped && groupable);
            grouped = groupable && !stacked && !!series.grouped;
        } else if (series.grouped === undefined) {
            stacked = stackable && series.stacked;
            grouped = groupable && !stacked;
        } else {
            stacked = stackable && series.stacked;
            grouped = groupable && !stacked && series.grouped;
        }

        return { ...series, stacked, grouped };
    });

    const grouped = groupSeriesByType(preprocessed);
    const groupCount = grouped.reduce(
        (result, next) => {
            if (next.type === 'ungrouped') return result;

            const seriesType = next.opts[0].type ?? 'line';
            result[seriesType] ??= 0;
            result[seriesType] += next.type === 'stack' ? 1 : next.opts.length;
            return result;
        },
        {} as Record<string, number>
    );

    const groupIdx: Record<string, number> = {};
    const addSeriesGroupingMeta = (group: { type: 'group' | 'stack' | 'ungrouped'; opts: SeriesOptions[] }) => {
        let stackIdx = 0;
        const seriesType = group.opts[0].type ?? 'line';
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
        } else {
            for (const opts of group.opts) {
                (opts as any).seriesGrouping = undefined;
            }
        }

        return group.opts;
    };

    Debug.create(true, 'opts')('processSeriesOptions() - series grouping: ', grouped);

    for (const group of grouped) {
        const seriesType = group.opts[0].type ?? 'line';
        if (isGroupableSeries(seriesType) || isStackableSeries(seriesType)) {
            result.push(...addSeriesGroupingMeta(group));
        } else {
            result.push(...group.opts);
        }
    }

    return result;
}
