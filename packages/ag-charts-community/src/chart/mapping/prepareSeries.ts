import { jsonDiff } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import type { ISeries } from '../series/seriesTypes';

const MATCHING_KEYS = ['direction', 'xKey', 'yKey', 'sizeKey', 'angleKey', 'radiusKey', 'normalizedTo'];

export function matchSeriesOptions<S extends ISeries<any, any, any>>(
    series: S[],
    optSeries: NonNullable<AgChartOptions['series']>,
    oldOptsSeries?: AgChartOptions['series']
) {
    const generateKey = (type: string | undefined, i: any, opts?: any) => {
        const result = [type];
        for (const key of MATCHING_KEYS) {
            if (key in i && i[key] != null) result.push(`${key}=${i[key]}`);
        }
        if (opts?.seriesGrouping) {
            result.push(`seriesGrouping.groupId=${opts?.seriesGrouping.groupId}`);
        }
        return result.join(';');
    };

    const seriesMap = new Map<string, [S, number][]>();
    let idx = 0;
    for (const s of series) {
        const key = generateKey(s.type, s.properties, oldOptsSeries?.[idx]);
        if (!seriesMap.has(key)) {
            seriesMap.set(key, []);
        }
        seriesMap.get(key)?.push([s, idx++]);
    }

    const optsMap = new Map<string, [NonNullable<AgChartOptions['series']>[number], number][]>();
    idx = 0;
    for (const o of optSeries) {
        const key = generateKey(o.type, o, o);
        if (!optsMap.has(key)) {
            optsMap.set(key, []);
        }
        optsMap.get(key)?.push([o, idx++]);
    }

    const overlap = [...seriesMap.keys()].some((k) => optsMap.has(k));

    // If not overlapping, full recreation is needed.
    if (!overlap) {
        return { status: 'no-overlap' as const, oldKeys: seriesMap.keys(), newKeys: optsMap.keys() };
    }

    const changes = [];
    // optSeries is our desired target state, so base our working on it's ordering.
    for (const [key, optsTuples] of optsMap.entries()) {
        for (const [opts, targetIdx] of optsTuples) {
            const seriesArray = seriesMap.get(key);
            if (seriesArray == null || seriesArray.length < 1) {
                changes.push({ opts, targetIdx, idx: targetIdx, status: 'add' as const });
                seriesMap.delete(key);
                continue;
            }

            const [outputSeries, currentIdx] = seriesArray.shift()!;

            const previousOpts = oldOptsSeries?.[currentIdx] ?? {};
            const diff = jsonDiff(previousOpts, opts ?? {}) as any;

            const { groupIndex, stackIndex } = diff?.seriesGrouping ?? {};
            if (groupIndex != null || stackIndex != null) {
                changes.push({
                    opts,
                    series: outputSeries,
                    diff,
                    targetIdx,
                    idx: currentIdx,
                    status: 'series-grouping' as const,
                });
            } else if (diff) {
                changes.push({
                    opts,
                    series: outputSeries,
                    diff,
                    targetIdx,
                    idx: currentIdx,
                    status: 'update' as const,
                });
            } else {
                changes.push({ opts, series: outputSeries, targetIdx, idx: currentIdx, status: 'no-op' as const });
            }

            if (seriesArray.length === 0) {
                seriesMap.delete(key);
            }
        }
    }
    for (const seriesArray of seriesMap.values()) {
        for (const [outputSeries, currentIdx] of seriesArray) {
            changes.push({ series: outputSeries, idx: currentIdx, targetIdx: -1, status: 'remove' as const });
        }
    }

    return { status: 'overlap' as const, changes };
}
