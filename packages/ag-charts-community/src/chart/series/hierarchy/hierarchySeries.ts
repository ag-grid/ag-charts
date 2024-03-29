import type { ModuleContext } from '../../../module/moduleContext';
import type { AnimationValue } from '../../../motion/animation';
import { resetMotion } from '../../../motion/resetMotion';
import { StateMachine } from '../../../motion/states';
import { ColorScale } from '../../../scale/colorScale';
import type { BBox } from '../../../scene/bbox';
import type { Group } from '../../../scene/group';
import type { Node } from '../../../scene/node';
import type { Point } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import type { PointLabelDatum } from '../../../scene/util/labelPlacement';
import type { ChartAnimationPhase } from '../../chartAnimationPhase';
import type { HighlightNodeDatum } from '../../interaction/highlightManager';
import type { ChartLegendType, GradientLegendDatum } from '../../legendDatum';
import { Series, SeriesNodePickMatch, SeriesNodePickMode } from '../series';
import type { ISeries, SeriesNodeDatum } from '../seriesTypes';
import type { HierarchySeriesProperties } from './hierarchySeriesProperties';

type Mutable<T> = {
    -readonly [k in keyof T]: T[k];
};

type HierarchyAnimationState = 'empty' | 'ready' | 'waiting' | 'clearing';
type HierarchyAnimationEvent = 'update' | 'updateData' | 'highlight' | 'resize' | 'clear' | 'reset' | 'skip';

export interface HierarchyAnimationData<TNode extends Node, TDatum> {
    datumSelections: Selection<TNode, HierarchyNode<TDatum>>[];
}

export class HierarchyNode<TDatum = Record<string, any>>
    implements SeriesNodeDatum, Pick<HighlightNodeDatum, 'colorValue'>
{
    static Walk = {
        PreOrder: 0,
        PostOrder: 1,
    };

    readonly midPoint: Point;

    constructor(
        public readonly series: ISeries<any, any>,
        public readonly index: number,
        public readonly datum: TDatum | undefined,
        public readonly size: number,
        public readonly colorValue: number | undefined,
        public readonly fill: string | undefined,
        public readonly stroke: string | undefined,
        public readonly sumSize: number,
        public readonly depth: number | undefined,
        public readonly parent: HierarchyNode<TDatum> | undefined,
        public readonly children: HierarchyNode<TDatum>[]
    ) {
        this.midPoint = { x: 0, y: 0 };
    }

    contains(other: HierarchyNode<TDatum>): boolean {
        let current: HierarchyNode<TDatum> | undefined = other;
        // Index check is a performance optimization - it does not affect correctness
        while (current != null && current.index >= this.index) {
            if (current === this) {
                return true;
            }
            current = current.parent;
        }
        return false;
    }

    walk(callback: (node: HierarchyNode<TDatum>) => void, order = HierarchyNode.Walk.PreOrder) {
        if (order === HierarchyNode.Walk.PreOrder) {
            callback(this);
        }

        this.children.forEach((child) => {
            child.walk(callback, order);
        });

        if (order === HierarchyNode.Walk.PostOrder) {
            callback(this);
        }
    }

    *[Symbol.iterator](): Iterator<HierarchyNode<TDatum>> {
        yield this;

        for (const child of this.children) {
            yield* child;
        }
    }
}

export abstract class HierarchySeries<
    TNode extends Node = Group,
    TProps extends HierarchySeriesProperties<any> = HierarchySeriesProperties<any>,
    TDatum extends SeriesNodeDatum = SeriesNodeDatum,
