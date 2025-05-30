import {
    type AgTreemapSeriesLabelFormatterParams,
    type AgTreemapSeriesStyle,
    type FontOptions,
    type FontStyle,
    type FontWeight,
    type TextAlign,
    type VerticalAlign,
    _ModuleSupport,
} from 'ag-charts-community';
import { type InternalAgColorType, isNumberEqual } from 'ag-charts-core';

import { formatLabels } from '../util/labelFormatter';
import { TreemapSeriesProperties } from './treemapSeriesProperties';

const {
    TextUtils,
    TextWrapper,
    createDatumId,
    Rect,
    Group,
    BBox,
    Selection,
    Text,
    Transformable,
    applyShapeStyle,
    getShapeStyle,
} = _ModuleSupport;

class TreemapNode extends _ModuleSupport.HierarchyNode<TreemapNode> {
    labelValue: string | undefined = undefined;
    secondaryLabelValue: string | undefined = undefined;
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
    text: string;
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

const tempText = new Text();

function getTextSize(text: string, style: FontOptions): { width: number; height: number } {
    const { fontStyle, fontWeight, fontSize, fontFamily } = style;
    tempText.setProperties({
        text,
        fontStyle,
        fontWeight,
        fontSize,
        fontFamily,
        textAlign: 'left',
        textBaseline: 'top',
    });

    const { width, height } = tempText.getBBox();
    return { width, height };
}

function nodeSize(node: TreemapNode) {
    return node.children.length > 0 ? node.sumSize - node.sizeValue : node.sizeValue;
}

const textAlignFactors: Record<TextAlign, number | undefined> = {
    left: 0,
    center: 0.5,
    right: 1,
};

const verticalAlignFactors: Record<VerticalAlign, number | undefined> = {
    top: 0,
    middle: 0.5,
    bottom: 1,
};

class DistantGroup extends _ModuleSupport.Group implements _ModuleSupport.DistantObject {
    distanceSquared(x: number, y: number): number {
        return this.getBBox().distanceSquared(x, y);
    }
}

export class TreemapSeries extends _ModuleSupport.HierarchySeries<DistantGroup, TreemapSeriesProperties, TreemapNode> {
    static readonly className = 'TreemapSeries';
    static readonly type = 'treemap' as const;

    override NodeClass = TreemapNode;

    override properties = new TreemapSeriesProperties();

    private readonly rectGroup = this.contentGroup.appendChild(new Group());

    protected readonly datumSelection = Selection.select<_ModuleSupport.Rect, TreemapNode>(this.rectGroup, Rect);
    private readonly labelSelection = Selection.select<_ModuleSupport.Group, TreemapNode>(this.labelGroup, Group);
    private readonly highlightSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, TreemapNode> = Selection.select(
        this.rectGroup,
        Rect
    );

    private groupTitleHeight(node: TreemapNode, bbox: _ModuleSupport.BBox): number | undefined {
        const { labelValue } = node;
        const { label: font } = this.properties.group;

        const heightRatioThreshold = 3;

        if (labelValue == null) {
            return;
        } else if (
            font.fontSize > bbox.width / heightRatioThreshold ||
            font.fontSize > bbox.height / heightRatioThreshold
        ) {
            return;
        } else {
            const { height: fontHeight } = getTextSize(labelValue, font);
            return Math.max(fontHeight, font.fontSize);
        }
    }

    private getNodePadding(node: TreemapNode, bbox: _ModuleSupport.BBox) {
        if (node.parent == null) {
            return {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
            };
        } else if (node.children.length === 0) {
            const { padding } = this.properties.tile;
            return {
                top: padding,
                right: padding,
                bottom: padding,
                left: padding,
            };
        }

        const {
            label: { spacing },
            padding,
        } = this.properties.group;
        const fontHeight = this.groupTitleHeight(node, bbox);
        const titleHeight = fontHeight != null ? fontHeight + spacing : 0;

        return {
            top: padding + titleHeight,
            right: padding,
            bottom: padding,
            left: padding,
        };
    }

