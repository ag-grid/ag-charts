import type { AgChartOptions } from '../../options/agChartOptions';
import { jsonDiff } from '../../util/json';
import type { ISeries } from '../series/seriesTypes';

export function matchSeriesOptions<S extends ISeries<any>>(
    series: S[],
    processedOptions: AgChartOptions,
    optSeries: NonNullable<AgChartOptions['series']>
) {
    const keysToConsider = ['direction', 'xKey', 'yKey', 'sizeKey', 'angleKey', 'normalizedTo'];

    const generateKey = (type: string | undefined, i: any) => {
        const result = [type];
        for (const key of keysToConsider) {
            if (key in i && i[key] != null) result.push(`${key}=${i[key]}`);
        }
        return result.join(';');
    };

    const seriesMap = new Map<string, [S, number]>();
    let idx = 0;
    for (const s of series) {
        seriesMap.set(generateKey(s.type, s.properties), [s, idx++]);
    }

    const optsMap = new Map<string, NonNullable<AgChartOptions['series']>[number]>();
    for (const o of optSeries) {
        optsMap.set(generateKey(o.type, o), o);
    }

    const overlap = [...seriesMap.keys()].some((k) => optsMap.has(k));

    // If not overlapping, full recreation is needed.
    if (!overlap) {
        return { status: 'no-overlap' as const, oldKeys: seriesMap.keys(), newKeys: optsMap.keys() };
    }

    const changes = [];
    // optSeries is our desired target state, so base our working on it's ordering.
    let targetIdx = -1;
    for (const [key, opts] of optsMap.entries()) {
        targetIdx++;

        if (!seriesMap.has(key)) {
            changes.push({ opts, idx: targetIdx, status: 'add' as const });
            continue;
        }

        const [series, idx] = seriesMap.get(key)!;

        const previousOpts = processedOptions.series?.[idx] ?? {};
        const diff = jsonDiff(previousOpts, opts ?? {}) as any;

        // Short-circuit if series grouping has changed.
        if (diff && 'seriesGrouping' in diff) return { status: 'series-grouping-changed' as const };

        if (diff) {
            changes.push({ opts, series, diff, idx, status: 'update' as const });
        } else {
            changes.push({ opts, series, idx, status: 'no-op' as const });
        }
        seriesMap.delete(key);
    }
    for (const [series, idx] of seriesMap.values()) {
        changes.push({ series, idx, status: 'remove' as const });
    }

    return { status: 'overlap' as const, changes };
}
