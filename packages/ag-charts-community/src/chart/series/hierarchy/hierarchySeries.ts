import type { ModuleContext } from '../../../module/moduleContext';
import type { AnimationValue } from '../../../motion/animation';
import { resetMotion } from '../../../motion/resetMotion';
import { ColorScale } from '../../../scale/colorScale';
import type { BBox } from '../../../scene/bbox';
import type { Group } from '../../../scene/group';
import type { Node } from '../../../scene/node';
import type { Point } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import { Logger } from '../../../util/logger';
import { StateMachine } from '../../../util/stateMachine';
import type { ChartAnimationPhase } from '../../chartAnimationPhase';
import type { ChartAxisDirection } from '../../chartAxisDirection';
import type { HighlightNodeDatum } from '../../interaction/highlightManager';
import type { ChartLegendType, GradientLegendDatum } from '../../legend/legendDatum';
import { type PickFocusInputs, type PickFocusOutputs, Series, SeriesNodePickMode } from '../series';
import type { ISeries, SeriesNodeDatum } from '../seriesTypes';
import type { HierarchySeriesProperties } from './hierarchySeriesProperties';

type Mutable<T> = {
    -readonly [k in keyof T]: T[k];
};

type HierarchyAnimationState = 'empty' | 'ready' | 'waiting' | 'clearing';
type HierarchyAnimationEvent<TNode extends Node, TDatum> = {
    update: HierarchyAnimationData<TNode, TDatum>;
    updateData: undefined;
    highlight: Selection<TNode, TDatum>;
    resize: HierarchyAnimationData<TNode, TDatum>;
    clear: HierarchyAnimationData<TNode, TDatum>;
    reset: undefined;
    skip: undefined;
};

export interface HierarchyNodeDatum extends SeriesNodeDatum<number[]> {}

export interface HierarchyAnimationData<TNode extends Node, TNodeClass> {
    datumSelections: Selection<TNode, TNodeClass>[];
}

export class HierarchyNode<This extends HierarchyNode<This, TDatum> = any, TDatum = Record<string, any>>
    implements HierarchyNodeDatum, Pick<HighlightNodeDatum, 'colorValue'>
{
    private static readonly Walk = {
        PreOrder: 0,
        PostOrder: 1,
    };

    readonly midPoint: Point;

    constructor(
        public readonly series: ISeries<any, any>,
        public readonly datumIndex: number[],
        public readonly datum: TDatum | undefined,
        public readonly sizeValue: number,
        public readonly colorValue: number | undefined,
        public readonly sumSize: number,
        public readonly depth: number | undefined,
        public readonly parent: This | undefined,
        public readonly children: This[]
    ) {
        this.midPoint = { x: 0, y: 0 };
    }

    walk(callback: (node: This) => void, order = HierarchyNode.Walk.PreOrder) {
        if (order === HierarchyNode.Walk.PreOrder) {
            callback(this as any as This);
        }

        this.children.forEach((child) => {
            child.walk(callback, order);
        });

        if (order === HierarchyNode.Walk.PostOrder) {
            callback(this as any as This);
        }
    }

    *[Symbol.iterator](): Iterator<This> {
        yield this as any as This;

        for (const child of this.children) {
            yield* child;
        }
    }
}

export abstract class HierarchySeries<
    TNode extends Node = Group,
    TProps extends HierarchySeriesProperties<any> = HierarchySeriesProperties<any>,
    TNodeClass extends HierarchyNode = HierarchyNode,
