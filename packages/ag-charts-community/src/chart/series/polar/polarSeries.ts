import type { HighlightNodeDatum } from '../../../core/eventsHub';
import type { ModuleContext } from '../../../module/moduleContext';
import type { AnimationValue } from '../../../motion/animation';
import { resetMotion } from '../../../motion/resetMotion';
import { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { type Node, PointerEvents } from '../../../scene/node';
import { Selection } from '../../../scene/selection';
import { Path } from '../../../scene/shape/path';
import { Text } from '../../../scene/shape/text';
import { StateMachine } from '../../../util/stateMachine';
import type { ChartAnimationPhase } from '../../chartAnimationPhase';
import { ChartAxisDirection } from '../../chartAxisDirection';
import {
    DataModelSeries,
    type DataModelSeriesConstructorOpts,
    type DataModelSeriesNodeDataContext,
    type DataModelSeriesNodeDatum,
} from '../dataModelSeries';
import { type PickFocusInputs, SeriesNodePickMode } from '../series';
import { type SeriesProperties } from '../seriesProperties';
import type { ShapeFillBBox } from '../shapeUtil';
import { PolarZIndexMap } from './polarZIndexMap';

export type PolarAnimationState = 'empty' | 'ready' | 'waiting' | 'clearing';
export type PolarAnimationEvent = {
    update: PolarAnimationData;
    updateData: undefined;
    highlight: undefined;
    highlightMarkers: undefined;
    resize: PolarAnimationData;
    clear: { seriesRect?: BBox };
    reset: undefined;
    skip: undefined;
};
export type PolarAnimationData = { duration?: number };

type PolarSeriesProperties = {
    angleKey: string;
    angleName?: string;
    radiusKey?: string;
    radiusName?: string;
};

export const DEFAULT_POLAR_DIRECTION_KEYS = {
    [ChartAxisDirection.Angle]: ['angleKey' as const],
    [ChartAxisDirection.Radius]: ['radiusKey' as const],
};

export const DEFAULT_POLAR_DIRECTION_NAMES = {
    [ChartAxisDirection.Angle]: ['angleName' as const],
    [ChartAxisDirection.Radius]: ['radiusName' as const],
};

export type UnknownPolarSeries = PolarSeries<
    DataModelSeriesNodeDatum,
    object,
    SeriesProperties<object> & PolarSeriesProperties,
    Node
>;

export abstract class PolarSeries<
    TDatum extends DataModelSeriesNodeDatum & { legendItemValue?: string },
    TOpts extends object,
    TProps extends SeriesProperties<TOpts> & PolarSeriesProperties,
    TNode extends Node,
    TLabel = TDatum,
    TContext extends DataModelSeriesNodeDataContext<TDatum, TLabel> = DataModelSeriesNodeDataContext<TDatum, TLabel>,
> extends DataModelSeries<TDatum, TOpts, TProps, TLabel, TContext> {
    override directions = [ChartAxisDirection.Angle, ChartAxisDirection.Radius];

    protected itemGroup = this.contentGroup.appendChild(new Group({ name: 'items', zIndex: 1 }));
    public getItemNodes(): TNode[] {
        return [...this.itemGroup.children()] as TNode[];
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
    protected labelSelection: Selection<Text, TDatum> = Selection.select(
        this.labelGroup,
        () => this.labelFactory(),
        false
    );
    protected highlightSelection: Selection<TNode, TDatum> = Selection.select(this.highlightNodeGroup, () =>
        this.nodeFactory()
    );
    protected highlightLabelSelection: Selection<Text, TDatum> = Selection.select(this.highlightLabelGroup, () =>
        this.labelFactory()
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
        categoryKey,
        pickModes = [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
        canHaveAxes = false,
        animationResetFns,
        ...opts
    }: {
        moduleCtx: ModuleContext;
        categoryKey: string | undefined;
        pickModes?: SeriesNodePickMode[];
        canHaveAxes?: boolean;
        animationResetFns?: {
            item?: (node: TNode, datum: TDatum) => AnimationValue & Partial<TNode>;
            label?: (node: Text, datum: TDatum) => AnimationValue & Partial<Text>;
        };
    } & Partial<DataModelSeriesConstructorOpts<TProps>>) {
        super({
            ...opts,
            categoryKey,
            pickModes,
            canHaveAxes,
        });

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

        this.cleanup.register(
            this.ctx.eventsHub.on('legend:item-click', (event) => this.onLegendItemClick(event)),
            this.ctx.eventsHub.on('legend:item-double-click', (event) => this.onLegendItemDoubleClick(event))
        );
    }

    override setZIndex(zIndex: number) {
        super.setZIndex(zIndex);

        this.contentGroup.zIndex = [zIndex, PolarZIndexMap.FOREGROUND];
        this.highlightGroup.zIndex = [zIndex, PolarZIndexMap.HIGHLIGHT];
        this.labelGroup.zIndex = [zIndex, PolarZIndexMap.LABEL];
    }

    override resetAnimation(phase: ChartAnimationPhase): void {
        if (phase === 'initial') {
            this.animationState.transition('reset');
        } else if (phase === 'ready') {
            this.animationState.transition('skip');
        }
    }

    protected abstract nodeFactory(): TNode;

    protected labelFactory(): Text {
        const text = new Text();
        text.pointerEvents = PointerEvents.None;
        return text;
    }

    getInnerRadius(): number {
        return 0;
    }

    surroundingRadius?: number;

    computeLabelsBBox(_options: { hideWhenNecessary: boolean }, _seriesRect: BBox): BBox | null | Promise<BBox | null> {
        return null;
    }

    protected getShapeFillBBox(): ShapeFillBBox {
        const outerRadius = this.radius;

        return {
            series: new BBox(-outerRadius, -outerRadius, outerRadius * 2, outerRadius * 2),
            axis: new BBox(-outerRadius, -outerRadius, outerRadius * 2, outerRadius * 2),
        };
    }

    protected resetAllAnimation() {
        const { item, label } = this.animationResetFns ?? {};

        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        if (item) {
            resetMotion([this.itemSelection, this.highlightSelection], item);
        }
        if (label) {
            resetMotion([this.labelSelection, this.highlightLabelSelection], label);
        }
        this.itemSelection.cleanup();
        this.labelSelection.cleanup();
        this.highlightSelection.cleanup();
        this.highlightLabelSelection.cleanup();
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
        const { item, label } = this.animationResetFns ?? {};
        if (item) {
            resetMotion([this.highlightSelection], item);
        }
        if (label) {
            resetMotion([this.highlightLabelSelection], label);
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

    protected override computeFocusBounds(opts: PickFocusInputs): BBox | Path | undefined {
        const datum = this.getNodeData()?.[opts.datumIndex];
        if (datum !== undefined) {
            return this.itemSelection.select((node): node is Path => node instanceof Path && node.datum === datum)[0];
        }
        return undefined;
    }

    override getSeriesRange(_direction: ChartAxisDirection, _visibleRange: [any, any]): [number, number] {
        return [Number.NaN, Number.NaN];
    }

    public override isSeriesHighlighted(highlightedDatum: HighlightNodeDatum | undefined, legendItemValues?: string[]) {
        const { series, legendItemName: activeLegendItemName, itemId } = highlightedDatum ?? {};

        const legendItemName = typeof itemId === 'number' ? legendItemValues?.[itemId] : undefined;

        return series === this || (legendItemName != null && legendItemName === activeLegendItemName);
    }
}
