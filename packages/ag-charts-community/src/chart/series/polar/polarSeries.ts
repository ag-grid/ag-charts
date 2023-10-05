import type { ModuleContext } from '../../../module/moduleContext';
import type { AnimationValue } from '../../../motion/animation';
import { resetMotion } from '../../../motion/resetMotion';
import { StateMachine } from '../../../motion/states';
import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import type { Node } from '../../../scene/node';
import { Selection } from '../../../scene/selection';
import { Text } from '../../../scene/shape/text';
import type { PointLabelDatum } from '../../../util/labelPlacement';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { DataModelSeries } from '../dataModelSeries';
import type { SeriesNodeDatum } from '../series';
import { SeriesNodePickMode } from '../series';

export type PolarAnimationState = 'empty' | 'ready' | 'waiting' | 'clearing';
export type PolarAnimationEvent = 'update' | 'updateData' | 'clear';
export type PolarAnimationData = { duration?: number };

export abstract class PolarSeries<S extends SeriesNodeDatum, TNode extends Node> extends DataModelSeries<S> {
    protected sectorGroup = this.contentGroup.appendChild(new Group());

    protected itemSelection: Selection<TNode, S> = Selection.select(this.sectorGroup, () => this.nodeFactory(), false);
    protected labelSelection: Selection<Text, S> = Selection.select(this.labelGroup, Text, false);
    protected highlightSelection: Selection<TNode, S> = Selection.select(this.highlightGroup, () => this.nodeFactory());

    animationResetFns?: {
        item?: (node: TNode, datum: S) => AnimationValue & Partial<TNode>;
        label?: (node: Text, datum: S) => AnimationValue & Partial<Text>;
    };

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

    protected animationState: StateMachine<PolarAnimationState, PolarAnimationEvent>;

    constructor({
        useLabelLayer = false,
        pickModes = [SeriesNodePickMode.EXACT_SHAPE_MATCH],
        canHaveAxes = false,
        animationResetFns,
        ...opts
    }: {
        moduleCtx: ModuleContext;
        useLabelLayer?: boolean;
        pickModes?: SeriesNodePickMode[];
        canHaveAxes?: boolean;
        animationResetFns?: {
            item?: (node: TNode, datum: S) => AnimationValue & Partial<TNode>;
            label?: (node: Text, datum: S) => AnimationValue & Partial<Text>;
        };
    }) {
        super({
            ...opts,
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

        this.sectorGroup.zIndexSubOrder = [() => this._declarationOrder, 1];
        this.animationResetFns = animationResetFns;

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

    protected abstract nodeFactory(): TNode;

    getLabelData(): PointLabelDatum[] {
        return [];
    }

    computeLabelsBBox(_options: { hideWhenNecessary: boolean }, _seriesRect: BBox): BBox | null | Promise<BBox | null> {
        return null;
    }

    protected resetAllAnimation() {
        const { item, label } = this.animationResetFns ?? {};
        if (item) {
            resetMotion([this.itemSelection], item);
        }
        if (label) {
            resetMotion([this.labelSelection], label);
        }
    }

    protected animateEmptyUpdateReady(_data: PolarAnimationData) {
        this.resetAllAnimation();
    }

    protected animateReadyUpdate(_data: PolarAnimationData) {
        this.resetAllAnimation();
    }

    protected animateWaitingUpdateReady(_data: PolarAnimationData) {
        this.resetAllAnimation();
    }

    protected animateReadyHighlight(_data: unknown) {
        const { item } = this.animationResetFns ?? {};
        if (item) {
            resetMotion([this.highlightSelection], item);
        }
    }

    protected animateReadyHighlightMarkers(_data: unknown) {
        // Override point for sub-classes.
    }

    protected animateReadyResize(_data: PolarAnimationData) {
        this.resetAllAnimation();
    }

    protected animateClearingUpdateEmpty(_data: PolarAnimationData) {
        this.resetAllAnimation();
    }

    protected animationTransitionClear() {
        this.animationState.transition('clear', this.getAnimationData());
    }

    private getAnimationData(seriesRect?: BBox) {
        return { seriesRect };
    }
}
