import type { AgChartOptions } from 'ag-charts-types';

import { jsonDiff } from '../../util/json';
import type { ISeries } from '../series/seriesTypes';

const MATCHING_KEYS = [
    'direction',
    'xKey',
    'yKey',
    'sizeKey',
    'angleKey',
    'radiusKey',
    'normalizedTo',
    'stacked',
    'grouped',
    'stackGroup',
];

export function matchSeriesOptions<S extends ISeries<any, any>>(
    series: S[],
    optSeries: NonNullable<AgChartOptions['series']>,
    oldOptsSeries?: AgChartOptions['series']
) {
    const generateKey = (type: string | undefined, i: any) => {
        const result = [type];
        for (const key of MATCHING_KEYS) {
            if (key in i && i[key] != null) result.push(`${key}=${i[key]}`);
        }
        return result.join(';');
    };

    const seriesMap = new Map<string, [S, number][]>();
    let idx = 0;
    for (const s of series) {
        const key = generateKey(s.type, s.properties);
        if (!seriesMap.has(key)) {
            seriesMap.set(key, []);
        }
        seriesMap.get(key)?.push([s, idx++]);
    }

    const optsMap = new Map<string, NonNullable<AgChartOptions['series']>[number][]>();
    for (const o of optSeries) {
        const key = generateKey(o.type, o);
        if (!optsMap.has(key)) {
            optsMap.set(key, []);
        }
        optsMap.get(key)?.push(o);
    }

    const overlap = [...seriesMap.keys()].some((k) => optsMap.has(k));

    // If not overlapping, full recreation is needed.
    if (!overlap) {
        return { status: 'no-overlap' as const, oldKeys: seriesMap.keys(), newKeys: optsMap.keys() };
    }

    const changes = [];
    // optSeries is our desired target state, so base our working on it's ordering.
    let targetIdx = -1;
    for (const [key, optArray] of optsMap.entries()) {
        for (const opts of optArray) {
            targetIdx++;

            const seriesArray = seriesMap.get(key);
            if (seriesArray == null || seriesArray.length < 1) {
                changes.push({ opts, idx: targetIdx, status: 'add' as const });
                seriesMap.delete(key);
                continue;
            }

            const [outputSeries, outputIdx] = seriesArray.shift()!;

            const previousOpts = oldOptsSeries?.[outputIdx] ?? {};
            const diff = jsonDiff(previousOpts, opts ?? {}) as any;

            const { groupIndex, stackIndex } = diff?.seriesGrouping ?? {};
            if (groupIndex != null || stackIndex != null) {
                changes.push({ opts, series: outputSeries, diff, idx: outputIdx, status: 'series-grouping' as const });
            } else if (diff) {
                changes.push({ opts, series: outputSeries, diff, idx: outputIdx, status: 'update' as const });
            } else {
                changes.push({ opts, series: outputSeries, idx: outputIdx, status: 'no-op' as const });
            }

            if (seriesArray.length === 0) {
                seriesMap.delete(key);
            }
        }
    }
    for (const seriesArray of seriesMap.values()) {
        for (const [outputSeries, outputIdx] of seriesArray) {
            changes.push({ series: outputSeries, idx: outputIdx, status: 'remove' as const });
        }
    }

    return { status: 'overlap' as const, changes };
}
