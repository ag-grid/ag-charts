import type { ModuleContext } from '../../../module/moduleContext';
import type { PointLabelDatum } from '../../../util/labelPlacement';
import { SeriesNodeDatum, SeriesNodePickMode } from '../../chartSeries';
import type { HierarchyChart } from '../../hierarchyChart';
import { Series } from '../series';

export abstract class HierarchySeries<S extends SeriesNodeDatum> extends Series<S> {
    override chart?: HierarchyChart;

    constructor(moduleCtx: ModuleContext) {
        super({ moduleCtx, pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH] });
    }

    getLabelData(): PointLabelDatum[] {
        return [];
    }
}
