import { Series, SeriesNodeDatum, SeriesNodeDataContext, SeriesNodePickMode } from '../series';
import { BBox } from '../../../scene/bbox';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { PointLabelDatum } from '../../../util/labelPlacement';
import { DataModel, ProcessedData } from '../../data/dataModel';

export abstract class PolarSeries<S extends SeriesNodeDatum> extends Series<SeriesNodeDataContext<S>> {
    /**
     * The center of the polar series (for example, the center of a pie).
     * If the polar chart has multiple series, all of them will have their
     * center set to the same value as a result of the polar chart layout.
     * The center coordinates are not supposed to be set by the user.
     */
    centerX: number = 0;
    centerY: number = 0;

    /**
     * The maximum radius the series can use.
     * This value is set automatically as a result of the polar chart layout
     * and is not supposed to be set by the user.
     */
    radius: number = 0;

    protected dataModel?: DataModel<any, any, any>;
    protected processedData?: ProcessedData<any>;

    constructor({ useLabelLayer = false }) {
        super({
            useLabelLayer,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            directionKeys: {
                [ChartAxisDirection.X]: ['angleKey'],
                [ChartAxisDirection.Y]: ['radiusKey'],
            },
        });
    }

    getLabelData(): PointLabelDatum[] {
        return [];
    }

    computeLabelsBBox(_options: { hideWhenNecessary: boolean }, _seriesRect: BBox): BBox | null {
        return null;
    }
}
