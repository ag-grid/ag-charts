import { _ModuleSupport } from 'ag-charts-community';
import type {
    BBox,
    ChartAnimationPhase,
    DeepPartial,
    DynamicContext,
    Node,
    NormalisedDropShadowOptions,
    NormalisedHierarchySeriesKeys,
    NormalisedSeriesOptions,
    Path,
    Selection,
    SelectionInterface,
} from 'ag-charts-core';
import {
    type BoxBounds,
    CUT_ONLY_GLOW,
    ColorScale,
    type Point,
    PointerEvents,
    StateMachine,
    arraysEqual,
    clamp,
    configureColorScale,
    datumKeyReader,
    glowToShadow,
    isFiniteNumericValue,
    isNumericValue,
    mergeDefaults,
    mergeGlow,
    toNumber,
    withoutCasts,
} from 'ag-charts-core';
import type { AgActiveItemState, AgGlowOptions, AgItemShadowStyle, FillOptions, StrokeOptions } from 'ag-charts-types';

import { HierarchyDataSet } from '../../charts/hierarchyDataSet';

const {
    SeriesNodePickMode,
    buildColorCategoryLegendData,
    buildGradientLegendDatum,
    colorScaleLegendFormatterContext,
    createDatumId,
} = _ModuleSupport;

interface HierarchyHighlightBuckets<TStyle> {
    highlightedItem?: TStyle;
    unhighlightedItem?: TStyle;
    highlightedBranch?: TStyle;
    unhighlightedBranch?: TStyle;
}

export enum HierarchyHighlightState {
    None,
    Item,
    OtherItem,
    Branch,
    OtherBranch,
}

/** Where the merges of an item styler's `glow` start among those a cast object keeps, clear of the series' own. */
const HIERARCHY_GLOW_INDEX = 16;
const HIERARCHY_STATE_COUNT = 8;

export function toHierarchyHighlightString(
    state: HierarchyHighlightState
): 'highlighted-item' | 'unhighlighted-item' | 'highlighted-branch' | 'unhighlighted-branch' | 'none' {
    const unreachable = (a: never): never => a;
    switch (state) {
        case HierarchyHighlightState.Item:
            return 'highlighted-item';
        case HierarchyHighlightState.OtherItem:
            return 'unhighlighted-item';
        case HierarchyHighlightState.Branch:
            return 'highlighted-branch';
        case HierarchyHighlightState.OtherBranch:
            return 'unhighlighted-branch';
        case HierarchyHighlightState.None:
            return 'none';
        default:
            return unreachable(state);
    }
}

/** A highlight state's merged `glow` and the shadow it casts as, each unset where the cascade sets no glow. */
interface HierarchyGlowEntry {
    shadow: NormalisedDropShadowOptions | undefined;
    options: Readonly<AgGlowOptions> | undefined;
}

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

export interface HierarchyNodeDatum extends _ModuleSupport.SeriesNodeDatum {}

export interface HierarchyAnimationData<_TNode extends Node, _TNodeClass> {}

