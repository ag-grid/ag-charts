import {
    type AgTreemapHighlightState,
    type AgTreemapSeriesItemStylerParams,
    type AgTreemapSeriesLabelFormatterParams,
    type FontStyle,
    type FontWeight,
    type TextAlign,
    type VerticalAlign,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    BBox,
    type BoxBounds,
    type CallbackParamRules,
    type FittedLabelStack,
    type FontOptions,
    Group,
    type LabelFit,
    type LabelFitDescriptor,
    type NormalisedAutoSizedSecondaryLabelOptions,
    type NormalisedColorType,
    type NormalisedTextOrSegments,
    type NormalisedTreemapSeriesOwnOptions,
    type NormalisedTreemapSeriesStyle,
    type OrientationAnchor,
    type PlacedLabel,
    type Point,
    type PointLabelDatum,
    type PositionedLabelCandidate,
    Rect,
    type RequireOptional,
    type ResolvedTextAlign,
    STROKE_STYLE_THEME_DEFAULTS,
    Selection,
    Text,
    Transformable,
    cachedTextMeasurer,
    cycledValue,
    drawnLineHeight,
    findDiscreteColorBinLabel,
    findLargestFittingFontSize,
    fitLabelText,
    fontWithSize,
    formatValue,
    isErased,
    isGradientFill,
    isNumberEqual,
    measureLabelText,
    mergeDefaults,
    resolveMinimumFontSize,
    resolveTextAlign,
    toPlainText,
    wrapLines,
} from 'ag-charts-core';
import type { PaddingOptions } from 'ag-charts-types';

import { HierarchyDataSet } from '../../charts/hierarchyDataSet';
import {
    HierarchyHighlightState,
    HierarchyNode,
    HierarchySeries,
    toHierarchyHighlightString,
} from '../hierarchy/hierarchySeries';
import { autoSizedLabelFit, labelPairBlocks } from '../util/autoSizedLabelFit';

const { createDatumId, SelectionState, expandLabelBoxExtent, getLabelStyles } = _ModuleSupport;

class TreemapNode extends HierarchyNode<TreemapNode> {
    labelValue: string | undefined = undefined;
    secondaryLabelValue: string | undefined = undefined;
    // Leaf-only: preserves the formatter's segment output so image segments survive the squarify step.
    labelText: NormalisedTextOrSegments | undefined = undefined;
    secondaryLabelText: NormalisedTextOrSegments | undefined = undefined;
    label: LabelLayout | undefined = undefined;
    secondaryLabel: LabelLayout | undefined = undefined;
    bbox: BBox | undefined = undefined;
    padding: Padding | undefined = undefined;
    // Layout probes the same group size repeatedly while squarifying.
    groupTitle: { width: number; height: number; title: GroupTitle | undefined } | undefined = undefined;
}

interface GroupTitle {
    text: string;
    fontSize: number;
    labelHeight: number;
    bandHeight: number;
}

type TreemapLabelOptions = NormalisedAutoSizedSecondaryLabelOptions<AgTreemapSeriesLabelFormatterParams> & {
    textAlign: TextAlign;
    verticalAlign: VerticalAlign;
};

interface TreemapPlacedLabelDatum extends PointLabelDatum {
    readonly node: TreemapNode;
    /** Which text node each block of the stack renders into. */
    readonly tags: readonly TextNodeTag[];
    /** The room inside the tile or group header the label is placed in. */
    readonly room: BoxBounds;
}

interface TreemapLabelCandidate extends PositionedLabelCandidate {
    readonly anchor: OrientationAnchor;
}

const NO_PADDING: Required<PaddingOptions> = { top: 0, right: 0, bottom: 0, left: 0 };

function labelFitDescriptor(
    text: NormalisedTextOrSegments,
    label: TreemapLabelOptions,
    overflowWidth?: number,
    boxPadding = expandLabelBoxExtent(label)
): LabelFitDescriptor {
    const fit = autoSizedLabelFit(text, label, boxPadding);
    if (fit.fitOverflow == null || overflowWidth == null) return fit;
    return { ...fit, fitOverflow: { ...fit.fitOverflow, maxWidth: overflowWidth } };
}

function pairTags(primary: unknown, secondary: unknown): TextNodeTag[] {
    const tags: TextNodeTag[] = [];
    if (primary != null) tags.push(TextNodeTag.Primary);
    if (secondary != null) tags.push(TextNodeTag.Secondary);
    return tags;
}

function boxHeightOf(padding: Required<PaddingOptions> | undefined) {
    return padding == null ? 0 : padding.top + padding.bottom;
}

type Side = 'left' | 'right' | 'top' | 'bottom';

interface Padding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

interface LabelLayout {
    text: NormalisedTextOrSegments;
    fontSize: number;
    lineHeight: number;
    fontStyle: FontStyle;
    fontFamily: string;
    fontWeight: FontWeight;
    color: string;
    textAlign: TextAlign;
    verticalAlign: VerticalAlign;
    x: number;
    y: number;
}

enum TextNodeTag {
    Primary,
    Secondary,
}

type ItemStyle = Pick<NormalisedTreemapSeriesStyle, 'fill' | 'stroke'> &
    Omit<Required<NormalisedTreemapSeriesStyle>, 'fill' | 'stroke'>;
type HighlightStyle = Partial<ItemStyle> & { opacity?: number };

function nodeSize(node: TreemapNode) {
    return node.children.length > 0 ? node.sumSize - node.sizeValue : node.sizeValue;
}

const textAlignFactors: Record<ResolvedTextAlign, number | undefined> = {
    left: 0,
    center: 0.5,
    right: 1,
};

const verticalAlignFactors: Record<VerticalAlign, number | undefined> = {
    top: 0,
    middle: 0.5,
    bottom: 1,
};

// When the pair fits, only a `middle` label can meet an edge-aligned one.
function clearOfEdge(
    y: number,
    height: number,
    edgeY: number,
    edgeHeight: number,
    edgeAlign: VerticalAlign,
    spacing: number
) {
    const gap = (edgeHeight + height) * 0.5 + spacing;
    return edgeAlign === 'top' ? Math.max(y, edgeY + gap) : Math.min(y, edgeY - gap);
}

export class TreemapSeries extends HierarchySeries<TreemapNode, Rect<TreemapNode>, NormalisedTreemapSeriesOwnOptions> {
    static override readonly className = 'TreemapSeries';
    static readonly type = 'treemap' as const;

    override NodeClass = TreemapNode;

