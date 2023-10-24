import type { ModuleContext } from '../../../module/moduleContext';
import type { PointLabelDatum } from '../../../util/labelPlacement';
import { Series, SeriesNodePickMode } from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';

export abstract class HierarchySeries<S extends SeriesNodeDatum> extends Series<S> {
    constructor(moduleCtx: ModuleContext) {
        super({ moduleCtx, pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH] });
    }

    getLabelData(): PointLabelDatum[] {
        return [];
    }
}
