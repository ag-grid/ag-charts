import { Logger } from '../../util/logger';
import type {
    AgCartesianSeriesOptions,
    AgPolarSeriesOptions,
    AgHierarchySeriesOptions,
    AgChartOptions,
} from '../agChartOptions';
import type { SeriesGrouping } from '../series/seriesStateManager';
import { isStackableSeries, isGroupableSeries } from '../factory/seriesTypes';
import { windowValue } from '../../util/window';

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

    for (const [, group] of Object.entries(groupMap)) {
        const type = group.opts[0]?.type ?? 'line';
        if (anyStacked[type] !== true) continue;

        group.type = 'stack' as any;
    }

    return result;
}

const DEBUG = () => [true, 'opts'].includes(windowValue('agChartsDebug') as any);

/**
 * Transforms provided series options array into an array containing series options which are compatible with standalone charts series options.
 */
export function processSeriesOptions(_opts: AgChartOptions, seriesOptions: SeriesOptions[]) {
    const result: SeriesOptions[] = [];

    const preprocessed = seriesOptions.map((series: SeriesOptions & { stacked?: boolean; grouped?: boolean }) => {
        // Change the default for bar/columns when yKey is used to be grouped rather than stacked.
        if (isGroupableSeries(series.type ?? '') && !(series.stacked && isStackableSeries(series.type ?? ''))) {
            return { ...series, grouped: series.grouped ?? true };
        }

        return series;
    });

    const grouped = groupSeriesByType(preprocessed);
    const groupCount = grouped.reduce((result, next) => {
        if (next.type === 'ungrouped') return result;

        const seriesType = next.opts[0].type ?? 'line';
        result[seriesType] ??= 0;
        result[seriesType] += next.type === 'stack' ? 1 : next.opts.length;
        return result;
    }, {} as Record<string, number>);

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

    if (DEBUG()) {
        Logger.debug('processSeriesOptions() - series grouping: ', grouped);
    }

    for (const group of grouped) {
        const seriesType = String(group.opts[0].type);
        const { grouped, stacked } = group.opts[0] as any;
        const groupable = isGroupableSeries(seriesType);
        const stackable = isStackableSeries(seriesType);
        if (stacked && !stackable) {
            Logger.warn(`unexpected stacking of series type: ${seriesType}`);
        }
        if (grouped && !groupable) {
            Logger.warn(`unexpected grouping of series type: ${seriesType}`);
        }

        if (isGroupableSeries(seriesType) || isStackableSeries(seriesType)) {
            result.push(...addSeriesGroupingMeta(group));
        } else {
            result.push(...group.opts);
        }
    }

    return result;
}