    private readonly rectGroup = this.contentGroup.appendChild(new Group({ batchShadows: 'by-layer' }));

    protected readonly datumSelection = Selection.select<Rect<TreemapNode>>(this.rectGroup, Rect<TreemapNode>);
    private readonly labelSelection = Selection.select<Group<TreemapNode>>(this.labelGroup, Group<TreemapNode>);
    private readonly highlightSelection = Selection.select<Rect<TreemapNode>>(this.rectGroup, Rect);

    protected override _data?: HierarchyDataSet<any>;
    protected override _chartData?: HierarchyDataSet<any>;
    override get data(): HierarchyDataSet<any> | undefined {
        const result = super.data;
        if (!(result instanceof HierarchyDataSet)) {
            return undefined;
        }
        return result;
    }

    private groupTitle(node: TreemapNode, bbox: BBox): GroupTitle | undefined {
        const { label, padding } = this.options.group;
        const { labelValue } = node;
        if (!label.enabled || labelValue == null) return;

        const cached = node.groupTitle;
        if (cached?.width === bbox.width && cached.height === bbox.height) return cached.title;

        const title = this.fitGroupTitle(labelValue, bbox, padding);
        node.groupTitle = { width: bbox.width, height: bbox.height, title };
        return title;
    }

    private fitGroupTitle(labelValue: string, bbox: BBox, padding: number): GroupTitle | undefined {
        const heightRatioThreshold = 3;
        const label = this.groupLabelOptions();
        const { fontSize, maxHeight = Infinity } = label;
        const floorFontSize = resolveMinimumFontSize(label.minimumFontSize, fontSize);
        const heightCap = bbox.height / heightRatioThreshold;
        if (floorFontSize > bbox.width / heightRatioThreshold || floorFontSize > heightCap) return;

        const width = Math.min(bbox.width - 2 * padding, label.maxWidth ?? Infinity);
        // One line at the floor size always fits, however small the one-third cap.
        const floorLineHeight = cachedTextMeasurer(fontWithSize(label, floorFontSize)).lineHeight();
        const height = Math.min(maxHeight, Math.max(heightCap, floorLineHeight));
        const { policy, fitOverflow } = labelFitDescriptor(labelValue, label, width);
        const bounded = { ...policy, maxWidth: width, maxHeight: height };
        const fitAt = (size: number, fit: LabelFit) => {
            const font = fontWithSize(label, size);
            const text = toPlainText(fitLabelText(labelValue, fit, font));
            return isErased(text)
                ? undefined
                : { text, fontSize: size, labelHeight: measureLabelText(text, font).height };
        };
        const fitted =
            findLargestFittingFontSize(floorFontSize, fontSize, (size, atFloor) => {
                // Truncating is the last resort, once the title is at its minimum size.
                const step = fitAt(size, atFloor ? bounded : { ...bounded, overflowStrategy: 'hide' });
                // `'never'` keeps every manual line whatever the height, so it can still be too tall here.
                return step == null || step.labelHeight > height ? undefined : step;
            }) ?? (fitOverflow == null ? undefined : fitAt(floorFontSize, fitOverflow));
        if (fitted == null) return;
        const { labelHeight } = fitted;

        const natural = cachedTextMeasurer(label).measureLines(
            wrapLines(labelValue, { maxWidth: width, font: label, textWrap: label.wrapping })
        );
        const bandHeight = Math.max(labelHeight, Math.min(Math.max(natural.height, fontSize), height));
        return { ...fitted, bandHeight };
    }

    /** Group headers are a single line that truncates unless the user configures their fit. */
    private groupLabelOptions(): TreemapLabelOptions {
        const { label } = this.options.group;
        return { ...label, wrapping: label.wrapping ?? 'never', truncate: label.truncate ?? true };
    }

    private getNodePadding(node: TreemapNode, bbox: BBox) {
        if (node.parent == null) {
            return { top: 0, right: 0, bottom: 0, left: 0 };
        } else if (node.children.length === 0) {
            const { padding } = this.options.tile;
            return { top: padding, right: padding, bottom: padding, left: padding };
        }

        const {
            padding,
            label: { spacing },
        } = this.options.group;
        const title = this.groupTitle(node, bbox);
        const titleHeight = title == null ? 0 : title.bandHeight + spacing;

        return {
            top: padding + titleHeight,
            right: padding,
            bottom: padding,
            left: padding,
        };
    }

    private sortChildren({ children }: TreemapNode): number[] {
        return Array.from(children, (_, i) => i)
            .filter((i) => nodeSize(children[i]) > 0)
            .sort((aIndex, bIndex) => nodeSize(children[bIndex]) - nodeSize(children[aIndex]));
    }

    // Only nodes with a bbox render, so resetting these fields is what hides the node.
    private hideNode(node: TreemapNode) {
        node.bbox = undefined;
        node.padding = undefined;
        node.midPoint.x = Number.NaN;
        node.midPoint.y = Number.NaN;
    }

    // A group whose box can't fit its own padding would render an empty container; leaves never count as collapsed.
    private collapses(node: TreemapNode, bbox: BBox): boolean {
        if (node.children.length === 0) return false;
        if (bbox.width <= 0 || bbox.height <= 0) return true;
        const padding = node.datum == null ? { top: 0, right: 0, bottom: 0, left: 0 } : this.getNodePadding(node, bbox);
        return bbox.width - padding.left - padding.right <= 0 || bbox.height - padding.top - padding.bottom <= 0;
    }

