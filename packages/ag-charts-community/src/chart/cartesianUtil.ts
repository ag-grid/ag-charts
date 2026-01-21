import { CartesianSeries } from './series/cartesian/cartesianSeries';
import type { DatumIndexType, IProperties, ISeries } from './series/seriesTypes';

export function stackCartesianSeries(series: ISeries<DatumIndexType, unknown, IProperties>[]) {
    const seriesGroups = new Map<string, CartesianSeries<any>[]>();

    for (const s of series) {
        if (!(s instanceof CartesianSeries)) continue;

        const stackCount = s.seriesGrouping?.stackCount ?? 0;
        const groupIndex = stackCount > 0 ? s.seriesGrouping?.groupIndex : undefined;
        if (groupIndex == null) {
            s.seriesBelowStackContext = undefined;
            s.createStackContext();

            continue;
        }

        const groupKey = `${s.type}-${groupIndex}`;
        let group = seriesGroups.get(groupKey);
        if (group == null) {
            group = [];
            seriesGroups.set(groupKey, group);
        }

        group.push(s);
    }

    for (const group of seriesGroups.values()) {
        // For each group, we need to ensure that the series are in the correct order.
        group.sort((a, b) => (a.seriesGrouping?.stackIndex ?? 0) - (b.seriesGrouping?.stackIndex ?? 0));

        let seriesBelowStackContext: any;
        for (const s of group) {
            s.seriesBelowStackContext = seriesBelowStackContext;
            seriesBelowStackContext = s.createStackContext();
        }
    }
}