> extends Series<TDatum, TProps> {
    rootNode = new HierarchyNode<TDatum>(
        this,
        0,
        undefined,
        0,
        undefined,
        undefined,
        undefined,
        0,
        undefined,
        undefined,
        []
    );
    colorDomain: number[] = [0, 0];
    maxDepth = 0;

    protected animationState: StateMachine<HierarchyAnimationState, HierarchyAnimationEvent>;

    protected abstract groupSelection: Selection<TNode, HierarchyNode<TDatum>>;

    protected animationResetFns?: {
        datum?: (node: TNode, datum: HierarchyNode<TDatum>) => AnimationValue & Partial<TNode>;
    };

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            contentGroupVirtual: false,
        });

        this.animationState = new StateMachine<HierarchyAnimationState, HierarchyAnimationEvent>(
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

    override async processData(): Promise<void> {
        const { childrenKey, sizeKey, colorKey, fills, strokes, colorRange } = this.properties;

        let index = 0;
        const getIndex = () => {
            index += 1;
            return index;
        };

        let maxDepth = 0;
        let minColor = Infinity;
        let maxColor = -Infinity;
        const colors: (number | undefined)[] = new Array((this.data?.length ?? 0) + 1).fill(undefined);

        const createNode = (datum: any, parent: HierarchyNode<TDatum>): HierarchyNode<TDatum> => {
            const nodeIndex = getIndex();
            const depth = parent.depth != null ? parent.depth + 1 : 0;
            const children = childrenKey != null ? datum[childrenKey] : undefined;
            const isLeaf = children == null || children.length === 0;

            let size = sizeKey != null ? datum[sizeKey] : undefined;
            if (Number.isFinite(size)) {
                size = Math.max(size, 0);
            } else {
                size = isLeaf ? 1 : 0;
            }

            const sumSize = size;
            maxDepth = Math.max(maxDepth, depth);

            const color = colorKey != null ? datum[colorKey] : undefined;
            if (typeof color === 'number') {
                colors[nodeIndex] = color;
                minColor = Math.min(minColor, color);
                maxColor = Math.max(maxColor, color);
            }

            return appendChildren(
                new HierarchyNode<TDatum>(
                    this,
                    nodeIndex,
                    datum,
                    size,
                    color,
                    undefined,
                    undefined,
                    sumSize,
                    depth,
                    parent,
                    []
                ),
                children
            );
        };

        const appendChildren = (
            node: Mutable<HierarchyNode<TDatum>>,
            data: TDatum[] | undefined
        ): HierarchyNode<TDatum> => {
            data?.forEach((datum: TDatum) => {
                const child = createNode(datum, node);
                node.children.push(child);
                node.sumSize += child.sumSize;
            });
            return node;
        };

        const rootNode = appendChildren(
            new HierarchyNode<TDatum>(
                this,
                0,
                undefined,
                0,
                undefined,
                undefined,
                undefined,
                0,
                undefined,
                undefined,
                []
            ),
            this.data
        );

        const colorDomain = [minColor, maxColor];

        let colorScale: ColorScale | undefined;
        if (colorRange != null && Number.isFinite(minColor) && Number.isFinite(maxColor)) {
            colorScale = new ColorScale();
            colorScale.domain = colorDomain;
            colorScale.range = colorRange;
            colorScale.update();
        }

        rootNode.children.forEach((child, childIndex) => {
            child.walk((node: Mutable<HierarchyNode<TDatum>>) => {
                let fill: string | undefined;

                const color = colors[node.index];
                if (color != null) {
                    fill = colorScale?.convert(color);
                }

                fill ??= fills?.[childIndex % fills.length];

                node.fill = fill;
                // FIXME: If there's a color scale, the strokes won't make sense. For now, just hard-code this default
                node.stroke = colorScale == null ? strokes?.[childIndex % strokes.length] : 'rgba(0, 0, 0, 0.2)';
            });
        });

        this.rootNode = rootNode;
        this.maxDepth = maxDepth;
        this.colorDomain = colorDomain;
    }

    protected abstract updateSelections(): Promise<void>;

    protected abstract updateNodes(): Promise<void>;

    override async update({ seriesRect }: { seriesRect?: BBox }): Promise<void> {
        await this.updateSelections();
        await this.updateNodes();

        const animationData = this.getAnimationData();
        const resize = this.checkResize(seriesRect);
        if (resize) {
            this.animationState.transition('resize', animationData);
        }
        this.animationState.transition('update', animationData);
    }

    protected override pickNodeClosestDatum(_point: Point): SeriesNodePickMatch | undefined {
        return undefined;
    }

    protected resetAllAnimation(data: HierarchyAnimationData<TNode, TDatum>) {
        const datum = this.animationResetFns?.datum;

        // Stop any running animations by prefix convention.
        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        if (datum != null) {
            resetMotion(data.datumSelections, datum);
        }
    }

    protected animateEmptyUpdateReady(data: HierarchyAnimationData<TNode, TDatum>) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation(data);
    }

    protected animateWaitingUpdateReady(data: HierarchyAnimationData<TNode, TDatum>) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation(data);
    }

    protected animateReadyHighlight(data: Selection<TNode, HierarchyNode<TDatum>>) {
        const datum = this.animationResetFns?.datum;
        if (datum != null) {
            resetMotion([data], datum);
        }
    }
    protected animateReadyResize(data: HierarchyAnimationData<TNode, TDatum>) {
        this.resetAllAnimation(data);
    }

    protected animateClearingUpdateEmpty(data: HierarchyAnimationData<TNode, TDatum>) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation(data);
    }

    protected animationTransitionClear() {
        this.animationState.transition('clear', this.getAnimationData());
    }

    private getAnimationData() {
        const animationData: HierarchyAnimationData<TNode, TDatum> = {
            datumSelections: [this.groupSelection],
        };

        return animationData;
    }

    protected isProcessedDataAnimatable() {
        return true;
    }

    protected checkProcessedDataAnimatable() {
        if (!this.isProcessedDataAnimatable()) {
            this.ctx.animationManager.skipCurrentBatch();
        }
    }

    override getLabelData(): PointLabelDatum[] {
        return [];
    }

    override getSeriesDomain() {
        return [NaN, NaN];
    }

    override getLegendData(legendType: ChartLegendType): GradientLegendDatum[] {
        const { colorKey, colorName, colorRange, visible } = this.properties;
        return legendType === 'gradient' && colorKey != null && colorRange != null
            ? [
                  {
                      legendType: 'gradient',
                      enabled: visible,
                      seriesId: this.id,
                      colorName,
                      colorRange,
                      colorDomain: this.colorDomain,
                  },
              ]
            : [];
    }

    protected getDatumIdFromData(node: HierarchyNode) {
        return `${node.index}`;
    }

    protected getDatumId(node: HierarchyNode) {
        return this.getDatumIdFromData(node);
    }
}