export class HierarchyNode<This extends HierarchyNode<This, TDatum> = any, TDatum = Record<string, any>>
    implements HierarchyNodeDatum, Pick<_ModuleSupport.HighlightNodeDatum, 'colorValue'>
{
    private static readonly Walk = {
        PreOrder: 0,
        PostOrder: 1,
    };

    readonly midPoint: Point;

    constructor(
        public readonly series: _ModuleSupport.ISeries<any, any, any>,
        public readonly itemId: _ModuleSupport.ItemId,
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

const selfCutGlows = new WeakMap<NormalisedDropShadowOptions, NormalisedDropShadowOptions>();

/** The glow of a glow-only copy, which the engine cuts by the footprint of its own node alone, so that it draws over the others. */
function getSelfCutGlow(glow: NormalisedDropShadowOptions): NormalisedDropShadowOptions {
    let selfCut = selfCutGlows.get(glow);
    if (selfCut == null) {
        selfCut = { ...glow, selfCut: true };
        selfCutGlows.set(glow, selfCut);
    }
    return selfCut;
}

export abstract class HierarchySeries<
    TNodeClass extends HierarchyNode,
    TNode extends Node<TNodeClass>,
    TOptions extends NormalisedHierarchySeriesKeys,
> extends _ModuleSupport.Series<TNodeClass, TOptions> {
    override readonly navigatesWithinSeries = true;

    override createChartDataSet(data: unknown[], dataIdKey: string | undefined, suppressFieldDotNotation: boolean) {
        const { childrenKey } = this.options;
        if (childrenKey == null) return;
        return new HierarchyDataSet(data, dataIdKey, childrenKey, this.ctx.logger, suppressFieldDotNotation);
    }

    override getChartAriaLabel(caption: string) {
        return this.ctx.localeManager.t('ariaAnnounceHierarchyChart', { caption });
    }

    protected abstract NodeClass: new (...params: ConstructorParameters<typeof HierarchyNode<any, any>>) => TNodeClass;

    rootNode: TNodeClass | undefined;
    colorDomain: number[] = [0, 0];
    maxDepth = 0;

    protected colorScale = new ColorScale();

    protected animationState: StateMachine<HierarchyAnimationState, HierarchyAnimationEvent<TNodeClass, TNode>>;

    constructor(moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>) {
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
        const { childrenKey, sizeKey, colorKey } = this.options;
        const suppressFieldDotNotation = this.data?.suppressFieldDotNotation ?? false;
        const readChildren = childrenKey == null ? undefined : datumKeyReader(childrenKey, suppressFieldDotNotation);
        const readSize = sizeKey == null ? undefined : datumKeyReader(sizeKey, suppressFieldDotNotation);
        const readColor = colorKey == null ? undefined : datumKeyReader(colorKey, suppressFieldDotNotation);

        let maxDepth = 0;
        let minColor = Infinity;
        let maxColor = -Infinity;
        let datumIndex = -1; // DFS-order index. -1 is the root, 0 is the first child of the root

        const createNode = (datum: any, indexPath: number[], parent: TNodeClass): TNodeClass => {
            const depth = parent.depth == null ? 0 : parent.depth + 1;
            const children = readChildren?.(datum);
            const isLeaf = children == null || children.length === 0;

            // Accept bigint sizes (coerced to Number) so out-of-safe-range integers still drive tile area.
            let sizeValue = readSize?.(datum);
            if (isFiniteNumericValue(sizeValue)) {
                sizeValue = Math.max(toNumber(sizeValue), 0);
            } else {
                sizeValue = isLeaf ? 1 : 0;
            }

            const sumSize = sizeValue;
            maxDepth = Math.max(maxDepth, depth);

            let colorValue = readColor?.(datum);
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
        configureColorScale(this.colorScale, this.options.colorScale, dataDomain, this.ctx.logger);

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

    override getLegendData(
        legendType: _ModuleSupport.ChartLegendType
    ): _ModuleSupport.CategoryLegendDatum[] | _ModuleSupport.GradientLegendDatum[] {
        const { colorKey, colorScale: colorScaleProps } = this.options;
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

    /**
     * Yields in datum order, as `getSelection()` does; the base scene walk would yield in depth order, and would
     * also yield a highlighted node a second time where its highlight node shares a group with the datum nodes.
     */
    public override *pickNodesInBBox(selectionBox: BoxBounds): Iterable<TNodeClass> {
        const predicate = this.pickNodesInBBoxPredicate();
        for (const node of this.datumSelection.nodes()) {
            if (node.visible && node.pointerEvents !== PointerEvents.None && predicate(selectionBox, node)) {
                yield node.unsafeDatum;
            }
        }
    }

    protected abstract computeFocusBounds(node: TNode): BBox | Path | undefined;

    public override pickFocus(opts: _ModuleSupport.PickFocusInputs): _ModuleSupport.PickFocusOutputs | undefined {
        if (this.rootNode == null || this.rootNode.children.length === 0) return undefined;

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

    override getDatumAriaMeta(datum: _ModuleSupport.SeriesNodeDatum, description: string) {
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

    getCategoryValue(_datumIndex: _ModuleSupport.DatumIndex) {
        return;
    }

    datumIndexForCategoryValue(_categoryValue: any): _ModuleSupport.DatumIndex | undefined {
        return;
    }

    protected getActiveHighlightNode(): TNodeClass | undefined {
        if (!this.isHighlightEnabled()) {
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

    /**
     * The highlight styles of a node, without their `glow`, which {@link getHierarchyHighlightGlow} reads. Resolved
     * once per `slot` and highlight state, as every node of the state shares it. Callers must not modify it.
     */
    protected getHierarchyHighlightStyles<TStyle extends Partial<FillOptions & StrokeOptions & { opacity?: number }>>(
        slot: number,
        highlightState: HierarchyHighlightState,
        highlight: HierarchyHighlightBuckets<TStyle>
    ): TStyle | undefined {
        return this.getCachedHighlightStyle(slot, highlightState, () => {
            const style = this.getHierarchyHighlightBuckets(highlightState, highlight);
            return style && withoutCasts(style);
        });
    }

    /**
     * The glow-free style of a highlight state, which `syncOptionDerivedState` drops. `null` once there is none.
     * OPTIMIZATION: styling runs per node while something is highlighted, and the style only changes with the options.
     */
    private highlightStyleBySlot: Array<Array<object | null> | undefined> = [];

    protected getCachedHighlightStyle<TStyle extends object>(
        slot: number,
        highlightState: HierarchyHighlightState,
        resolveStyle: () => TStyle | undefined
    ): TStyle | undefined {
        const styleByState = (this.highlightStyleBySlot[slot] ??= []);
        let style = styleByState[highlightState];
        if (style === undefined) {
            style = resolveStyle() ?? null;
            styleByState[highlightState] = style;
        }
        return (style as TStyle | null) ?? undefined;
    }

    /** The merged `glow` of the highlight styles of a node, over the `seriesGlow` of its part of the series. */
    protected getHierarchyHighlightGlow<TStyle extends { glow?: DeepPartial<AgGlowOptions> }>(
        highlightState: HierarchyHighlightState,
        highlight: HierarchyHighlightBuckets<TStyle>,
        seriesGlow: DeepPartial<AgGlowOptions> | undefined
    ): DeepPartial<AgGlowOptions> | undefined {
        return mergeGlow(this.getHierarchyHighlightBuckets(highlightState, highlight), { glow: seriesGlow });
    }

    private getHierarchyHighlightBuckets<TStyle extends object>(
        highlightState: HierarchyHighlightState,
        highlight: HierarchyHighlightBuckets<TStyle>
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

    /**
     * The merged `glow` of each highlight state and the shadow it converts to, by slot, which `syncOptionDerivedState`
     * drops. Shared by every node in a state, including the params of their item stylers.
     */
    private glowBySlot: Array<Array<HierarchyGlowEntry | undefined> | undefined> = [];

    protected override syncOptionDerivedState(diff: DeepPartial<NormalisedSeriesOptions<TOptions>> | undefined) {
        super.syncOptionDerivedState(diff);
        this.glowBySlot = [];
        this.highlightStyleBySlot = [];
    }

    private getGlowEntry(
        slot: number,
        highlightState: HierarchyHighlightState,
        resolveGlow: (highlightState: HierarchyHighlightState) => DeepPartial<AgGlowOptions> | undefined
    ): HierarchyGlowEntry {
        const glowByState = (this.glowBySlot[slot] ??= []);
        let entry = glowByState[highlightState];
        if (entry === undefined) {
            const options = resolveGlow(highlightState);
            const shadow = glowToShadow(options);
            entry = { shadow: shadow ?? undefined, options: shadow == null ? undefined : options };
            glowByState[highlightState] = entry;
        }
        return entry;
    }

    /** The glow of a highlight state as a shadow, converted once per `slot` (tiles and groups resolve differently). */
    protected getHierarchyGlow(
        slot: number,
        highlightState: HierarchyHighlightState,
        resolveGlow: (highlightState: HierarchyHighlightState) => Parameters<typeof glowToShadow>[0],
        itemGlow?: AgGlowOptions
    ): NormalisedDropShadowOptions | undefined {
        const glow = this.getGlowEntry(slot, highlightState, resolveGlow).shadow;
        if (itemGlow == null) return glow;

        const index = HIERARCHY_GLOW_INDEX + slot * HIERARCHY_STATE_COUNT + highlightState;
        const recalled = this.recallItemCast(glow, itemGlow, index);
        if (recalled !== undefined) return recalled ?? undefined;

        return this.mergeItemGlow(glow, index, itemGlow, glow, () => [resolveGlow(highlightState)]);
    }

    /**
     * The `shadow` a node casts without an item styler, for the params of one: unset where it casts none.
     * It is the series' own object, so nothing is allocated per node.
     */
    protected getHierarchyStylerShadow(shadow: NormalisedDropShadowOptions | undefined) {
        return shadow?.enabled ? (shadow as Readonly<NormalisedDropShadowOptions>) : undefined;
    }

    /**
     * The `glow` a node casts without an item styler, for the params of one: unset where it casts none.
     * It is the entry of its `slot` and state, so every node in a state gets the same object.
     */
    protected getHierarchyStylerGlow(
        slot: number,
        highlightState: HierarchyHighlightState,
        resolveGlow: (highlightState: HierarchyHighlightState) => DeepPartial<AgGlowOptions> | undefined
    ) {
        return this.getGlowEntry(slot, highlightState, resolveGlow).options;
    }

    /** The shadow on one copy of a node, in `fillShadow`: the highlight copy casts none, as its glow is cast by a glow-only copy. */
    protected resolveNodeShadow(
        shadow: NormalisedDropShadowOptions | undefined,
        isHighlight: boolean,
        itemShadow?: AgItemShadowStyle['shadow']
    ): NormalisedDropShadowOptions | undefined {
        if (isHighlight) return;
        return itemShadow == null ? shadow : this.mergeItemShadow(shadow, itemShadow);
    }

    /** Whether a node, drawn in place with `glow`, is a node of the hovered node's branch whose glow is cast by a glow-only copy. */
    protected castsBranchGlow(
        node: Pick<TNodeClass, 'datumIndex' | 'path'>,
        glow: NormalisedDropShadowOptions | undefined,
        highlightedNode: TNodeClass | undefined
    ): boolean {
        return (
            glow?.enabled === true &&
            highlightedNode != null &&
            highlightedNode.datumIndex !== node.datumIndex &&
            this.getHierarchyHighlightState(false, highlightedNode, node) === HierarchyHighlightState.Branch
        );
    }

    /** The glow on one copy of a node, in `fillGlow`: the glow-only copy casts that of the highlight copy, which has none itself. */
    protected resolveNodeGlow(
        glow: NormalisedDropShadowOptions | undefined,
        isHighlight: boolean,
        hoveredInPlace: boolean,
        hoveredGlows: boolean,
        glowOnly: boolean
    ): NormalisedDropShadowOptions | undefined {
        // The glow of the hovered node is cut by its footprint after the merge, as it cuts the glows of its branch; theirs are not.
        if (glowOnly) return isHighlight || glow == null ? glow : getSelfCutGlow(glow);
        if (isHighlight) return;
        if (!hoveredInPlace) return glow;
        return hoveredGlows ? CUT_ONLY_GLOW : undefined;
    }

    public override getHighlightStateString(
        _datum: _ModuleSupport.HighlightNodeDatum | undefined,
        isHighlight?: boolean,
        datumIndex?: _ModuleSupport.DatumIndex,
        _legendItemValues?: string[]
    ): ReturnType<typeof toHierarchyHighlightString> {
        if (!this.isHighlightEnabled()) {
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