    /**
     * Squarified Treemap algorithm
     * https://www.win.tue.nl/~vanwijk/stm.pdf
     */
    private squarify(node: TreemapNode, bbox: BBox) {
        const { datum, children } = node;

        if (bbox.width <= 0 || bbox.height <= 0) {
            node.walk((n) => this.hideNode(n));
            return;
        }

        const padding = datum == null ? { top: 0, right: 0, bottom: 0, left: 0 } : this.getNodePadding(node, bbox);

        if (node.parent == null) {
            this.hideNode(node);
        } else {
            node.bbox = bbox;
            node.padding = padding;
            node.midPoint.x = bbox.x + bbox.width / 2;
            node.midPoint.y = bbox.y;
        }

        const sortedChildrenIndices = this.sortChildren(node);

        const allLeafNodes = sortedChildrenIndices.every((sortedIndex) => children[sortedIndex].children.length === 0);

        const width = bbox.width - padding.left - padding.right;
        const height = bbox.height - padding.top - padding.bottom;

        // A group whose inner box collapses under its own padding can lay out no child, so hide the whole subtree.
        if (width <= 0 || height <= 0) {
            if (children.length > 0) {
                node.walk((n) => this.hideNode(n));
            }
            return;
        }

        const innerBox = new BBox(bbox.x + padding.left, bbox.y + padding.top, width, height);

        // Drop any child too small to fit its own padding and re-lay the survivors to reclaim its space; this converges since removing a collapsed child only enlarges the rest.
        let indices = sortedChildrenIndices;
        const collapsed = new Set<TreemapNode>();
        let layout = this.layoutChildren(children, indices, innerBox, allLeafNodes);
        let collapsing = layout.filter(({ child, bbox: box }) => this.collapses(child, box));

        while (collapsing.length > 0) {
            for (const { child } of collapsing) {
                collapsed.add(child);
            }
            indices = indices.filter((idx) => !collapsed.has(children[idx]));
            if (indices.length === 0) {
                // Every child collapses, so render nothing rather than an empty container.
                node.walk((n) => this.hideNode(n));
                return;
            }
            layout = this.layoutChildren(children, indices, innerBox, allLeafNodes);
            collapsing = layout.filter(({ child, bbox: box }) => this.collapses(child, box));
        }

        for (const child of collapsed) {
            child.walk((n) => this.hideNode(n));
        }
        for (const { child, bbox: box } of layout) {
            this.squarify(child, box);
        }
    }

    /**
     * Allocate a box to each of the given children with the squarified layout, without recursing.
     * Returning the boxes (rather than laying out subtrees inline) lets the caller detect children
     * that cannot render and re-run the allocation for the survivors.
     */
    private layoutChildren(
        children: TreemapNode[],
        indices: number[],
        innerBox: BBox,
        allLeafNodes: boolean
    ): { child: TreemapNode; bbox: BBox }[] {
        const childAt = (i: number) => children[indices[i]];
        const numChildren = indices.length;
        const targetTileAspectRatio = 1; // The width and height will tend to this ratio
        const result: { child: TreemapNode; bbox: BBox }[] = [];

        let stackSum = 0;
        let startIndex = 0;
        let minRatioDiff = Infinity;
        let partitionSum = indices.reduce((sum, idx) => sum + nodeSize(children[idx]), 0);
        const partition = innerBox.clone();

        let i = 0;
        while (i < numChildren) {
            const value = nodeSize(childAt(i));
            const firstValue = nodeSize(childAt(startIndex));
            const isVertical = partition.width < partition.height;
            stackSum += value;

            const partThickness = isVertical ? partition.height : partition.width;
            const partLength = isVertical ? partition.width : partition.height;
            const firstTileLength = (partLength * firstValue) / stackSum;
            let stackThickness = (partThickness * stackSum) / partitionSum;

            const ratio = Math.max(firstTileLength, stackThickness) / Math.min(firstTileLength, stackThickness);
            const diff = Math.abs(targetTileAspectRatio - ratio);
            if (diff < minRatioDiff) {
                minRatioDiff = diff;
                i++;
                continue;
            }

            stackSum -= value;
            stackThickness = (partThickness * stackSum) / partitionSum;
            let start = isVertical ? partition.x : partition.y;
            for (let j = startIndex; j < i; j++) {
                const child = childAt(j);
                const childSize = nodeSize(child);

                const x = isVertical ? start : partition.x;
                const y = isVertical ? partition.y : start;
                const length = (partLength * childSize) / stackSum;
                const stackWidth = isVertical ? length : stackThickness;
                const stackHeight = isVertical ? stackThickness : length;

                const childBbox = new BBox(x, y, stackWidth, stackHeight);
                this.applyGap(innerBox, childBbox, allLeafNodes);
                result.push({ child, bbox: childBbox });

                partitionSum -= childSize;
                start += length;
            }

            if (isVertical) {
                partition.y += stackThickness;
                partition.height -= stackThickness;
            } else {
                partition.x += stackThickness;
                partition.width -= stackThickness;
            }
            startIndex = i;
            stackSum = 0;
            minRatioDiff = Infinity;
            // Deliberately don't increment i on this control flow.
        }

        const isVertical = partition.width < partition.height;
        let start = isVertical ? partition.x : partition.y;
        for (let childIdx = startIndex; childIdx < numChildren; childIdx++) {
            const child = childAt(childIdx);
            const x = isVertical ? start : partition.x;
            const y = isVertical ? partition.y : start;
            const part = nodeSize(child) / partitionSum;
            const childWidth = partition.width * (isVertical ? part : 1);
            const childHeight = partition.height * (isVertical ? 1 : part);
            const childBox = new BBox(x, y, childWidth, childHeight);
            this.applyGap(innerBox, childBox, allLeafNodes);
            result.push({ child, bbox: childBox });
            start += isVertical ? childWidth : childHeight;
        }

        return result;
    }

    private applyGap(innerBox: BBox, childBox: BBox, allLeafNodes: boolean) {
        const gap = allLeafNodes ? this.options.tile.gap * 0.5 : this.options.group.gap * 0.5;
        const getBounds = (box: BBox): Record<Side, number> => ({
            left: box.x,
            top: box.y,
            right: box.x + box.width,
            bottom: box.y + box.height,
        });
        const innerBounds = getBounds(innerBox);
        const childBounds = getBounds(childBox);
        const sides: Side[] = ['top', 'right', 'bottom', 'left'];
        for (const side of sides) {
            if (!isNumberEqual(innerBounds[side], childBounds[side])) {
                childBox.shrink(gap, side);
            }
        }
    }

    override createNodeData() {
        return undefined;
    }

