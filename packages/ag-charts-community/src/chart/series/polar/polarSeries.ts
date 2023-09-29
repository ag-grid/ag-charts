import type { ModuleContext } from '../../../module/moduleContext';
import { StateMachine } from '../../../motion/states';
import type { BBox } from '../../../scene/bbox';
import type { PointLabelDatum } from '../../../util/labelPlacement';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataModel, ProcessedData } from '../../data/dataModel';
import type { SeriesNodeDataContext, SeriesNodeDatum } from '../series';
import { Series, SeriesNodePickMode } from '../series';

type PolarAnimationState = 'empty' | 'ready' | 'waiting' | 'clearing';
type PolarAnimationEvent = 'update' | 'updateData' | 'clear';
type PolarAnimationData = { duration: number };

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
    protected animationState: StateMachine<PolarAnimationState, PolarAnimationEvent>;

    constructor({
        moduleCtx,
        useLabelLayer = false,
        pickModes = [SeriesNodePickMode.EXACT_SHAPE_MATCH],
        canHaveAxes = false,
    }: {
        moduleCtx: ModuleContext;
        useLabelLayer?: boolean;
        pickModes?: SeriesNodePickMode[];
        canHaveAxes?: boolean;
    }) {
        super({
            moduleCtx,
            useLabelLayer,
            pickModes,
            contentGroupVirtual: false,
            directionKeys: {
                [ChartAxisDirection.X]: ['angleKey'],
                [ChartAxisDirection.Y]: ['radiusKey'],
            },
            directionNames: {
                [ChartAxisDirection.X]: ['angleName'],
                [ChartAxisDirection.Y]: ['radiusName'],
            },
            canHaveAxes,
        });

        this.animationState = new StateMachine('empty', {
            empty: {
                update: {
                    target: 'ready',
                    action: (data) => this.animateEmptyUpdateReady(data),
                },
            },
            ready: {
                updateData: {
                    target: 'waiting',
                },
                update: {
                    target: 'ready',
                    action: (data) => this.animateReadyUpdate(data),
                },
                highlight: {
                    target: 'ready',
                    action: (data) => this.animateReadyHighlight(data),
                },
                highlightMarkers: {
                    target: 'ready',
                    action: (data) => this.animateReadyHighlightMarkers(data),
                },
                resize: {
                    target: 'ready',
                    action: (data) => this.animateReadyResize(data),
                },
                clear: {
                    target: 'clearing',
                },
            },
            waiting: {
                update: {
                    target: 'ready',
                    action: (data) => this.animateWaitingUpdateReady(data),
                },
            },
            clearing: {
                update: {
                    target: 'empty',
                    action: (data) => this.animateClearingUpdateEmpty(data),
                },
            },
        });
    }

    getLabelData(): PointLabelDatum[] {
        return [];
    }

    computeLabelsBBox(_options: { hideWhenNecessary: boolean }, _seriesRect: BBox): BBox | null | Promise<BBox | null> {
        return null;
    }

    protected animateEmptyUpdateReady(_data: PolarAnimationData) {
        // Override point for sub-classes.
    }

    protected animateReadyUpdate(_data: PolarAnimationData) {
        // Override point for sub-classes.
    }

    protected animateWaitingUpdateReady(_data: PolarAnimationData) {
        // Override point for sub-classes.
    }

    protected animateReadyHighlight(_data: unknown) {
        // Override point for sub-classes.
    }

    protected animateReadyHighlightMarkers(_data: unknown) {
        // Override point for sub-classes.
    }

    protected animateReadyResize(_data: PolarAnimationData) {
        // Override point for sub-classes.
    }

    protected animateClearingUpdateEmpty(_data: PolarAnimationData) {
        // Override point for sub-classes.
    }

    protected animationTransitionClear() {
        this.animationState.transition('clear', this.getAnimationData());
    }

    private getAnimationData(seriesRect?: BBox) {
        return { seriesRect };
    }
}