    private sortChildren({ children }: TreemapNode) {
        const sortedChildrenIndices: number[] = Array.from(children, (_, i) => i)
            .filter((i) => nodeSize(children[i]) > 0)
            .sort((aIndex, bIndex) => nodeSize(children[bIndex]) - nodeSize(children[aIndex]));

        const childAt = (i: number): TreemapNode => {
            const sortedIndex = sortedChildrenIndices[i];
            return children[sortedIndex];
        };
        return { sortedChildrenIndices, childAt };
    }

    /**
     * Squarified Treemap algorithm
     * https://www.win.tue.nl/~vanwijk/stm.pdf
     */
    private squarify(node: TreemapNode, bbox: _ModuleSupport.BBox) {
        const { datum, children } = node;

        if (bbox.width <= 0 || bbox.height <= 0) {
            node.bbox = undefined;
            node.padding = undefined;
            node.midPoint.x = NaN;
            node.midPoint.y = NaN;
            return;
        }

        const padding = datum != null ? this.getNodePadding(node, bbox) : { top: 0, right: 0, bottom: 0, left: 0 };

        if (node.parent == null) {
            node.bbox = undefined;
            node.padding = undefined;
            node.midPoint.x = NaN;
            node.midPoint.y = NaN;
        } else {
            node.bbox = bbox;
            node.padding = padding;
            node.midPoint.x = bbox.x + bbox.width / 2;
            node.midPoint.y = bbox.y;
        }

        const { sortedChildrenIndices, childAt } = this.sortChildren(node);

        const allLeafNodes = sortedChildrenIndices.every((sortedIndex) => children[sortedIndex].children.length === 0);

        const targetTileAspectRatio = 1; // The width and height will tend to this ratio
        const width = bbox.width - padding.left - padding.right;
        const height = bbox.height - padding.top - padding.bottom;

        if (width <= 0 || height <= 0) return;

        const numChildren = sortedChildrenIndices.length;
        let stackSum = 0;
        let startIndex = 0;
        let minRatioDiff = Infinity;
        let partitionSum = sortedChildrenIndices.reduce((sum, sortedIndex) => sum + nodeSize(children[sortedIndex]), 0);
        const innerBox = new BBox(bbox.x + padding.left, bbox.y + padding.top, width, height);
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
                this.squarify(child, childBbox);

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
            this.squarify(child, childBox);
            start += isVertical ? childWidth : childHeight;
        }
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
        sides.forEach((side) => {
            if (!isNumberEqual(innerBounds[side], childBounds[side])) {
                childBox.shrink(gap, side);
            }
        });
    }

    override createNodeData() {
        return undefined;
    }

    private getGroupBaseStyle(highlighted: boolean): ItemStyle {
        const { properties } = this;
        const { group } = properties;
        const highlightStyle = highlighted ? properties.highlightStyle.group : undefined;
        return getShapeStyle(
            {
                fill: highlightStyle?.fill ?? group.fill,
                fillOpacity: highlightStyle?.fillOpacity ?? group.fillOpacity,
                stroke: highlightStyle?.stroke ?? group.stroke,
                strokeWidth: highlightStyle?.strokeWidth ?? group.strokeWidth,
                strokeOpacity: highlightStyle?.strokeOpacity ?? group.strokeOpacity,
            },
            properties.fillGradientDefaults,
            properties.fillPatternDefaults,
            properties.fillImageDefaults
        );
    }

    private getGroupStyleOverrides(
        datumId: number[],
        datum: any,
        depth: number,
        format: ItemStyle,
        highlighted: boolean
    ) {
        const { id: seriesId, properties } = this;

        const { undocumentedGroupFills, undocumentedGroupStrokes, itemStyler } = properties;

        const fill = format.fill ?? undocumentedGroupFills[Math.min(depth ?? 0, undocumentedGroupFills.length)];
        const stroke = format.stroke ?? undocumentedGroupStrokes[Math.min(depth ?? 0, undocumentedGroupStrokes.length)];

        const overrides: Partial<ItemStyle> = {};

        if (!highlighted) {
            overrides.fill = fill;
            overrides.stroke = stroke;
        }

        if (itemStyler != null) {
            const itemStyle = this.cachedDatumCallback(
                createDatumId(datumId.join(':'), highlighted ? 'highlight' : 'node'),
                () => {
                    return this.callWithContext(itemStyler, {
                        seriesId,
                        datum,
                        depth,
                        highlighted,
                        fill,
                        stroke,
                        ...format,
                    });
                }
            );

            Object.assign(overrides, itemStyle);
        }

        return getShapeStyle(
            overrides,
            this.properties.fillGradientDefaults,
            this.properties.fillPatternDefaults,
            this.properties.fillImageDefaults
        );
    }