    protected getItemStyle(
        nodeDatum: Pick<TreemapNode, 'path' | 'datumIndex' | 'datum' | 'depth' | 'colorValue'>,
        isLeaf: boolean,
        isHighlight: boolean
    ) {
        const { options, colorScale } = this;
        const { itemStyler, colorKey } = options;
        const { missingDataFill } = options.colorScale;
        const rootIndex = nodeDatum.path?.[0] ?? 0;

        const fills = isLeaf ? options.fills : options.group.fills;
        const strokes = isLeaf ? options.strokes : options.undocumentedGroupStrokes;
        const index = isLeaf ? rootIndex : (nodeDatum.depth ?? -1);

        const highlightedNode = this.getActiveHighlightNode();
        const tileHighlightState = this.getHierarchyHighlightState(isHighlight, highlightedNode, nodeDatum);
        const groupHighlightState = this.getGroupHighlightState(isHighlight, highlightedNode, nodeDatum);

        const highlightState = isLeaf ? tileHighlightState : groupHighlightState;
        const highlightStyle = isLeaf
            ? this.getTileHighlightStyle(tileHighlightState, groupHighlightState, highlightedNode)
            : this.getGroupHighlightStyle(groupHighlightState);
        const selectionStyle = isLeaf ? this.getTileSelectionStyle(nodeDatum.datumIndex) : undefined;
        const baseStyle = mergeDefaults(selectionStyle, highlightStyle, this.itemStyle(isLeaf, fills, strokes, index));

        if (isLeaf && nodeDatum.colorValue != null && highlightStyle?.fill == null) {
            baseStyle.fill = colorScale.convert(nodeDatum.colorValue);
        } else if (isLeaf && colorKey != null && missingDataFill != null && highlightStyle?.fill == null) {
            baseStyle.fill = missingDataFill;
        }

        let style = baseStyle;

        if (itemStyler != null && nodeDatum != null) {
            const overrides = this.cachedDatumCallback(
                createDatumId(nodeDatum.datumIndex, isHighlight ? 'highlight' : 'node'),
                () => {
                    const params = this.makeItemStylerParams(
                        nodeDatum,
                        style,
                        toHierarchyHighlightString(highlightState)
                    );
                    return this.ctx.optionsGraphService.resolvePartial(
                        ['series', `${this.declarationOrder}`],
                        this.callWithContext(itemStyler, params)
                    );
                }
            );

            if (overrides) {
                style = mergeDefaults(overrides, style);
            }
        }

        return style;
    }

    private itemStyle(
        isLeaf: boolean,
        fills: NormalisedColorType[],
        strokes: string[],
        index: number
    ): Required<NormalisedTreemapSeriesStyle> & { opacity: number } {
        const {
            fillOpacity,
            strokeWidth,
            strokeOpacity,
            fill = cycledValue(fills, index),
            stroke = isLeaf ? cycledValue(strokes, index) : strokes[Math.min(index, strokes.length)],
        } = isLeaf ? this.options.tile : this.options.group;
        return { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, opacity: 1 };
    }

