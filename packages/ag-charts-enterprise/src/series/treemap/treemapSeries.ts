import {
    type AgTreemapHighlightState,
    type AgTreemapSeriesItemStylerParams,
    type AgTreemapSeriesLabelFormatterParams,
    type AgTreemapSeriesOptions,
    type AgTreemapSeriesStyle,
    type FontStyle,
    type FontWeight,
    type TextAlign,
    type VerticalAlign,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type CallbackParamRules,
    type InternalAgColorType,
    type NormalisedTextOrSegments,
    type Point,
    type RequireOptional,
    type ResolvedTextAlign,
    cachedTextMeasurer,
    calcLineHeight,
    findDiscreteColorBinLabel,
    formatValue,
    isGradientFill,
    isNumberEqual,
    mergeDefaults,
    resolveTextAlign,
    toPlainText,
    wrapText,
} from 'ag-charts-core';

import { HierarchyDataSet } from '../../charts/hierarchyDataSet';
import { formatLabels } from '../util/labelFormatter';
import { TreemapSeriesProperties } from './treemapSeriesProperties';

const {
    createDatumId,
    Rect,
    Group,
    BBox,
    Selection,
    Text,
    Transformable,
    getLabelStyles,
    HierarchyHighlightState,
    toHierarchyHighlightString,
} = _ModuleSupport;

