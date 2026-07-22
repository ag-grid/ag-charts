import type { ChartAnimationPhase, DynamicContext } from 'ag-charts-core';
import {
    type Point,
    StateMachine,
    arraysEqual,
    clamp,
    isFiniteNumericValue,
    isNumericValue,
    mergeDefaults,
    toNumber,
} from 'ag-charts-core';
import type { AgActiveItemState, FillOptions, StrokeOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../../core/eventsHub';
import type { ChartRegistry } from '../../../module/moduleContext';
import { ColorScale } from '../../../scale/colorScale';
import { configureColorScale } from '../../../scale/colorScaleUtil';
import { BBox } from '../../../scene/bbox';
import type { Node } from '../../../scene/node';
import type { Selection, SelectionInterface } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import { createDatumId } from '../../data/processors';
import {
    type CategoryLegendDatum,
    type ChartLegendType,
    type GradientLegendDatum,
    buildColorCategoryLegendData,
    buildGradientLegendDatum,
    colorScaleLegendFormatterContext,
} from '../../legend/legendDatum';
import { type PickFocusInputs, type PickFocusOutputs, Series, SeriesNodePickMode } from '../series';
import type { DatumIndex, ISeries, ItemId, SeriesNodeDatum } from '../seriesTypes';
import {
    HierarchyHighlightState,
    type HierarchySeriesProperties,
    toHierarchyHighlightString,
} from './hierarchySeriesProperties';

type Mutable<T> = {
    -readonly [k in keyof T]: T[k];
};

type HierarchyAnimationState = 'empty' | 'ready' | 'waiting' | 'clearing';
type HierarchyAnimationEvent<TDatum, TNode extends Node<TDatum>> = {
    update: HierarchyAnimationData<TNode, TDatum>;
    updateData: undefined;
    highlight: Selection<TDatum, TNode>;
    resize: HierarchyAnimationData<TNode, TDatum>;
    clear: HierarchyAnimationData<TNode, TDatum>;
    reset: undefined;
    skip: undefined;
};

export interface HierarchyNodeDatum extends SeriesNodeDatum {}

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
        public readonly path: number[],
        public readonly datumIndex: number,
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
    TNodeClass extends HierarchyNode,
    TNode extends Node<TNodeClass>,
    TOpts extends object,
    TProps extends HierarchySeriesProperties<TOpts>,
> extends Series<TNodeClass, TOpts, TProps> {
    protected abstract NodeClass: new (...params: ConstructorParameters<typeof HierarchyNode<any, any>>) => TNodeClass;

    rootNode: TNodeClass | undefined;
    colorDomain: number[] = [0, 0];
    maxDepth = 0;

    protected colorScale = new ColorScale();

    protected animationState: StateMachine<HierarchyAnimationState, HierarchyAnimationEvent<TNodeClass, TNode>>;

    constructor(moduleCtx: DynamicContext<ChartRegistry>) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
        });

        this.animationState = new StateMachine<HierarchyAnimationState, HierarchyAnimationEvent<TNodeClass, TNode>>(
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
        // Commit pending transactions before reading data. The HierarchyDataSet subclass
        // handles nested item lookups via childrenKey.
        this.data?.commitPendingTransactions(this.ctx.dataSelectionService);

        const { NodeClass } = this;
        const { childrenKey, sizeKey, colorKey } = this.properties;

        let maxDepth = 0;
        let minColor = Infinity;
        let maxColor = -Infinity;
        let datumIndex = -1; // DFS-order index. -1 is the root, 0 is the first child of the root

        const createNode = (datum: any, indexPath: number[], parent: TNodeClass): TNodeClass => {
            const depth = parent.depth == null ? 0 : parent.depth + 1;
            const children = childrenKey == null ? undefined : datum[childrenKey];
            const isLeaf = children == null || children.length === 0;

            // Accept bigint sizes (coerced to Number) so out-of-safe-range integers still drive tile area.
            let sizeValue = sizeKey == null ? undefined : datum[sizeKey];
            if (isFiniteNumericValue(sizeValue)) {
                sizeValue = Math.max(toNumber(sizeValue), 0);
            } else {
                sizeValue = isLeaf ? 1 : 0;
            }

            const sumSize = sizeValue;
            maxDepth = Math.max(maxDepth, depth);

            let colorValue = colorKey == null ? undefined : datum[colorKey];
            if (isNumericValue(colorValue)) {
                colorValue = toNumber(colorValue);
                minColor = Math.min(minColor, colorValue);
                maxColor = Math.max(maxColor, colorValue);
            }

            ++datumIndex;
            const style = this.getItemStyle({ datumIndex, datum, depth, colorValue }, isLeaf, false);
            return appendChildren(
                new NodeClass(
                    this,
                    createDatumId(indexPath.join(';')),
                    indexPath,
                    datumIndex,
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
            const { path } = node;
            if (data) {
                for (const [childIndex, datum] of data.entries()) {
                    const child = createNode(datum, path.concat(childIndex), node);
                    node.children.push(child);
                    node.sumSize += child.sumSize;
                }
            }
            return node;
        };

        const rootNode = appendChildren(
            new NodeClass(this, 'root', [], datumIndex, undefined, 0, undefined, 0, undefined, undefined, [], {}),
            this.data?.data
        );

        const colorDomain = [minColor, maxColor];

        const dataDomain: [number, number] = minColor < maxColor ? [minColor, maxColor] : [0, 1];
        configureColorScale(this.colorScale, this.properties.colorScale, dataDomain);

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

    protected animateReadyHighlight(_data: Selection<TNodeClass, TNode>) {
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

    override findNodeDatum(itemId: AgActiveItemState['itemId']): TNodeClass | undefined {
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

    override getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] | GradientLegendDatum[] {
        const { colorKey, colorScale: colorScaleProps } = this.properties;
        const hasColorScale = colorScaleProps.fills.length > 0;
        const {
            id: seriesId,
            ctx: { legendManager },
            visible,
        } = this;

        if (colorKey == null || !hasColorScale) {
            return [];
        }

        const enabled = visible && (legendManager?.getItemEnabled({ seriesId }) ?? true);

        if (legendType === 'category' && colorScaleProps.mode === 'discrete' && hasColorScale) {
            return buildColorCategoryLegendData(
                this.colorScale,
                colorScaleProps.fills,
                seriesId,
                enabled,
                colorScaleLegendFormatterContext(this)
            );
        }

        if (legendType === 'gradient') {
            return [
                buildGradientLegendDatum(
                    this.colorScale,
                    colorScaleProps.fills,
                    seriesId,
                    enabled,
                    this.getFormatterContext('color')
                ),
            ];
        }

        return [];
    }

    private removeMeIndexPathForIndex(index: number): number[] {
        return this.datumSelection.at(index + 1)?.datum?.path ?? [];
    }

    private removeMeIndexForIndexPath(indexPath: number[]): number {
        const nodes = this.datumSelection.nodes();
        for (let index = 0; index < nodes.length; index++) {
            const { datum } = nodes[index];
            if (datum === undefined) continue;

            if (arraysEqual(datum.path, indexPath)) {
                return index - 1;
            }
        }
        return 0;
    }

    protected abstract datumSelection: SelectionInterface<TNodeClass, TNode>;

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
        const focusedNode = this.datumSelection.at(index + 1);
        if (focusedNode == null) return;

        const bounds = this.computeFocusBounds(focusedNode);

        if (bounds == null) return;

        return {
            datum: nextNode,
            datumIndex: this.removeMeIndexForIndexPath(path),
            otherIndex: nextNode.depth,
            bounds,
            clipFocusBox: true,
        };
    }

    override getDatumAriaMeta(datum: SeriesNodeDatum, description: string) {
        if (!(datum instanceof this.NodeClass)) {
            this.ctx.logger.error(`datum is not HierarchyNode: ${JSON.stringify(datum)}`);
            return undefined;
        }
        return {
            text: this.ctx.localeManager.t('ariaAnnounceHierarchyDatum', {
                level: (datum.depth ?? -1) + 1,
                count: datum.children.length,
                description,
            }),
        };
    }

    getCategoryValue(_datumIndex: DatumIndex) {
        return;
    }

    datumIndexForCategoryValue(_categoryValue: any): DatumIndex | undefined {
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
        nodeDatum: Pick<TNodeClass, 'path'>
    ): HierarchyHighlightState {
        if (isHighlight) {
            return HierarchyHighlightState.Item;
        }

        if (highlightedNode == null) {
            return HierarchyHighlightState.None;
        }

        const nodeRoot = nodeDatum.path?.[0];
        const highlightRoot = highlightedNode.path?.[0];

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
        datumIndex?: DatumIndex,
        _legendItemValues?: string[]
    ): ReturnType<typeof toHierarchyHighlightString> {
        if (!this.properties.highlight.enabled) {
            return toHierarchyHighlightString(HierarchyHighlightState.None);
        }
        if (datumIndex == null) {
            return toHierarchyHighlightString(HierarchyHighlightState.None);
        }

        const nodeDatum = this.dfsFind(datumIndex);
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

    protected dfsFind(datumIndex: number): TNodeClass | undefined {
        const stack: TNodeClass[] = [];
        let node: TNodeClass | undefined = this.rootNode;
        while (node && node.datumIndex !== datumIndex) {
            stack.push(...node.children);
            node = stack.pop();
        }
        return node;
    }
}
