import type { ChartAnimationPhase } from 'ag-charts-core';
import { Logger, type Point, StateMachine, arraysEqual, clamp, mergeDefaults } from 'ag-charts-core';
import type { FillOptions, StrokeOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../../core/eventsHub';
import type { ModuleContext } from '../../../module/moduleContext';
import { ColorScale } from '../../../scale/colorScale';
import { BBox } from '../../../scene/bbox';
import type { Node } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import { createDatumId } from '../../data/processors';
import type { ChartLegendType, GradientLegendDatum } from '../../legend/legendDatum';
import { Series } from '../series';
import {
    type ISeries,
    type ItemId,
    type PickFocusInputs,
    type PickFocusOutputs,
    type SeriesNodeDatum,
    SeriesNodePickMode,
} from '../seriesTypes';
import {
    HierarchyHighlightState,
    type HierarchySeriesProperties,
    toHierarchyHighlightString,
} from './hierarchySeriesProperties';

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

export interface HierarchyAnimationData<_TNode extends Node, _TNodeClass> {}

export class HierarchyNode<This extends HierarchyNode<This, TDatum> = any, TDatum = Record<string, any>>
    implements HierarchyNodeDatum, Pick<HighlightNodeDatum, 'colorValue'>
{
    private static readonly Walk = {
        PreOrder: 0,
        PostOrder: 1,
    };

    readonly midPoint: Point;

    constructor(
        public readonly series: ISeries<any, any, any>,
        public readonly itemId: ItemId,
        public readonly datumIndex: number[],
        public readonly datum: TDatum | undefined,
        public readonly sizeValue: number,
        public readonly colorValue: number | undefined,
        public readonly sumSize: number,
        public readonly depth: number | undefined,
        public readonly parent: This | undefined,
        public readonly children: This[],
        public readonly style: FillOptions & StrokeOptions
    ) {
        this.midPoint = { x: 0, y: 0 };
    }

    get hasChildren() {
        return this.children.length > 0;
    }

    walk(callback: (node: This | typeof this) => void, order = HierarchyNode.Walk.PreOrder) {
        if (order === HierarchyNode.Walk.PreOrder) {
            callback(this);
        }

        for (const child of this.children) {
            child.walk(callback, order);
        }

        if (order === HierarchyNode.Walk.PostOrder) {
            callback(this);
        }
    }

    find(predicate: (node: This | typeof this) => boolean): This | typeof this | undefined {
        if (predicate(this)) {
            return this;
        }
        for (const child of this.children) {
            const childResult = child.find(predicate);
            if (childResult != undefined) {
                return childResult;
            }
        }
        return undefined;
    }

    *[Symbol.iterator](): Iterator<This> {
        yield this as any as This;

        for (const child of this.children) {
            yield* child;
        }
    }
}

export abstract class HierarchySeries<
    TNode extends Node,
    TOpts extends object,
    TProps extends HierarchySeriesProperties<TOpts>,
    TNodeClass extends HierarchyNode,
> extends Series<number[], TNodeClass, TOpts, TProps> {
    protected abstract NodeClass: new (...params: ConstructorParameters<typeof HierarchyNode<any, any>>) => TNodeClass;

    rootNode: TNodeClass | undefined;
    colorDomain: number[] = [0, 0];
    maxDepth = 0;

    protected colorScale = new ColorScale();

    protected animationState: StateMachine<HierarchyAnimationState, HierarchyAnimationEvent<TNode, TNodeClass>>;

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
            const depth = parent.depth == null ? 0 : parent.depth + 1;
            const children = childrenKey == null ? undefined : datum[childrenKey];
            const isLeaf = children == null || children.length === 0;

            let sizeValue = sizeKey == null ? undefined : datum[sizeKey];
            if (Number.isFinite(sizeValue)) {
                sizeValue = Math.max(sizeValue, 0);
            } else {
                sizeValue = isLeaf ? 1 : 0;
            }

            const sumSize = sizeValue;
            maxDepth = Math.max(maxDepth, depth);

            const colorValue = colorKey == null ? undefined : datum[colorKey];
            if (typeof colorValue === 'number') {
                minColor = Math.min(minColor, colorValue);
                maxColor = Math.max(maxColor, colorValue);
            }

            const style = this.getItemStyle({ datumIndex: indexPath, datum, depth, colorValue }, isLeaf, false);
            return appendChildren(
                new NodeClass(
                    this,
                    createDatumId(indexPath.join(';')),
                    indexPath,
                    datum,
                    sizeValue,
                    colorValue,
                    sumSize,
                    depth,
                    parent,
                    [],
                    style
                ),
                children
            );
        };

        const appendChildren = (node: Mutable<TNodeClass>, data: any[] | undefined): TNodeClass => {
            const { datumIndex } = node;
            if (data) {
                for (const [childIndex, datum] of data.entries()) {
                    const child = createNode(datum, datumIndex.concat(childIndex), node);
                    node.children.push(child);
                    node.sumSize += child.sumSize;
                }
            }
            return node;
        };

        const rootNode = appendChildren(
            new NodeClass(this, 'root', [], undefined, 0, undefined, 0, undefined, undefined, [], {}),
            this.data?.data
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

    protected resetAllAnimation(_data: HierarchyAnimationData<TNode, TNodeClass>) {
        // Stop any running animations by prefix convention.
        this.ctx.animationManager.stopByAnimationGroupId(this.id);
    }

    protected animateEmptyUpdateReady(data: HierarchyAnimationData<TNode, TNodeClass>) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation(data);
    }

    protected animateWaitingUpdateReady(data: HierarchyAnimationData<TNode, TNodeClass>) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation(data);
    }

    protected animateReadyHighlight(_data: Selection<TNode, TNodeClass>) {
        // No-op
    }

    protected animateReadyResize(data: HierarchyAnimationData<TNode, TNodeClass>) {
        this.resetAllAnimation(data);
    }

    protected animateClearingUpdateEmpty(data: HierarchyAnimationData<TNode, TNodeClass>) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation(data);
    }

    protected getAnimationData(): HierarchyAnimationData<TNode, TNodeClass> {
        return {};
    }

    protected isProcessedDataAnimatable() {
        return true;
    }

    protected checkProcessedDataAnimatable() {
        if (!this.isProcessedDataAnimatable()) {
            this.ctx.animationManager.skipCurrentBatch();
        }
    }

    override findNodeDatum(itemId: ItemId): TNodeClass | undefined {
        return this.rootNode?.find((n) => n.itemId === itemId);
    }

    override dataCount(): number {
        return Number.NaN; // Not used
    }

    override getSeriesDomain() {
        return { domain: [Number.NaN, Number.NaN] };
    }

    override getSeriesRange(): [number, number] {
        return [Number.NaN, Number.NaN];
    }

    override getLegendData(legendType: ChartLegendType): GradientLegendDatum[] {
        const { colorKey, colorRange } = this.properties;
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
                      series: this.getFormatterContext('color'),
                      colorRange,
                      colorDomain: this.colorDomain,
                  },
              ]
            : [];
    }

    protected getDatumIdFromData(node: Pick<TNodeClass, 'datumIndex'>): string {
        return node.datumIndex.join(':');
    }

    protected getDatumId(node: Pick<TNodeClass, 'datumIndex'>): string {
        return this.getDatumIdFromData(node);
    }

    private removeMeIndexPathForIndex(index: number): number[] {
        return this.datumSelection.at(index + 1)?.datum.datumIndex ?? [];
    }

    private removeMeIndexForIndexPath(indexPath: number[]): number {
        for (const { index, datum } of this.datumSelection) {
            if (arraysEqual(datum.datumIndex, indexPath)) {
                return index - 1;
            }
        }
        return 0;
    }

    protected abstract datumSelection: Selection<any, TNodeClass>;

    protected abstract computeFocusBounds(node: TNode): BBox | Path | undefined;

    public override pickFocus(opts: PickFocusInputs): PickFocusOutputs | undefined {
        if (!this.rootNode?.children.length) return undefined;

        const index = clamp(0, opts.datumIndex - opts.datumIndexDelta, this.datumSelection.length - 1);
        const { datumIndexDelta: childDelta, otherIndexDelta: depthDelta } = opts;
        let path = this.removeMeIndexPathForIndex(index);
        const currentNode = path.reduce((n, childIndex) => n.children[childIndex], this.rootNode);

        if (depthDelta > 0 && currentNode.hasChildren) {
            path = [...path, 0];
        } else if (depthDelta < 0 && path.length > 1) {
            path = path.slice(0, -1);
        } else if (depthDelta === 0 && childDelta !== 0) {
            const maxIndex = currentNode.parent!.children.length - 1;
            path = path.slice();
            path[path.length - 1] = clamp(0, path.at(-1)! + childDelta, maxIndex);
        }

        const nextNode = path.reduce((n, childIndex) => n.children[childIndex], this.rootNode);
        const bounds = this.computeFocusBounds(this.datumSelection.at(index + 1));

        if (bounds == null) return;

        return {
            datum: nextNode,
            datumIndex: this.removeMeIndexForIndexPath(path),
            otherIndex: nextNode.depth,
            bounds,
            clipFocusBox: true,
        };
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

    getCategoryValue(_datumIndex: number[]) {
        return;
    }

    datumIndexForCategoryValue(_categoryValue: any): number[] | undefined {
        return;
    }

    protected getActiveHighlightNode(): TNodeClass | undefined {
        if (!this.properties.highlight.enabled) {
            return undefined;
        }

        const highlightedNode = this.ctx.highlightManager?.getActiveHighlight() as TNodeClass | undefined;
        if (highlightedNode?.series !== this) {
            return undefined;
        }
        return highlightedNode;
    }

    protected getHierarchyHighlightState(
        isHighlight: boolean,
        highlightedNode: TNodeClass | undefined,
        nodeDatum: Pick<TNodeClass, 'datumIndex'>
    ): HierarchyHighlightState {
        if (isHighlight) {
            return HierarchyHighlightState.Item;
        }

        if (highlightedNode == null) {
            return HierarchyHighlightState.None;
        }

        const nodeRoot = nodeDatum.datumIndex?.[0];
        const highlightRoot = highlightedNode.datumIndex?.[0];

        if (nodeRoot == null || highlightRoot == null) {
            return HierarchyHighlightState.None;
        }

        return nodeRoot === highlightRoot ? HierarchyHighlightState.Branch : HierarchyHighlightState.OtherBranch;
    }

    protected getHierarchyHighlightStyles<TStyle extends Partial<FillOptions & StrokeOptions & { opacity?: number }>>(
        highlightState: HierarchyHighlightState,
        highlight: {
            highlightedItem?: TStyle;
            unhighlightedItem?: TStyle;
            highlightedBranch?: TStyle;
            unhighlightedBranch?: TStyle;
        }
    ): TStyle | undefined {
        switch (highlightState) {
            case HierarchyHighlightState.Item:
                return mergeDefaults<TStyle>(highlight.highlightedItem, highlight.highlightedBranch);
            case HierarchyHighlightState.Branch:
                return mergeDefaults<TStyle>(highlight.unhighlightedItem, highlight.highlightedBranch);
            case HierarchyHighlightState.OtherBranch:
                return highlight.unhighlightedBranch;
            default:
                return undefined;
        }
    }

    public override getHighlightStateString(
        _datum: HighlightNodeDatum | undefined,
        isHighlight?: boolean,
        datumIndex?: number[],
        _legendItemValues?: string[]
    ): ReturnType<typeof toHierarchyHighlightString> {
        if (!this.properties.highlight.enabled) {
            return toHierarchyHighlightString(HierarchyHighlightState.None);
        }
        if (datumIndex == null) {
            return toHierarchyHighlightString(HierarchyHighlightState.None);
        }

        const nodeDatum = datumIndex.reduce((node, idx) => node?.children[idx], this.rootNode);
        const highlightedNode = this.getActiveHighlightNode();
        if (nodeDatum == null) {
            return toHierarchyHighlightString(HierarchyHighlightState.None);
        }

        const state = this.getHierarchyHighlightState(isHighlight ?? false, highlightedNode, nodeDatum);
        return toHierarchyHighlightString(state);
    }

    protected abstract getItemStyle(
        datum: Partial<HierarchyNode>,
        isLeaf: boolean,
        isHighlight: boolean
    ): FillOptions & StrokeOptions;
}