class TreemapNode extends _ModuleSupport.HierarchyNode<TreemapNode> {
    labelValue: string | undefined = undefined;
    secondaryLabelValue: string | undefined = undefined;
    // Leaf-only: preserves the formatter's segment output so image segments survive the
    // squarify step. Group titles still use the string-typed labelValue.
    labelText: NormalisedTextOrSegments | undefined = undefined;
    secondaryLabelText: NormalisedTextOrSegments | undefined = undefined;
    label: LabelLayout | undefined = undefined;
    secondaryLabel: LabelLayout | undefined = undefined;
    bbox: _ModuleSupport.BBox | undefined = undefined;
    padding: Padding | undefined = undefined;
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

type ItemStyle = Pick<AgTreemapSeriesStyle, 'fill' | 'stroke'> &
    Omit<Required<AgTreemapSeriesStyle>, 'fill' | 'stroke'>;
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

export class TreemapSeries extends _ModuleSupport.HierarchySeries<
    TreemapNode,
    _ModuleSupport.Rect<TreemapNode>,
    AgTreemapSeriesOptions,
    TreemapSeriesProperties
> {
    static override readonly className = 'TreemapSeries';
    static readonly type = 'treemap' as const;

    override NodeClass = TreemapNode;

    override properties = new TreemapSeriesProperties();

    private readonly rectGroup = this.contentGroup.appendChild(new Group());

    protected readonly datumSelection = Selection.select<_ModuleSupport.Rect<TreemapNode>>(
        this.rectGroup,
        Rect<TreemapNode>
    );
    private readonly labelSelection = Selection.select<_ModuleSupport.Group<TreemapNode>>(
        this.labelGroup,
        Group<TreemapNode>
    );
    private readonly highlightSelection = Selection.select<_ModuleSupport.Rect<TreemapNode>>(this.rectGroup, Rect);

    protected override _data?: HierarchyDataSet<any>;
    protected override _chartData?: HierarchyDataSet<any>;
    override get data(): HierarchyDataSet<any> | undefined {
        const result = super.data;
        if (!(result instanceof HierarchyDataSet)) {
            return undefined;
        }
        return result;
    }

    private groupTitleHeight(node: TreemapNode, bbox: _ModuleSupport.BBox): number | undefined {
        const heightRatioThreshold = 3;
        const { label } = this.properties.group;
        const { labelValue } = node;
        const { fontSize } = label;

        if (
            label.enabled &&
            labelValue != null &&
            fontSize <= bbox.width / heightRatioThreshold &&
            fontSize <= bbox.height / heightRatioThreshold
        ) {
            const { height: fontHeight } = cachedTextMeasurer(label).measureLines(labelValue);
            return Math.max(fontHeight, fontSize);
        }
    }

    private getNodePadding(node: TreemapNode, bbox: _ModuleSupport.BBox) {
        if (node.parent == null) {
            return { top: 0, right: 0, bottom: 0, left: 0 };
        } else if (node.children.length === 0) {
            const { padding } = this.properties.tile;
            return { top: padding, right: padding, bottom: padding, left: padding };
        }

        const {
            padding,
            label: { spacing },
        } = this.properties.group;
        const fontHeight = this.groupTitleHeight(node, bbox);
        const titleHeight = fontHeight == null ? 0 : fontHeight + spacing;

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

    // A group whose allocated box cannot fit its own padding can lay out no child, so it would render
    // only an empty container. Leaves render at any size, so they never count as collapsed.
    private collapses(node: TreemapNode, bbox: _ModuleSupport.BBox): boolean {
        if (node.children.length === 0) return false;
        if (bbox.width <= 0 || bbox.height <= 0) return true;
        const padding = node.datum == null ? { top: 0, right: 0, bottom: 0, left: 0 } : this.getNodePadding(node, bbox);
        return bbox.width - padding.left - padding.right <= 0 || bbox.height - padding.top - padding.bottom <= 0;
    }

    /**
     * Squarified Treemap algorithm
     * https://www.win.tue.nl/~vanwijk/stm.pdf
     */
    private squarify(node: TreemapNode, bbox: _ModuleSupport.BBox) {
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

        // A group whose inner box collapses under its own padding can lay out no child, so hide the
        // whole subtree — otherwise it renders as an empty container tile in space no real tile fills.
        if (width <= 0 || height <= 0) {
            if (children.length > 0) {
                node.walk((n) => this.hideNode(n));
            }
            return;
        }

        const innerBox = new BBox(bbox.x + padding.left, bbox.y + padding.top, width, height);

        // Lay the children out, then drop any group whose allocated box is too small to fit its own
        // padding: it can render nothing, and leaving it in the partition reserves space no tile fills
        // (the phantom tiles seen after a resize). Re-lay the survivors so they reclaim the freed area.
        // Removing a collapsed group only enlarges the rest, so this reaches a fixpoint.
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
        innerBox: _ModuleSupport.BBox,
        allLeafNodes: boolean
    ): { child: TreemapNode; bbox: _ModuleSupport.BBox }[] {
        const childAt = (i: number) => children[indices[i]];
        const numChildren = indices.length;
        const targetTileAspectRatio = 1; // The width and height will tend to this ratio
        const result: { child: TreemapNode; bbox: _ModuleSupport.BBox }[] = [];

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

            // Go one step back and process the best match
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

        // Process remaining space
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

    private applyGap(innerBox: _ModuleSupport.BBox, childBox: _ModuleSupport.BBox, allLeafNodes: boolean) {
        const gap = allLeafNodes ? this.properties.tile.gap * 0.5 : this.properties.group.gap * 0.5;
        const getBounds = (box: _ModuleSupport.BBox): Record<Side, number> => ({
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
        const { properties, colorScale } = this;
        const { itemStyler, colorKey } = properties;
        const { missingDataFill } = properties.colorScale;
        const rootIndex = nodeDatum.path?.[0] ?? 0;

        const fills = isLeaf ? properties.fills : properties.group.fills;
        const strokes = isLeaf ? properties.strokes : properties.undocumentedGroupStrokes;
        const index = isLeaf ? rootIndex : (nodeDatum.depth ?? -1);

        const highlightedNode = this.getActiveHighlightNode();
        const tileHighlightState = this.getHierarchyHighlightState(isHighlight, highlightedNode, nodeDatum);
        const groupHighlightState = this.getGroupHighlightState(isHighlight, highlightedNode, nodeDatum);

        const highlightState = isLeaf ? tileHighlightState : groupHighlightState;
        const highlightStyle = isLeaf
            ? this.getTileHighlightStyle(tileHighlightState, groupHighlightState, highlightedNode)
            : this.getGroupHighlightStyle(groupHighlightState);
        const selectionStyle = isLeaf
            ? this.getTileSelectionStyle(nodeDatum.datumIndex)
            : this.getGroupSelectionStyle(nodeDatum.datumIndex);
        const baseStyle = mergeDefaults(
            selectionStyle,
            highlightStyle,
            properties.getStyle(isLeaf, fills, strokes, index)
        );

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

    private makeItemStylerParams(
        nodeDatum: Pick<TreemapNode, 'datum' | 'datumIndex' | 'depth'>,
        style: Required<ItemStyle>,
        highlightState: AgTreemapHighlightState
    ) {
        const { id: seriesId } = this;
        const { colorKey, childrenKey, sizeKey, labelKey, secondaryLabelKey } = this.properties;

        // `style` is the resolved item style; its `fill` no longer carries unresolved colour refs.
        const fill = this.filterItemStylerFillParams(style.fill as InternalAgColorType) ?? style.fill;

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

        const updateLabelGroup = (group: _ModuleSupport.Group) => {
            group.append([new Text({ tag: TextNodeTag.Primary }), new Text({ tag: TextNodeTag.Secondary })]);
        };

        this.datumSelection.update(descendants, undefined, (node) => node.datumIndex);
        this.labelSelection.update(descendants, updateLabelGroup, (node) => node.datumIndex);
    }

    protected override getActiveHighlightNode(): TreemapNode | undefined {
        const highlightedNode = super.getActiveHighlightNode();
        if (highlightedNode?.children.length && !this.properties.group.interactive) {
            return undefined;
        }
        return highlightedNode;
    }

    updateNodes() {
        const { rootNode, data } = this;
        const { childrenKey, colorKey, colorName, labelKey, secondaryLabelKey, sizeKey, sizeName, tile, group } =
            this.properties;
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

            node.labelValue = toPlainText(labelValue);
            node.secondaryLabelValue = toPlainText(secondaryLabelValue);
            // Image-bearing segment arrays are only preserved for leaf tiles. Group titles use the
            // plain-text representation so the (smaller) group header stays text-only — formatter
            // output for groups that returns image segments is rendered as its `alt`-text fallback.
            node.labelText = isLeaf ? labelValue : undefined;
            node.secondaryLabelText = isLeaf ? secondaryLabelValue : undefined;
        });

        const { width, height } = seriesRect;
        this.squarify(rootNode!, new BBox(0, 0, width, height));

        this.rootNode?.walk((node) => {
            const { bbox, children, labelValue, secondaryLabelValue, labelText, secondaryLabelText } = node;

            node.label = undefined;
            node.secondaryLabel = undefined;

            if (bbox == null) return;

            if (children.length === 0) {
                const layout = {
                    width: bbox.width,
                    height: bbox.height,
                    meta: null,
                };
                const formatting = formatLabels(
                    labelText ?? labelValue,
                    this.properties.tile.label,
                    secondaryLabelText ?? secondaryLabelValue,
                    this.properties.tile.secondaryLabel,
                    { padding: tile.padding },
                    () => layout
                );
                if (formatting == null) {
                    return;
                }

                const { height: labelHeight, label, secondaryLabel } = formatting;
                const { textAlign, verticalAlign, padding } = tile;
                const resolvedTextAlign = resolveTextAlign(textAlign, this.ctx.domManager.isRtl);

                const textAlignFactor = textAlignFactors[resolvedTextAlign] ?? 0.5;
                const labelX = bbox.x + padding + (bbox.width - 2 * padding) * textAlignFactor;

                const verticalAlignFactor = verticalAlignFactors[verticalAlign] ?? 0.5;
                const labelYStart =
                    bbox.y +
                    padding +
                    labelHeight * 0.5 +
                    (bbox.height - 2 * padding - labelHeight) * verticalAlignFactor;

                if (label != null) {
                    const {
                        fontStyle = 'normal',
                        fontFamily,
                        fontWeight = 'normal',
                        color = 'black',
                    } = this.properties.tile.label;
                    node.label = {
                        text: label.text,
                        fontSize: label.fontSize,
                        lineHeight: label.lineHeight,
                        fontStyle,
                        fontFamily,
                        fontWeight,
                        color,
                        textAlign,
                        verticalAlign: 'middle',
                        x: labelX,
                        y: labelYStart - (labelHeight - label.height) * 0.5,
                    };
                }
                if (secondaryLabel != null) {
                    const {
                        fontStyle = 'normal',
                        fontFamily,
                        fontWeight = 'normal',
                        color = 'black',
                    } = this.properties.tile.secondaryLabel;
                    node.secondaryLabel = {
                        text: secondaryLabel.text,
                        fontSize: secondaryLabel.fontSize,
                        lineHeight: secondaryLabel.fontSize,
                        fontStyle,
                        fontFamily,
                        fontWeight,
                        color,
                        textAlign,
                        verticalAlign: 'middle',
                        x: labelX,
                        y: labelYStart + (labelHeight - secondaryLabel.height) * 0.5,
                    };
                }
            } else if (labelValue == null) {
                return;
            } else {
                const { padding, textAlign } = group;

                const groupTitleHeight = this.groupTitleHeight(node, bbox);
                if (groupTitleHeight == null) return;

                const innerWidth = bbox.width - 2 * padding;
                const text = wrapText(labelValue, {
                    maxWidth: bbox.width - 2 * padding,
                    font: group.label,
                    textWrap: 'never',
                });
                const resolvedTextAlign = resolveTextAlign(textAlign, this.ctx.domManager.isRtl);
                const textAlignFactor = textAlignFactors[resolvedTextAlign] ?? 0.5;

                const {
                    fontStyle = 'normal',
                    fontFamily,
                    fontWeight = 'normal',
                    color = 'black',
                } = this.properties.group.label;

                node.label = {
                    text,
                    fontSize: group.label.fontSize,
                    lineHeight: calcLineHeight(group.label.fontSize),
                    fontStyle,
                    fontFamily,
                    fontWeight,
                    color,
                    textAlign,
                    verticalAlign: 'middle',
                    x: bbox.x + padding + innerWidth * textAlignFactor,
                    y: bbox.y + padding + groupTitleHeight * 0.5,
                };
            }
        });

        const fillBBox: _ModuleSupport.ShapeFillBBox = {
            series: new BBox(0, 0, width, height),
            axis: new BBox(0, 0, width, height),
        };

        const updateRectFn = (node: TreemapNode, rect: _ModuleSupport.Rect, isHighlight: boolean) => {
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

        const updateLabelFn = (
            node: TreemapNode,
            text: _ModuleSupport.Text,
            tag: TextNodeTag,
            highlighted: boolean
        ) => {
            const isLeaf = node.children.length === 0;
            const label = tag === TextNodeTag.Primary ? node.label : node.secondaryLabel;
            if (label == null) {
                text.visible = false;
                return;
            }
            let labelProps;
            let labelPath: string[];
            if (tag === TextNodeTag.Primary) {
                labelProps = isLeaf ? tile.label : group.label;
                labelPath = ['series', `${this.declarationOrder}`, isLeaf ? 'tile' : 'group', 'label'];
            } else {
                labelProps = tile.secondaryLabel;
                labelPath = ['series', `${this.declarationOrder}`, 'tile', 'secondaryLabel'];
            }

            const { opacity: highlightOpacity } = this.getItemStyle(node, isLeaf, highlighted) ?? {};

            const params: RequireOptional<AgTreemapSeriesLabelFormatterParams> = {
                childrenKey: this.properties.childrenKey,
                colorKey: this.properties.colorKey,
                colorName: this.properties.colorName ?? this.properties.colorKey,
                depth: node.depth ?? Number.NaN,
                labelKey: this.properties.labelKey,
                secondaryLabelKey: this.properties.secondaryLabelKey,
                sizeKey: this.properties.sizeKey,
                sizeName: this.properties.sizeName ?? this.properties.sizeKey,
            };
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

    private getGroupHighlightState(
        isHighlight: boolean,
        highlightedNode: TreemapNode | undefined,
        nodeDatum: Pick<TreemapNode, 'path' | 'datumIndex' | 'depth'> & Partial<Pick<TreemapNode, 'children'>>
    ): _ModuleSupport.HierarchyHighlightState {
        const nodeIndex = nodeDatum.path;
        const highlightedIndex = highlightedNode?.path;
        const isDescendant = this.isDescendantDatumIndex(nodeIndex, highlightedIndex);

        // For leaf nodes
        if (nodeDatum.children?.length === 0) {
            if (nodeIndex == null || highlightedNode == null || highlightedNode.children?.length === 0) {
                return HierarchyHighlightState.None;
            }

            return isDescendant ? HierarchyHighlightState.Item : HierarchyHighlightState.OtherItem;
        }

        // For group nodes
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
        tileHighlightState: _ModuleSupport.HierarchyHighlightState,
        groupHighlightState: _ModuleSupport.HierarchyHighlightState,
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

        if (!this.properties.tile.highlight.enabled) {
            return undefined;
        }

        return this.getHierarchyHighlightStyles(tileHighlightState, this.properties.tile.highlight);
    }

    private getGroupHighlightStyle(highlightState: _ModuleSupport.HierarchyHighlightState): HighlightStyle | undefined {
        const { highlight } = this.properties.group;
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
        return this.properties.tile.selection.enabled;
    }

    public override isDatumSelectable(datumIndex: _ModuleSupport.DatumIndex): boolean {
        // Use HierarchDataSet.isLeaf() instead of this.dfsFind() for O(1) lookups:
        return this.data?.isLeaf(datumIndex) === true;
    }

    public getTileSelectionStyle(datumIndex?: _ModuleSupport.DatumIndex) {
        const selectionState = this.getDataSelectionState(datumIndex);
        if (selectionState === undefined) return undefined;
        return this.properties.tile.selection.getStyle(selectionState);
    }

    public getGroupSelectionStyle(datumIndex?: _ModuleSupport.DatumIndex) {
        const selectionState = this.getDataSelectionState(datumIndex);
        if (selectionState === undefined) return undefined;
        return this.properties.group.selection.getStyle(selectionState);
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

        // We don't need to recurse on the tree because the root's nodes bounding-box contain all bounding boxes
        // of the descendants. Therefore the nearest node is always a child of the root. If there is an exact
        // match, then the pickNodeExactShape function will return a result, and this function wouldn't be called.
        return this.pickNodeNearestDistantObject(point, this.datumSelection.nodes());
    }

    override getTooltipContent(datumIndex: _ModuleSupport.DatumIndex): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, properties, ctx } = this;
        const { formatManager } = ctx;
        const { labelKey, secondaryLabelKey, childrenKey, sizeKey, sizeName, colorKey, colorName, tooltip } =
            properties;

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
                properties.colorScale.fills,
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

        const color = format.fill as InternalAgColorType;

        const markerStyle = {
            shape: 'square' as const,
            fill: color,
            fillOpacity: 1,
            stroke: undefined,
            strokeWidth: 0,
            strokeOpacity: 1,
            lineDash: [0],
            lineDashOffset: 0,
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

    protected computeFocusBounds(node: _ModuleSupport.Rect): _ModuleSupport.BBox | undefined {
        return Transformable.toCanvas(this.contentGroup, node.getBBox());
    }

    protected override hasItemStylers(): boolean {
        return (
            this.isSelectionEnabled() ||
            this.properties.itemStyler != null ||
            this.properties.tile.label.itemStyler != null ||
            this.properties.group.label.itemStyler != null
        );
    }
}
