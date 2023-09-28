import type { ModuleContext } from '../../../module/moduleContext';
import type { PointLabelDatum } from '../../../util/labelPlacement';
import type { HierarchyChart } from '../../hierarchyChart';
import type { SeriesNodeDataContext, SeriesNodeDatum } from '../series';
import { Series, SeriesNodePickMode } from '../series';

export abstract class HierarchySeries<S extends SeriesNodeDatum> extends Series<SeriesNodeDataContext<S>> {
    chart?: HierarchyChart;

    constructor(moduleCtx: ModuleContext) {
        super({ moduleCtx, pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH] });
    }

    getLabelData(): PointLabelDatum[] {
        return [];
    }
}