    private getTileBaseStyle(highlighted: boolean): ItemStyle {
        const { properties } = this;
        const { tile } = properties;
        const highlightStyle = highlighted ? properties.highlightStyle.tile : undefined;
        return getShapeStyle(
            {
                fill: highlightStyle?.fill ?? tile.fill,
                fillOpacity: highlightStyle?.fillOpacity ?? tile.fillOpacity,
                stroke: highlightStyle?.stroke ?? tile.stroke,
                strokeWidth: highlightStyle?.strokeWidth ?? tile.strokeWidth,
                strokeOpacity: highlightStyle?.strokeOpacity ?? tile.strokeOpacity,
            },
            properties.fillGradientDefaults,
            properties.fillPatternDefaults,
            properties.fillImageDefaults
        );
    }

    private getTileStyleOverrides(
        datumId: number[],
        datum: any,
        depth: number,
        colorValue: number | undefined,
        format: ItemStyle,
        highlighted: boolean
    ) {
        const { id: seriesId, properties, colorScale } = this;
        const { fills, strokes, itemStyler } = properties;

        const rootIndex = datumId[0];

        const fill = format.fill ?? fills[rootIndex % fills.length];
        const stroke = format.stroke ?? strokes[rootIndex % strokes.length];

        const overrides: Partial<ItemStyle> = {};

        if (!highlighted) {
            overrides.fill = colorValue != null ? colorScale.convert(colorValue) : fill;
            overrides.stroke = stroke;
        }

        if (itemStyler != null) {
            const itemStyle = this.cachedDatumCallback(
                createDatumId(datumId.join(':'), highlighted ? 'highlight' : 'node'),
                () => {
                    return this.callWithContext(itemStyler, {
                        seriesId,
                        datum,
                        depth,
                        highlighted,
                        fill,
                        stroke,
                        ...format,
                    });
                }
            );

            Object.assign(overrides, itemStyle);
        }

        return getShapeStyle(
            overrides,
            this.properties.fillGradientDefaults,
            this.properties.fillPatternDefaults,
            this.properties.fillImageDefaults
        );
    }

    override updateSelections() {
        let highlightedNode: TreemapNode | undefined = this.ctx.highlightManager?.getActiveHighlight() as any;
        if (highlightedNode != null && !this.properties.group.interactive && highlightedNode.children.length !== 0) {
            highlightedNode = undefined;
        }

        this.highlightSelection.update(highlightedNode != null ? [highlightedNode] : [], undefined, (node) =>
            this.getDatumId(node)
        );

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

        this.datumSelection.update(descendants, undefined, (node) => this.getDatumId(node));
        this.labelSelection.update(descendants, updateLabelGroup, (node) => this.getDatumId(node));
    }

