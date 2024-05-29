import type { ModuleContext } from '../../../module/moduleContext';
import type { AnimationValue } from '../../../motion/animation';
import { resetMotion } from '../../../motion/resetMotion';
import type { InteractionRange } from '../../../options/chart/types';
import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import type { Node } from '../../../scene/node';
import { Selection } from '../../../scene/selection';
import { Text } from '../../../scene/shape/text';
import type { PointLabelDatum } from '../../../scene/util/labelPlacement';
import { StateMachine } from '../../../util/stateMachine';
import type { ChartAnimationPhase } from '../../chartAnimationPhase';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { DataModelSeries } from '../dataModelSeries';
import { SeriesNodePickMode } from '../series';
import type { SeriesProperties } from '../seriesProperties';
import type { SeriesNodeDatum } from '../seriesTypes';

export type PolarAnimationState = 'empty' | 'ready' | 'waiting' | 'clearing';
export type PolarAnimationEvent =
    | 'update'
    | 'updateData'
    | 'highlight'
    | 'highlightMarkers'
    | 'resize'
    | 'clear'
    | 'reset'
    | 'skip';
export type PolarAnimationData = { duration?: number };

type PolarSeriesProperties = {
    angleKey: string;
    angleName?: string;
    radiusKey?: string;
    radiusName?: string;
};

export abstract class PolarSeries<
    TDatum extends SeriesNodeDatum,
    TProps extends SeriesProperties<any> & PolarSeriesProperties,
    TNode extends Node,
> extends DataModelSeries<TDatum, TProps> {
    protected itemGroup = this.contentGroup.appendChild(new Group());
    public getItemNodes(): TNode[] {
        return this.itemGroup.children as TNode[];
    }

    protected nodeData: TDatum[] = [];
    public override getNodeData(): TDatum[] | undefined {
        return this.nodeData;
    }

    protected itemSelection: Selection<TNode, TDatum> = Selection.select(
        this.itemGroup,
        () => this.nodeFactory(),
        false
    );
    protected labelSelection: Selection<Text, TDatum> = Selection.select(this.labelGroup, Text, false);
    protected highlightSelection: Selection<TNode, TDatum> = Selection.select(this.highlightGroup, () =>
        this.nodeFactory()
    );

    animationResetFns?: {
        item?: (node: TNode, datum: TDatum) => AnimationValue & Partial<TNode>;
        label?: (node: Text, datum: TDatum) => AnimationValue & Partial<Text>;
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
        pickModes = [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
        canHaveAxes = false,
        defaultTooltipRange,
        animationResetFns,
        ...opts
    }: {
        moduleCtx: ModuleContext;
        useLabelLayer?: boolean;
        pickModes?: SeriesNodePickMode[];
        canHaveAxes?: boolean;
        defaultTooltipRange: InteractionRange;
        animationResetFns?: {
            item?: (node: TNode, datum: TDatum) => AnimationValue & Partial<TNode>;
            label?: (node: Text, datum: TDatum) => AnimationValue & Partial<Text>;
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
            defaultTooltipRange,
        });

        this.showFocusBox = false;
        this.itemGroup.zIndexSubOrder = [() => this._declarationOrder, 1];
        this.animationResetFns = animationResetFns;

        this.animationState = new StateMachine<PolarAnimationState, PolarAnimationEvent>(
            'empty',
            {
                empty: {
                    update: {
                        target: 'ready',
                        action: (data) => this.animateEmptyUpdateReady(data),
                    },
                    reset: 'empty',
                    skip: 'ready',
                },
                ready: {
                    updateData: 'waiting',
                    clear: 'clearing',
                    highlight: (data) => this.animateReadyHighlight(data),
                    highlightMarkers: (data) => this.animateReadyHighlightMarkers(data),
                    resize: (data) => this.animateReadyResize(data),
                    reset: 'empty',
                    skip: 'ready',
                },
                waiting: {
                    update: {
                        target: 'ready',
                        action: (data) => this.animateWaitingUpdateReady(data),
                    },
                    reset: 'empty',
                    skip: 'ready',
                },
                clearing: {
                    update: {
                        target: 'empty',
                        action: (data) => this.animateClearingUpdateEmpty(data),
                    },
                    reset: 'empty',
                    skip: 'ready',
                },
            },
            () => this.checkProcessedDataAnimatable()
        );
    }

    override resetAnimation(phase: ChartAnimationPhase): void {
        if (phase === 'initial') {
            this.animationState.transition('reset');
        } else if (phase === 'ready') {
            this.animationState.transition('skip');
        }
    }

    protected abstract nodeFactory(): TNode;

    getInnerRadius(): number {
        return 0;
    }

    surroundingRadius?: number;

    getLabelData(): PointLabelDatum[] {
        return [];
    }

    computeLabelsBBox(_options: { hideWhenNecessary: boolean }, _seriesRect: BBox): BBox | null | Promise<BBox | null> {
        return null;
    }

    protected resetAllAnimation() {
        const { item, label } = this.animationResetFns ?? {};

        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        if (item) {
            resetMotion([this.itemSelection, this.highlightSelection], item);
        }
        if (label) {
            resetMotion([this.labelSelection], label);
        }
        this.itemSelection.cleanup();
        this.labelSelection.cleanup();
        this.highlightSelection.cleanup();
    }

    protected animateEmptyUpdateReady(_data: PolarAnimationData) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation();
    }

    protected animateWaitingUpdateReady(_data: PolarAnimationData) {
        this.ctx.animationManager.skipCurrentBatch();
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
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation();
    }

    protected animationTransitionClear() {
        this.animationState.transition('clear', this.getAnimationData());
    }

    private getAnimationData(seriesRect?: BBox) {
        return { seriesRect };
    }
}