    private makeItemStylerParams(
        nodeDatum: Pick<TreemapNode, 'datum' | 'datumIndex' | 'depth'>,
        style: Required<ItemStyle>,
        highlightState: AgTreemapHighlightState
    ) {
        const { id: seriesId } = this;
        const { colorKey, childrenKey, sizeKey, labelKey, secondaryLabelKey } = this.options;

        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            seriesId,
            datum: nodeDatum.datum,
            depth: nodeDatum.depth ?? -1,
            colorKey,
            childrenKey,
            sizeKey,
            labelKey,
            secondaryLabelKey,
            highlightState,
            selectionState: this.getSelectionStateString(nodeDatum.datumIndex),
            candidateState: this.getCandidateStateString(nodeDatum.datumIndex),
            ...style,
            fill,
        } satisfies CallbackParamRules<AgTreemapSeriesItemStylerParams<unknown, unknown>>;
    }

    override updateSelections() {
        const { tile } = this.options;
        this.usesPlacedLabels = tile.label.enabled || tile.secondaryLabel.enabled || this.options.group.label.enabled;
        const highlightedNode = this.getActiveHighlightNode();

        const getDatumId = (node: TreemapNode) => node.datumIndex;
        this.highlightSelection.update(highlightedNode == null ? [] : [highlightedNode], undefined, getDatumId);

        if (!this.nodeDataRefresh) {
            return;
        }
        this.nodeDataRefresh = false;

        const { seriesRect } = this.chart ?? {};
        if (!seriesRect) return;

        const descendants = Array.from(this.rootNode!);

        const updateLabelGroup = (group: Group) => {
            group.append([new Text({ tag: TextNodeTag.Primary }), new Text({ tag: TextNodeTag.Secondary })]);
        };

        this.datumSelection.update(descendants, undefined, (node) => node.datumIndex);
        this.labelSelection.update(descendants, updateLabelGroup, (node) => node.datumIndex);
    }

    /** The shadows of the tiles and groups, which this series keeps there rather than on its own `shadow`. */
    protected override getItemShadowOptions() {
        return [this.options.tile.shadow, this.options.group.shadow];
    }

    protected override getActiveHighlightNode(): TreemapNode | undefined {
        const highlightedNode = super.getActiveHighlightNode();
        return this.isNodeHighlightable(highlightedNode) ? highlightedNode : undefined;
    }

    /** A group that isn't interactive gets no highlight copy, so its in-place copy keeps its shadow. */
    protected override getRedrawnDatumIndex(highlightedDatum: _ModuleSupport.HighlightNodeDatum | undefined) {
        return this.isNodeHighlightable(highlightedDatum as TreemapNode | undefined)
            ? super.getRedrawnDatumIndex(highlightedDatum)
            : undefined;
    }

    private isNodeHighlightable(node: TreemapNode | undefined) {
        return node == null || node.children.length === 0 || this.options.group.interactive;
    }

    /** Whether either tile or group sets one, for the series-wide check; each item resolves its own in `updateNodes`. */
    protected override getHighlightedItemShadow() {
        const { tile, group } = this.options;
        return tile.highlight.highlightedItem?.shadow ?? group.highlight.highlightedItem?.shadow;
    }

    updateNodes() {
        const { rootNode, data } = this;
        const { childrenKey, colorKey, colorName, labelKey, secondaryLabelKey, sizeKey, sizeName, tile, group } =
            this.options;
        const { seriesRect } = this.chart ?? {};

        if (!seriesRect || !data) return;

        this.rootNode?.walk((node) => {
            const { datum, depth, children } = node;
            const isLeaf = children.length === 0;

            const labelStyle = isLeaf ? tile.label : group.label;
            let labelValue: NormalisedTextOrSegments | undefined;
            if (labelStyle.enabled && datum != null && depth != null && labelKey != null) {
                const value = (datum as any)[labelKey];
                labelValue = this.getLabelText<AgTreemapSeriesLabelFormatterParams>(
                    value,
                    datum,
                    labelKey,
                    'label',
                    [],
                    labelStyle,
                    {
                        depth,
                        datum,
                        childrenKey,
                        colorKey,
                        colorName,
                        labelKey,
                        secondaryLabelKey,
                        sizeKey,
                        sizeName,
                        value,
                    }
                );
            }
            if (labelValue === '') {
                labelValue = undefined;
            }

            let secondaryLabelValue: NormalisedTextOrSegments | undefined;
            if (tile.secondaryLabel.enabled && isLeaf && datum != null && depth != null && secondaryLabelKey != null) {
                const value = (datum as any)[secondaryLabelKey];
                secondaryLabelValue = this.getLabelText<AgTreemapSeriesLabelFormatterParams>(
                    value,
                    datum,
                    secondaryLabelKey,
                    'secondaryLabel',
                    [],
                    tile.secondaryLabel,
                    {
                        depth,
                        datum,
                        childrenKey,
                        colorKey,
                        colorName,
                        labelKey,
                        secondaryLabelKey,
                        sizeKey,
                        sizeName,
                        value,
                    }
                );
            }
            if (secondaryLabelValue === '') {
                secondaryLabelValue = undefined;
            }

            node.groupTitle = undefined;
            node.labelValue = toPlainText(labelValue);
            node.secondaryLabelValue = toPlainText(secondaryLabelValue);
            // Image-bearing segments are preserved for leaf tiles only; group headers stay text-only (alt-text fallback).
            node.labelText = isLeaf ? labelValue : undefined;
            node.secondaryLabelText = isLeaf ? secondaryLabelValue : undefined;
        });

        const { width, height } = seriesRect;
        this.squarify(rootNode!, new BBox(0, 0, width, height));

        // Placed labels are written back once the label manager has fitted them to this layout.
        if (!this.usesPlacedLabels) {
            this.rootNode?.walk((node) => {
                node.label = undefined;
                node.secondaryLabel = undefined;
            });
        }

        const fillBBox: _ModuleSupport.ShapeFillBBox = {
            series: new BBox(0, 0, width, height),
            axis: new BBox(0, 0, width, height),
        };

        const updateRectFn = (node: TreemapNode, rect: Rect, isHighlight: boolean) => {
            const { bbox } = node;
            if (bbox == null) {
                rect.visible = false;
                return;
            }

            const { depth = -1 } = node;
            const isLeaf = node.children.length === 0;

            const style = this.getItemStyle(node, isLeaf, isHighlight);

            rect.crisp = true;

            rect.setStyleProperties(style, fillBBox);

            // Tile and group highlights sit under `tile.highlight` and `group.highlight`, not the series' `highlight`.
            const itemOptions = isLeaf ? tile : group;
            rect.fillShadow = this.resolveItemShadowWith(
                itemOptions.highlight.highlightedItem?.shadow,
                itemOptions.shadow,
                isHighlight,
                node.datumIndex
            );
            rect.cornerRadius = isLeaf ? tile.cornerRadius : group.cornerRadius;
            rect.zIndex = [0, depth, isHighlight ? 1 : 0];

            const onlyLeaves = node.parent?.children.every((n) => n.children.length === 0);
            const parentBbox = node.parent == null ? undefined : node.parent.bbox;
            const parentPadding = node.parent == null ? undefined : node.parent.padding;
            if (onlyLeaves === true && parentBbox != null && parentPadding != null) {
                rect.clipBBox = bbox;
                rect.x = parentBbox.x + parentPadding.left;
                rect.y = parentBbox.y + parentPadding.top;
                rect.width = parentBbox.width - (parentPadding.left + parentPadding.right);
                rect.height = parentBbox.height - (parentPadding.top + parentPadding.bottom);
            } else {
                rect.clipBBox = undefined;
                rect.x = bbox.x;
                rect.y = bbox.y;
                rect.width = bbox.width;
                rect.height = bbox.height;
            }

            rect.visible = true;
        };

        this.datumSelection.each((rect, datum) => updateRectFn(datum, rect, false));

        this.highlightSelection.each((rect, datum) => {
            updateRectFn(datum, rect, true);
        });

        if (!this.usesPlacedLabels) this.updateLabelNodes();
    }

    private labelFormatterParams(node: TreemapNode): RequireOptional<AgTreemapSeriesLabelFormatterParams> {
        const { childrenKey, colorKey, colorName, labelKey, secondaryLabelKey, sizeKey, sizeName } = this.options;
        return {
            childrenKey,
            colorKey,
            colorName: colorName ?? colorKey,
            depth: node.depth ?? Number.NaN,
            labelKey,
            secondaryLabelKey,
            sizeKey,
            sizeName: sizeName ?? sizeKey,
        };
    }

    private labelPath(isLeaf: boolean, tag: TextNodeTag) {
        if (tag === TextNodeTag.Primary) {
            return ['series', `${this.declarationOrder}`, isLeaf ? 'tile' : 'group', 'label'];
        }
        return ['series', `${this.declarationOrder}`, 'tile', 'secondaryLabel'];
    }

    /** A label at rest in its `itemStyler`'s font and box, so the fit reserves room for restyled text. */
    private styledLabel(node: TreemapNode, props: TreemapLabelOptions, tag: TextNodeTag) {
        if (props.itemStyler == null) return { label: props, box: expandLabelBoxExtent(props) };
        const path = this.labelPath(node.children.length === 0, tag);
        const style = getLabelStyles(this, node, this.labelFormatterParams(node), props, false, undefined, path);
        const { fontSize, fontStyle = props.fontStyle, fontWeight = props.fontWeight, lineHeight } = style;
        const label = {
            ...props,
            fontSize,
            fontStyle,
            fontWeight,
            fontFamily: style.fontFamily ?? props.fontFamily,
            lineHeight,
        };
        return { label, box: expandLabelBoxExtent(style) };
    }

    private styledLabelFit(
        node: TreemapNode,
        text: NormalisedTextOrSegments,
        props: TreemapLabelOptions,
        tag: TextNodeTag
    ) {
        const { label, box } = this.styledLabel(node, props, tag);
        return labelFitDescriptor(text, label, undefined, box);
    }

    private updateLabelNodes() {
        const { tile, group } = this.options;
        const updateLabelFn = (node: TreemapNode, text: Text, tag: TextNodeTag, highlighted: boolean) => {
            const isLeaf = node.children.length === 0;
            const label = tag === TextNodeTag.Primary ? node.label : node.secondaryLabel;
            if (label == null) {
                text.visible = false;
                return;
            }
            let labelProps;
            if (tag === TextNodeTag.Primary) {
                labelProps = isLeaf ? tile.label : group.label;
            } else {
                labelProps = tile.secondaryLabel;
            }
            const labelPath = this.labelPath(isLeaf, tag);

            const { opacity: highlightOpacity } = this.getItemStyle(node, isLeaf, highlighted) ?? {};

            const params = this.labelFormatterParams(node);
            const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
            const style = getLabelStyles(this, node, params, labelProps, highlighted, activeHighlight, labelPath);
            text.text = label.text;
            text.fontSize = label.fontSize;
            text.lineHeight = label.lineHeight;
            text.fontStyle = label.fontStyle;
            text.fontFamily = label.fontFamily;
            text.fontWeight = label.fontWeight;
            text.fillOpacity = highlightOpacity ?? 1;
            text.fill = style.color;
            text.setBoxing(style);
            text.textAlign = label.textAlign;
            text.textBaseline = label.verticalAlign;
            text.x = label.x;
            text.y = label.y;
            text.visible = true;

            text.zIndex = 1;
        };
        const highlightedDatum = this.getActiveHighlightNode();
        for (const text of this.labelSelection.selectByClass(Text)) {
            // eslint-disable-next-line sonarjs/deprecation
            const datum = text.unsafeClosestDatum();
            updateLabelFn(datum, text, text.tag, datum === highlightedDatum);
        }
    }

    override getLabelData(): PointLabelDatum[] {
        if (!this.usesPlacedLabels) return [];
        const data: TreemapPlacedLabelDatum[] = [];
        this.rootNode?.walk((node) => {
            const datum = node.children.length === 0 ? this.tileLabelDatum(node) : this.groupLabelDatum(node);
            if (datum != null) data.push(datum);
        });
        return data;
    }

    private tileLabelDatum(node: TreemapNode): TreemapPlacedLabelDatum | undefined {
        const { bbox, labelText: primaryText, secondaryLabelText: secondaryText } = node;
        if (bbox == null) return;
        const { tile } = this.options;
        const primary =
            primaryText == null ? undefined : this.styledLabelFit(node, primaryText, tile.label, TextNodeTag.Primary);
        const secondary =
            secondaryText == null
                ? undefined
                : this.styledLabelFit(node, secondaryText, tile.secondaryLabel, TextNodeTag.Secondary);
        const lead = primary ?? secondary;
        if (lead == null) return;
        const blocks = labelPairBlocks(primary, secondary);
        const tags = pairTags(primary, secondary);

        const { padding } = tile;
        const room = {
            x: bbox.x + padding,
            y: bbox.y + padding,
            width: Math.max(0, bbox.width - 2 * padding),
            height: Math.max(0, bbox.height - 2 * padding),
        };
        const alwaysShow = blocks.some(({ fit }) => fit.fitOverflow != null);
        const { threshold } = (primary == null ? tile.secondaryLabel : tile.label).collision ?? {};
        return this.placedLabelDatum(node, lead, room, tags, alwaysShow, threshold, {
            blocks,
            spacing: tile.label.spacing,
        });
    }

    private groupLabelDatum(node: TreemapNode): TreemapPlacedLabelDatum | undefined {
        const { bbox, labelValue } = node;
        if (bbox == null || labelValue == null) return;
        const title = this.groupTitle(node, bbox);
        if (title == null) return;
        const { padding } = this.options.group;
        const label = this.groupLabelOptions();
        const room = {
            x: bbox.x + padding,
            y: bbox.y + padding,
            width: Math.max(0, Math.min(bbox.width - 2 * padding, label.maxWidth ?? Infinity)),
            height: title.bandHeight,
        };
        // The series sized the title to its band, so the engine only places it.
        const sized = { ...label, fontSize: title.fontSize, minimumFontSize: title.fontSize };
        const fit = labelFitDescriptor(
            title.text,
            sized,
            room.width,
            this.styledLabel(node, label, TextNodeTag.Primary).box
        );
        const { alwaysShow = false, threshold } = label.collision ?? {};
        return this.placedLabelDatum(node, fit, room, [TextNodeTag.Primary], alwaysShow, threshold);
    }

    private placedLabelDatum(
        node: TreemapNode,
        fit: LabelFitDescriptor,
        room: BoxBounds,
        tags: TextNodeTag[],
        alwaysShow: boolean,
        threshold: number | undefined,
        stack?: TreemapPlacedLabelDatum['stack']
    ): TreemapPlacedLabelDatum {
        const isLeaf = node.children.length === 0;
        const { textAlign, verticalAlign } = isLeaf ? this.options.tile.label : this.options.group.label;
        const resolvedAlign = resolveTextAlign(textAlign, this.ctx.domManager.isRtl);
        const anchor: OrientationAnchor = {
            x: room.x + room.width * (textAlignFactors[resolvedAlign] ?? 0.5),
            y: room.y + room.height * (verticalAlignFactors[verticalAlign] ?? 0.5),
            textAlign: resolvedAlign,
            textBaseline: verticalAlign,
        };
        const { width, height } = measureLabelText(fit.text, fit.font);
        const candidate: TreemapLabelCandidate = {
            box: { x: anchor.x - width / 2, y: anchor.y - height / 2, width, height },
            region: room,
            anchor,
            // A stack measures its own drawn boxes, and a group title's band is sized to its glyph alone.
            fitTo: { container: room, anchor, padding: NO_PADDING },
        };
        return {
            point: { x: 0, y: 0, size: 0 },
            label: { text: fit.text, width, height },
            fit,
            stack,
            anchor: undefined,
            placement: undefined,
            neverDrop: alwaysShow,
            threshold,
            positionedCandidates: [candidate],
            ownBox: room,
            node,
            tags,
            room,
        };
    }

    override updatePlacedLabelData(placed: PlacedLabel<TreemapNode>[]) {
        this.rootNode?.walk((node) => {
            node.label = undefined;
            node.secondaryLabel = undefined;
        });
        for (const placedLabel of placed as PlacedLabel<unknown>[]) {
            const datum = placedLabel.datum as TreemapPlacedLabelDatum;
            if (datum.stack == null) {
                this.writeGroupTitle(datum, placedLabel);
            } else if (placedLabel.stack != null) {
                this.writeTileLabels(datum, placedLabel.stack);
            }
        }
        this.updateLabelNodes();
    }

    private writeGroupTitle({ node, fit }: TreemapPlacedLabelDatum, placed: PlacedLabel<unknown>) {
        const label = this.groupLabelOptions();
        const { anchor } = placed.candidate as TreemapLabelCandidate;
        node.label = this.labelLayout(
            label,
            placed.text,
            placed.fontSize ?? fit?.font.fontSize ?? label.fontSize,
            anchor.x + (placed.offsetX ?? 0),
            anchor.y + (placed.offsetY ?? 0),
            label.verticalAlign
        );
    }

    /**
     * Lays the fitted blocks out within the tile: each block aligns on its own `verticalAlign`, and a pair
     * that shares an alignment, or overflows the tile, is kept together as one block.
     */
    private writeTileLabels({ node, room, tags, stack: labelStack }: TreemapPlacedLabelDatum, stack: FittedLabelStack) {
        const { tile } = this.options;
        const { spacing } = tile.label;
        const blocks = tags.map((tag, index) => {
            const fitted = stack.blocks[index];
            const props = tag === TextNodeTag.Primary ? tile.label : tile.secondaryLabel;
            const blockFit = labelStack?.blocks[index].fit;
            const font = blockFit?.font ?? props;
            const padding = blockFit?.boxPadding ?? expandLabelBoxExtent(props);
            return fitted == null
                ? undefined
                : { tag, fitted, props, font, padding, height: fitted.height + boxHeightOf(padding) };
        });
        const centreY = (height: number, verticalAlign: VerticalAlign) =>
            room.y + height * 0.5 + (room.height - height) * (verticalAlignFactors[verticalAlign] ?? 0.5);

        const [first, second] = blocks;
        let firstY = first == null ? 0 : centreY(first.height, first.props.verticalAlign);
        let secondY = second == null ? 0 : centreY(second.height, second.props.verticalAlign);
        if (first != null && second != null) {
            const firstAlign = first.props.verticalAlign;
            const secondAlign = second.props.verticalAlign;
            if (firstAlign === secondAlign || stack.height > room.height) {
                const blockY = centreY(stack.height, firstAlign);
                firstY = blockY - (stack.height - first.height) * 0.5;
                secondY = blockY + (stack.height - second.height) * 0.5;
            } else if (firstAlign === 'middle') {
                firstY = clearOfEdge(firstY, first.height, secondY, second.height, secondAlign, spacing);
            } else if (secondAlign === 'middle') {
                secondY = clearOfEdge(secondY, second.height, firstY, first.height, firstAlign, spacing);
            }
        }

        const isRtl = this.ctx.domManager.isRtl;
        const write = (block: (typeof blocks)[number], boxCentreY: number) => {
            if (block == null) return;
            const { fitted, props, font, padding, tag } = block;
            const factor = textAlignFactors[resolveTextAlign(props.textAlign, isRtl)] ?? 0.5;
            const x = room.x + padding.left + (room.width - padding.left - padding.right) * factor;
            const y = boxCentreY + (padding.top - padding.bottom) * 0.5;
            const layout = this.labelLayout(props, fitted.text, fitted.fontSize, x, y, 'middle', font);
            if (tag === TextNodeTag.Primary) {
                node.label = layout;
            } else {
                node.secondaryLabel = layout;
            }
        };
        write(first, firstY);
        write(second, secondY);
    }

    private labelLayout(
        props: TreemapLabelOptions,
        text: NormalisedTextOrSegments,
        fontSize: number,
        x: number,
        y: number,
        verticalAlign: VerticalAlign,
        font: FontOptions = props
    ): LabelLayout {
        const { fontStyle = 'normal', fontFamily = props.fontFamily, fontWeight = 'normal' } = font;
        const { color = 'black', textAlign } = props;
        const lineHeight = drawnLineHeight(fontWithSize(font, fontSize));
        return {
            text,
            fontSize,
            lineHeight,
            fontStyle,
            fontFamily,
            fontWeight,
            color,
            textAlign,
            verticalAlign,
            x,
            y,
        };
    }

    private getGroupHighlightState(
        isHighlight: boolean,
        highlightedNode: TreemapNode | undefined,
        nodeDatum: Pick<TreemapNode, 'path' | 'datumIndex' | 'depth'> & Partial<Pick<TreemapNode, 'children'>>
    ): HierarchyHighlightState {
        const nodeIndex = nodeDatum.path;
        const highlightedIndex = highlightedNode?.path;
        const isDescendant = this.isDescendantDatumIndex(nodeIndex, highlightedIndex);

        if (nodeDatum.children?.length === 0) {
            if (nodeIndex == null || highlightedNode == null || highlightedNode.children?.length === 0) {
                return HierarchyHighlightState.None;
            }

            return isDescendant ? HierarchyHighlightState.Item : HierarchyHighlightState.OtherItem;
        }

        if (highlightedNode == null || highlightedNode.children?.length === 0) {
            return HierarchyHighlightState.None;
        }

        const isSibling =
            nodeDatum.depth != null && highlightedNode.depth != null && nodeDatum.depth === highlightedNode.depth;
        if (isDescendant && !isSibling) {
            return HierarchyHighlightState.None;
        }

        return isHighlight ? HierarchyHighlightState.Item : HierarchyHighlightState.OtherItem;
    }

    private getTileHighlightStyle(
        tileHighlightState: HierarchyHighlightState,
        groupHighlightState: HierarchyHighlightState,
        highlightedNode: TreemapNode | undefined
    ): HighlightStyle | undefined {
        const isGroupHighlighted = highlightedNode?.children && highlightedNode.children.length > 0;

        // When a group is highlighted, tiles only inherit fillOpacity and strokeOpacity from the group highlight style
        if (isGroupHighlighted) {
            const groupStyle = this.getGroupHighlightStyle(groupHighlightState);
            if (groupStyle?.fillOpacity == null && groupStyle?.strokeOpacity == null) {
                return undefined;
            }
            return { fillOpacity: groupStyle.fillOpacity, strokeOpacity: groupStyle.strokeOpacity };
        }

        const { highlight } = this.options.tile;
        if (!highlight.enabled) {
            return undefined;
        }

        return this.getHierarchyHighlightStyles(tileHighlightState, highlight);
    }

    private getGroupHighlightStyle(highlightState: HierarchyHighlightState): HighlightStyle | undefined {
        const { highlight } = this.options.group;
        if (!highlight.enabled) {
            return undefined;
        }
        switch (highlightState) {
            case HierarchyHighlightState.Item:
                return highlight.highlightedItem;
            case HierarchyHighlightState.OtherItem:
                return highlight.unhighlightedItem;
            default:
                return undefined;
        }
    }

    public override isSelectionEnabled(): boolean {
        return this.options.tile.selection.enabled;
    }

    public override isDatumSelectable(datumIndex: _ModuleSupport.DatumIndex): boolean {
        // Use HierarchDataSet.isLeaf() instead of this.dfsFind() for O(1) lookups:
        return this.data?.isLeaf(datumIndex) === true;
    }

    public getTileSelectionStyle(datumIndex?: _ModuleSupport.DatumIndex) {
        const { selectedItem, unselectedItem, unselectedSeries } = this.options.tile.selection;
        switch (this.getDataSelectionState(datumIndex)) {
            case SelectionState.Item:
                return selectedItem;
            case SelectionState.OtherItem:
                return unselectedItem;
            case SelectionState.OtherSeries:
                return unselectedSeries;
            default:
                return undefined;
        }
    }

    public override getHighlightStateString(
        _datum: _ModuleSupport.HighlightNodeDatum | undefined,
        isHighlight?: boolean,
        datumIndex?: _ModuleSupport.DatumIndex
    ): AgTreemapHighlightState {
        if (datumIndex == null) {
            return toHierarchyHighlightString(HierarchyHighlightState.None);
        }
        const nodeDatum = this.dfsFind(datumIndex);
        const highlightedNode = this.getActiveHighlightNode();
        if (nodeDatum == null) {
            return toHierarchyHighlightString(HierarchyHighlightState.None);
        }

        const isLeaf = (nodeDatum.children?.length ?? 0) === 0;
        if (isLeaf) {
            const tileState = this.getHierarchyHighlightState(isHighlight ?? false, highlightedNode, nodeDatum);
            return toHierarchyHighlightString(tileState);
        }

        const groupState = this.getGroupHighlightState(isHighlight ?? false, highlightedNode, nodeDatum);
        return toHierarchyHighlightString(groupState);
    }

    private isDescendantDatumIndex(nodeIndex: number[] | undefined, ancestorIndex: number[] | undefined): boolean {
        if (ancestorIndex == null || ancestorIndex.length === 0) {
            return true;
        }
        if (nodeIndex == null || nodeIndex.length < ancestorIndex.length) {
            return false;
        }
        for (let i = 0; i < ancestorIndex.length; i += 1) {
            if (nodeIndex[i] !== ancestorIndex[i]) {
                return false;
            }
        }
        return true;
    }

    override pickNodesExactShape(point: Point): _ModuleSupport.SeriesNodePickMatch[] {
        const matches = super.pickNodesExactShape(point);
        matches.sort((a, b) => (b.datum as TreemapNode).path.length - (a.datum as TreemapNode).path.length);
        return matches;
    }

    protected override pickNodeClosestDatum(point: Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        const exactMatch = this.pickNodesExactShape(point);
        if (exactMatch.length !== 0) {
            return exactMatch[0];
        }

        // No need to recurse: the root's bbox contains all descendant bboxes, so the nearest node is always a direct child.
        return this.pickNodeNearestDistantObject(point, this.datumSelection.nodes());
    }

    override getTooltipContent(datumIndex: _ModuleSupport.DatumIndex): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, options, ctx } = this;
        const { formatManager } = ctx;
        const { labelKey, secondaryLabelKey, childrenKey, sizeKey, sizeName, colorKey, colorName, tooltip } = options;

        const nodeDatum = this.dfsFind(datumIndex);
        if (nodeDatum == null) return;
        const { datum, depth, children } = nodeDatum;
        if (datum == null || depth == null) return;

        const isLeaf = children.length === 0;

        const data: _ModuleSupport.TooltipContentDataRow[] = [];

        const datumSize = sizeKey == null ? undefined : datum[sizeKey];
        if (datumSize != null) {
            const sizeDomain = [0, this.rootNode?.sumSize ?? 0];
            const content = formatManager.format(this.callWithContext.bind(this), {
                type: 'number',
                value: datumSize,
                datum,
                seriesId,
                legendItemName: undefined,
                key: sizeKey,
                source: 'tooltip',
                property: 'size',
                boundSeries: this.getFormatterContext('size'),
                domain: sizeDomain,
                fractionDigits: undefined,
                visibleDomain: undefined,
            });
            data.push({ label: sizeName, fallbackLabel: sizeKey!, value: content ?? formatValue(datumSize) });
        }

        const datumColor = colorKey == null ? undefined : datum[colorKey];
        if (datumColor != null) {
            const { colorDomain } = this;
            const content = formatManager.format(this.callWithContext.bind(this), {
                type: 'number',
                value: datumColor,
                datum,
                seriesId,
                legendItemName: undefined,
                key: colorKey,
                source: 'tooltip',
                property: 'color',
                boundSeries: this.getFormatterContext('color'),
                domain: colorDomain,
                fractionDigits: undefined,
                visibleDomain: undefined,
            });
            const binLabel = findDiscreteColorBinLabel(
                this.colorScale,
                options.colorScale.fills,
                datumColor,
                formatValue
            );
            data.push({
                label: colorName,
                fallbackLabel: colorKey!,
                value: content ?? binLabel ?? formatValue(datumColor),
            });
        }

        const format: Required<ItemStyle> = this.getItemStyle(
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- spread loses TreemapNode brand; restore for getItemStyle's parameter type
            { ...nodeDatum, colorValue: datumColor ?? nodeDatum.colorValue } as TreemapNode,
            isLeaf,
            false
        );

        const color = format.fill;

        const markerStyle = {
            shape: 'square' as const,
            fill: color,
            fillOpacity: 1,
            stroke: undefined,
            strokeWidth: 0,
            ...STROKE_STYLE_THEME_DEFAULTS,
        };

        if (isGradientFill(markerStyle.fill)) {
            markerStyle.fill = { ...markerStyle.fill, gradient: 'linear', rotation: 0, reverse: false };
        }

        const symbol: _ModuleSupport.LegendSymbolOptions | undefined = isLeaf ? { marker: markerStyle } : undefined;

        return this.formatTooltipWithContext(
            tooltip,
            {
                title: labelKey == null ? undefined : datum[labelKey],
                symbol,
                data,
            },
            {
                seriesId,
                datum,
                title: undefined,
                depth,
                labelKey,
                secondaryLabelKey,
                childrenKey,
                sizeKey,
                sizeName,
                colorKey,
                colorName,
                ...format,
            }
        );
    }

    protected computeFocusBounds(node: Rect): BBox | undefined {
        return Transformable.toCanvas(this.contentGroup, node.getBBox());
    }

    protected override hasItemStylers(): boolean {
        const { itemStyler, tile, group } = this.options;
        return (
            this.isSelectionEnabled() ||
            itemStyler != null ||
            tile.label.itemStyler != null ||
            group.label.itemStyler != null
        );
    }
}