    updateNodes() {
        const { rootNode, data } = this;
        const {
            childrenKey,
            colorKey,
            colorName,
            labelKey,
            secondaryLabelKey,
            sizeKey,
            sizeName,
            highlightStyle,
            tile,
            group,
        } = this.properties;
        const { seriesRect } = this.chart ?? {};

        if (!seriesRect || !data) return;

        this.rootNode?.walk((node) => {
            const { datum, depth, children } = node;
            const isLeaf = children.length === 0;

            const labelStyle = isLeaf ? tile.label : group.label;
            let labelValue: string | undefined;
            if (datum != null && depth != null && labelKey != null) {
                const value = (datum as any)[labelKey];
                labelValue = this.getLabelText<AgTreemapSeriesLabelFormatterParams>(
                    value,
                    datum,
                    labelKey,
                    'label',
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

            let secondaryLabelValue: string | undefined;
            if (isLeaf && datum != null && depth != null && secondaryLabelKey != null) {
                const value = (datum as any)[secondaryLabelKey];
                secondaryLabelValue = this.getLabelText<AgTreemapSeriesLabelFormatterParams>(
                    value,
                    datum,
                    secondaryLabelKey,
                    'secondaryLabel',
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

            node.labelValue = labelValue;
            node.secondaryLabelValue = secondaryLabelValue;
        });

        const { width, height } = seriesRect;
        this.squarify(rootNode!, new BBox(0, 0, width, height));

        this.rootNode?.walk((node) => {
            const { bbox, children, labelValue, secondaryLabelValue } = node;

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
                    labelValue,
                    this.properties.tile.label,
                    secondaryLabelValue,
                    this.properties.tile.secondaryLabel,
                    { padding: tile.padding },
                    () => layout
                );
                if (formatting == null) {
                    return;
                }

                const { height: labelHeight, label, secondaryLabel } = formatting;
                const { textAlign, verticalAlign, padding } = tile;

                const textAlignFactor = textAlignFactors[textAlign] ?? 0.5;
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
                const text = TextWrapper.wrapText(labelValue, {
                    maxWidth: bbox.width - 2 * padding,
                    font: group.label,
                    textWrap: 'never',
                });
                const textAlignFactor = textAlignFactors[textAlign] ?? 0.5;

                const {
                    fontStyle = 'normal',
                    fontFamily,
                    fontWeight = 'normal',
                    color = 'black',
                } = this.properties.group.label;

                node.label = {
                    text,
                    fontSize: group.label.fontSize,
                    lineHeight: TextUtils.getLineHeight(group.label.fontSize),
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

        const updateRectFn = (
            node: TreemapNode,
            rect: _ModuleSupport.Rect,
            groupStyle: ItemStyle,
            tileStyle: ItemStyle,
            highlighted: boolean
        ) => {
            const { bbox } = node;
            if (bbox == null) {
                rect.visible = false;
                return;
            }

            const { datum, depth = -1, datumIndex, colorValue } = node;
            const isLeaf = node.children.length === 0;

            const style = isLeaf ? tileStyle : groupStyle;
            const overrides = isLeaf
                ? this.getTileStyleOverrides(datumIndex, datum, depth, colorValue, style, highlighted)
                : this.getGroupStyleOverrides(datumIndex, datum, depth, style, highlighted);

            rect.crisp = true;

            applyShapeStyle(rect, style, overrides, fillBBox);

            rect.cornerRadius = isLeaf ? tile.cornerRadius : group.cornerRadius;
            rect.zIndex = [0, depth, highlighted ? 1 : 0];

            const onlyLeaves = node.parent?.children.every((n) => n.children.length === 0);
            const parentBbox = node.parent != null ? node.parent.bbox : undefined;
            const parentPadding = node.parent != null ? node.parent.padding : undefined;
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

        const baseGroupFormat = this.getGroupBaseStyle(false);
        const baseTileFormat = this.getTileBaseStyle(false);
        this.datumSelection.each((rect, datum) => updateRectFn(datum, rect, baseGroupFormat, baseTileFormat, false));

        const highlightGroupFormat = this.getGroupBaseStyle(true);
        const highlightTileFormat = this.getTileBaseStyle(true);

        this.highlightSelection.each((rect, datum) => {
            updateRectFn(datum, rect, highlightGroupFormat, highlightTileFormat, true);
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

            let highlightedColor: string | undefined;
            if (highlighted) {
                const { tile: hTitle, group: hGroup } = highlightStyle;

                highlightedColor = hTitle.secondaryLabel.color;
                if (!isLeaf) {
                    highlightedColor = hGroup.label.color;
                } else if (tag === TextNodeTag.Primary) {
                    highlightedColor = hTitle.label.color;
                }
            }

            text.text = label.text;
            text.fontSize = label.fontSize;
            text.lineHeight = label.lineHeight;
            text.fontStyle = label.fontStyle;
            text.fontFamily = label.fontFamily;
            text.fontWeight = label.fontWeight;
            text.fill = highlightedColor ?? label.color;
            text.textAlign = label.textAlign;
            text.textBaseline = label.verticalAlign;
            text.x = label.x;
            text.y = label.y;
            text.visible = true;

            text.zIndex = 1;
        };
        const highlightedDatum = this.ctx.highlightManager?.getActiveHighlight() as any;
        this.labelSelection.selectByClass(Text).forEach((text) => {
            const datum = text.closestDatum();
            updateLabelFn(datum, text, text.tag, datum === highlightedDatum);
        });
    }

    override pickNodesExactShape(point: _ModuleSupport.Point): TreemapNode[] {
        const nodes = super.pickNodesExactShape(point) as TreemapNode[];
        nodes.sort((a, b) => b.datumIndex.length - a.datumIndex.length);
        return nodes;
    }

    protected override pickNodeClosestDatum(
        point: _ModuleSupport.Point
    ): _ModuleSupport.SeriesNodePickMatch | undefined {
        const exactMatch = this.pickNodesExactShape(point);
        if (exactMatch.length !== 0) {
            return { datum: exactMatch[0], distance: 0 };
        }

        // We don't need to recurse on the tree because the root's nodes bounding-box contain all bounding boxes
        // of the descendants. Therefore the nearest node is always a child of the root. If there is an exact
        // match, then the pickNodeExactShape function will return a result, and this function wouldn't be called.
        return this.pickNodeNearestDistantObject(point, this.datumSelection.nodes());
    }

    override getTooltipContent(datumIndex: number[]): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, properties } = this;
        const { labelKey, secondaryLabelKey, childrenKey, sizeKey, sizeName, colorKey, colorName, tooltip } =
            properties;

        const nodeDatum = datumIndex.reduce((n, i) => n?.children[i], this.rootNode);
        if (nodeDatum == null) return;
        const { datum, depth, children } = nodeDatum;
        if (datum == null || depth == null) return;

        const isLeaf = children.length === 0;

        const data: _ModuleSupport.TooltipContentDataRow[] = [];

        const datumSize = sizeKey != null ? datum[sizeKey] : undefined;
        if (datumSize != null) {
            data.push({ label: sizeName, fallbackLabel: sizeKey!, value: datumSize });
        }

        const datumColor = colorKey != null ? datum[colorKey] : undefined;
        if (datumColor != null) {
            data.push({ label: colorName, fallbackLabel: colorKey!, value: datumColor });
        }

        let format: Required<ItemStyle>;
        if (isLeaf) {
            format = this.getTileBaseStyle(false) as Required<ItemStyle>;
            Object.assign(format, this.getTileStyleOverrides(datumIndex, datum, depth, datumColor, format, false));
        } else {
            format = this.getGroupBaseStyle(false) as Required<ItemStyle>;
            Object.assign(format, this.getGroupStyleOverrides(datumIndex, datum, depth, format, false));
        }

        const color = format.fill as InternalAgColorType;

        const markerStyle = getShapeStyle(
            {
                shape: 'square' as const,
                fill: color,
                fillOpacity: 1,
                stroke: undefined,
                strokeWidth: 0,
                strokeOpacity: 1,
                lineDash: [0],
                lineDashOffset: 0,
            },
            this.properties.fillGradientDefaults,
            this.properties.fillPatternDefaults,
            this.properties.fillImageDefaults
        );

        if (_ModuleSupport.isGradientFill(markerStyle.fill)) {
            markerStyle.fill = { ...markerStyle.fill, gradient: 'linear', rotation: 0, reverse: false };
        }

        const symbol: _ModuleSupport.LegendSymbolOptions | undefined = isLeaf ? { marker: markerStyle } : undefined;

        return this.formatTooltipWithContext(
            tooltip,
            {
                title: labelKey != null ? datum[labelKey] : undefined,
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

    protected computeFocusBounds(node: _ModuleSupport.Group): _ModuleSupport.BBox | undefined {
        return Transformable.toCanvas(this.contentGroup, node.getBBox());
    }
}