> extends Series<number[], TNodeClass, TProps> {
    protected abstract NodeClass: new (...params: ConstructorParameters<typeof HierarchyNode<any, any>>) => TNodeClass;

    rootNode: TNodeClass | undefined;
    colorDomain: number[] = [0, 0];
    maxDepth = 0;

    protected colorScale = new ColorScale();

    protected animationState: StateMachine<HierarchyAnimationState, HierarchyAnimationEvent<TNode, TNodeClass>>;

    protected animationResetFns?: {
        datum?: (node: TNode, datum: TNodeClass) => AnimationValue & Partial<TNode>;
    };

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
        });

        this.animationState = new StateMachine<HierarchyAnimationState, HierarchyAnimationEvent<TNode, TNodeClass>>(
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

    override processData() {
        const { NodeClass } = this;
        const { childrenKey, sizeKey, colorKey, colorRange } = this.properties;

        let maxDepth = 0;
        let minColor = Infinity;
        let maxColor = -Infinity;

        const createNode = (datum: any, indexPath: number[], parent: TNodeClass): TNodeClass => {
            const depth = parent.depth != null ? parent.depth + 1 : 0;
            const children = childrenKey != null ? datum[childrenKey] : undefined;
            const isLeaf = children == null || children.length === 0;

            let sizeValue = sizeKey != null ? datum[sizeKey] : undefined;
            if (Number.isFinite(sizeValue)) {
                sizeValue = Math.max(sizeValue, 0);
            } else {
                sizeValue = isLeaf ? 1 : 0;
            }

            const sumSize = sizeValue;
            maxDepth = Math.max(maxDepth, depth);

            const colorValue = colorKey != null ? datum[colorKey] : undefined;
            if (typeof colorValue === 'number') {
                minColor = Math.min(minColor, colorValue);
                maxColor = Math.max(maxColor, colorValue);
            }

            return appendChildren(
                new NodeClass(this, indexPath, datum, sizeValue, colorValue, sumSize, depth, parent, []),
                children
            );
        };

        const appendChildren = (node: Mutable<TNodeClass>, data: any[] | undefined): TNodeClass => {
            const { datumIndex } = node;
            data?.forEach((datum: any, childIndex: number) => {
                const child = createNode(datum, datumIndex.concat(childIndex), node);
                node.children.push(child);
                node.sumSize += child.sumSize;
            });
            return node;
        };

        const rootNode = appendChildren(
            new NodeClass(this, [], undefined, 0, undefined, 0, undefined, undefined, []),
            this.data
        );

        const colorDomain = [minColor, maxColor];

        this.colorScale.domain = minColor < maxColor ? [minColor, maxColor] : [0, 1];
        this.colorScale.range = colorRange ?? ['black'];
        this.colorScale.update();

        this.rootNode = rootNode;
        this.maxDepth = maxDepth;
        this.colorDomain = colorDomain;
    }

    protected abstract updateSelections(): void;

    protected abstract updateNodes(): void;

    override update({ seriesRect }: { seriesRect?: BBox }) {
        this.updateSelections();
        this.updateNodes();

        const animationData = this.getAnimationData();
        const resize = this.checkResize(seriesRect);
        if (resize) {
            this.animationState.transition('resize', animationData);
        }
        this.animationState.transition('update', animationData);
    }

    protected resetAllAnimation(data: HierarchyAnimationData<TNode, TNodeClass>) {
        const datum = this.animationResetFns?.datum;

        // Stop any running animations by prefix convention.
        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        if (datum != null) {
            resetMotion(data.datumSelections, datum);
        }
    }

    protected animateEmptyUpdateReady(data: HierarchyAnimationData<TNode, TNodeClass>) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation(data);
    }

    protected animateWaitingUpdateReady(data: HierarchyAnimationData<TNode, TNodeClass>) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation(data);
    }

    protected animateReadyHighlight(data: Selection<TNode, TNodeClass>) {
        const datum = this.animationResetFns?.datum;
        if (datum != null) {
            resetMotion([data], datum);
        }
    }

    protected animateReadyResize(data: HierarchyAnimationData<TNode, TNodeClass>) {
        this.resetAllAnimation(data);
    }

    protected animateClearingUpdateEmpty(data: HierarchyAnimationData<TNode, TNodeClass>) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation(data);
    }

    protected abstract getAnimationData(): HierarchyAnimationData<TNode, TNodeClass>;

    protected isProcessedDataAnimatable() {
        return true;
    }

    protected checkProcessedDataAnimatable() {
        if (!this.isProcessedDataAnimatable()) {
            this.ctx.animationManager.skipCurrentBatch();
        }
    }

    override getSeriesDomain() {
        return [NaN, NaN];
    }

    override getSeriesRange(_direction: ChartAxisDirection, _visibleRange: [any, any]): [number, number] {
        return [NaN, NaN];
    }

    override getLegendData(legendType: ChartLegendType): GradientLegendDatum[] {
        const { colorKey, colorName, colorRange } = this.properties;
        const {
            id: seriesId,
            ctx: { legendManager },
            visible,
        } = this;

        return legendType === 'gradient' && colorKey != null && colorRange != null
            ? [
                  {
                      legendType: 'gradient',
                      enabled: visible && legendManager.getItemEnabled({ seriesId }),
                      seriesId,
                      colorName,
                      colorRange,
                      colorDomain: this.colorDomain,
                  },
              ]
            : [];
    }

    protected getDatumIdFromData(node: TNodeClass) {
        return node.datumIndex.join(':');
    }

    protected getDatumId(node: TNodeClass) {
        return this.getDatumIdFromData(node);
    }

    protected abstract computeFocusBounds(node: TNodeClass): BBox | Path | undefined;

    public override pickFocus(_opts: PickFocusInputs): PickFocusOutputs | undefined {
        // if (!this.rootNode?.children.length) return undefined;

        // const { datum, datumIndexDelta: childDelta, otherIndexDelta: depthDelta } = opts;
        // const path = datum.index;
        // const depth = path.length - 2;

        // if (depthDelta !== 0 || path.length === 1) {
        //     const targetDepth = Math.max(0, depth + depthDelta);
        //     if (path[targetDepth + 1] == null) {
        //         let deepest = path[path.length - 1];
        //         while (deepest.nodeDatum.children.length > 0 && (deepest.nodeDatum.depth ?? -1) < targetDepth) {
        //             const nextDeepest = { nodeDatum: deepest.nodeDatum.children[0], childIndex: 0 };
        //             path.push(nextDeepest);
        //             deepest = nextDeepest;
        //         }
        //         return this.computeFocusOutputs(deepest);
        //     } else {
        //         path.length = targetDepth + 2;
        //         return this.computeFocusOutputs(path[targetDepth + 1]);
        //     }
        // } else if (childDelta === 0) {
        //     return this.computeFocusOutputs(path[path.length - 1]);
        // } else {
        //     const targetChild = path[depth + 1].childIndex + childDelta;
        //     const currentParent = path[depth].nodeDatum;
        //     const childCount = currentParent?.children?.length;
        //     if (childCount != null) {
        //         const newChild = clamp(0, targetChild, childCount - 1);
        //         const newFocus = { nodeDatum: currentParent.children[newChild], childIndex: newChild };
        //         path[depth + 1] = newFocus;
        //         path.length = depth + 2;
        //         return this.computeFocusOutputs(newFocus);
        //     }
        // }
        return undefined;
    }

    getDatumAriaText(datum: SeriesNodeDatum<number>, description: string): string | undefined {
        if (!(datum instanceof this.NodeClass)) {
            Logger.error(`datum is not HierarchyNode: ${JSON.stringify(datum)}`);
            return;
        }
        return this.ctx.localeManager.t('ariaAnnounceHierarchyDatum', {
            level: (datum.depth ?? -1) + 1,
            count: datum.children.length,
            description,
        });
    }

    // protected computeFocusOutputs({ nodeDatum, childIndex }: FocusPathNode<TDatum>): PickFocusOutputs | undefined {
    //     const bounds = this.computeFocusBounds(nodeDatum);
    //     if (bounds) {
    //         return {
    //             datum: nodeDatum,
    //             datumIndex: childIndex,
    //             otherIndex: nodeDatum.depth,
    //             bounds,
    //             showFocusBox: true,
    //             clipFocusBox: true,
    //         };
    //     }
    //     return undefined;
    // }
}
