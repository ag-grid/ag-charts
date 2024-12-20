import {
    type AgTreemapSeriesStyle,
    type FontOptions,
    type TextAlign,
    type VerticalAlign,
    _ModuleSupport,
} from 'ag-charts-community';

import { formatLabels } from '../util/labelFormatter';
import { TreemapSeriesProperties } from './treemapSeriesProperties';

const {
    TextUtils,
    TextWrapper,
    clamp,
    isNumberEqual,
    createDatumId,
    Rect,
    Group,
    BBox,
    Selection,
    Text,
    Transformable,
    applyShapeStyle,
} = _ModuleSupport;

type Side = 'left' | 'right' | 'top' | 'bottom';

interface Padding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

interface LabelData {
    label: string | undefined;
    secondaryLabel: string | undefined;
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

function nodeSize(node: _ModuleSupport.HierarchyNode) {
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

export class TreemapSeries<
    TDatum extends _ModuleSupport.SeriesNodeDatum = _ModuleSupport.SeriesNodeDatum,
> extends _ModuleSupport.HierarchySeries<DistantGroup, TreemapSeriesProperties, TDatum> {
    static readonly className = 'TreemapSeries';
    static readonly type = 'treemap' as const;

    override properties = new TreemapSeriesProperties();

    private readonly rectGroup = this.contentGroup.appendChild(new Group());

    private readonly rectSelection = Selection.select(this.rectGroup, Rect);
    private readonly labelSelection = Selection.select(this.labelGroup, Group);
    private readonly highlightSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, _ModuleSupport.HierarchyNode> =
        Selection.select(this.rectGroup, Rect);

    private labelData?: (LabelData | undefined)[];

    private groupTitleHeight(node: _ModuleSupport.HierarchyNode, bbox: _ModuleSupport.BBox): number | undefined {
        const label = this.labelData?.[node.index]?.label;

        const { label: font } = this.properties.group;

        const heightRatioThreshold = 3;

        if (label == null) {
            return;
        } else if (
            font.fontSize > bbox.width / heightRatioThreshold ||
            font.fontSize > bbox.height / heightRatioThreshold
        ) {
            return;
        } else {
            const { height: fontHeight } = getTextSize(label, font);
            return Math.max(fontHeight, font.fontSize);
        }
    }

    private getNodePadding(node: _ModuleSupport.HierarchyNode, bbox: _ModuleSupport.BBox) {
        if (node.index === 0) {
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

    override processData() {
        super.processData();

        const { childrenKey, colorKey, colorName, labelKey, secondaryLabelKey, sizeKey, sizeName, tile, group } =
            this.properties;

        if (!this.data?.length) {
            this.labelData = undefined;
            return;
        }

        this.labelData = Array.from(this.rootNode, ({ datum, depth, children }): LabelData | undefined => {
            const isLeaf = children.length === 0;

            const labelStyle = isLeaf ? tile.label : group.label;
            let label: string | undefined;
            if (datum != null && depth != null && labelKey != null) {
                const value = (datum as any)[labelKey];
                label = this.getLabelText(labelStyle, {
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
                });
            }
            if (label === '') {
                label = undefined;
            }

            let secondaryLabel: string | undefined;
            if (isLeaf && datum != null && depth != null && secondaryLabelKey != null) {
                const value = (datum as any)[secondaryLabelKey];
                secondaryLabel = this.getLabelText(tile.secondaryLabel, {
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
                });
            }
            if (secondaryLabel === '') {
                secondaryLabel = undefined;
            }

            return label != null || secondaryLabel != null ? { label, secondaryLabel } : undefined;
        });
    }

    private sortChildren({ children }: _ModuleSupport.HierarchyNode<TDatum>) {
        const sortedChildrenIndices: number[] = Array.from(children, (_, i) => i)
            .filter((i) => nodeSize(children[i]) > 0)
            .sort((aIndex, bIndex) => nodeSize(children[bIndex]) - nodeSize(children[aIndex]));

        const childAt = (i: number): _ModuleSupport.HierarchyNode<TDatum> => {
            const sortedIndex = sortedChildrenIndices[i];
            return children[sortedIndex];
        };
        return { sortedChildrenIndices, childAt };
    }

    /**
     * Squarified Treemap algorithm
     * https://www.win.tue.nl/~vanwijk/stm.pdf
     */
    private squarify(
        node: _ModuleSupport.HierarchyNode<TDatum>,
        bbox: _ModuleSupport.BBox,
        outputBoxes: (_ModuleSupport.BBox | undefined)[],
        outputPadding: (Padding | undefined)[]
    ) {
        const { index, datum, children } = node;

        if (bbox.width <= 0 || bbox.height <= 0) {
            outputBoxes[index] = undefined;
            outputPadding[index] = undefined;
            return;
        }

        const padding = datum != null ? this.getNodePadding(node, bbox) : { top: 0, right: 0, bottom: 0, left: 0 };

        outputBoxes[index] = index === 0 ? undefined : bbox;
        outputPadding[index] = index === 0 ? undefined : padding;

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
                this.squarify(child, childBbox, outputBoxes, outputPadding);

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
            this.squarify(child, childBox, outputBoxes, outputPadding);
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
        return {
            fill: highlightStyle?.fill ?? group.fill,
            fillOpacity: highlightStyle?.fillOpacity ?? group.fillOpacity,
            stroke: highlightStyle?.stroke ?? group.stroke,
            strokeWidth: highlightStyle?.strokeWidth ?? group.strokeWidth,
            strokeOpacity: highlightStyle?.strokeOpacity ?? group.strokeOpacity,
        };
    }

    private getGroupStyleOverrides(
        datumId: string,
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
                createDatumId(datumId, highlighted ? 'highlight' : 'node'),
                () => {
                    return itemStyler({
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

        return overrides;
    }

    private getTileBaseStyle(highlighted: boolean): ItemStyle {
        const { properties } = this;
        const { tile } = properties;
        const highlightStyle = highlighted ? properties.highlightStyle.tile : undefined;
        return {
            fill: highlightStyle?.fill ?? tile.fill,
            fillOpacity: highlightStyle?.fillOpacity ?? tile.fillOpacity,
            stroke: highlightStyle?.stroke ?? tile.stroke,
            strokeWidth: highlightStyle?.strokeWidth ?? tile.strokeWidth,
            strokeOpacity: highlightStyle?.strokeOpacity ?? tile.strokeOpacity,
        };
    }

    private getTileStyleOverrides(
        datumId: string,
        datum: any,
        depth: number,
        rootIndex: number,
        colorValue: number | undefined,
        format: ItemStyle,
        highlighted: boolean
    ) {
        const { id: seriesId, properties, colorScale } = this;
        const { fills, strokes, itemStyler } = properties;

        const fill = format.fill ?? fills[rootIndex % fills.length];
        const stroke = format.stroke ?? strokes[rootIndex % strokes.length];

        const overrides: Partial<ItemStyle> = {};

        if (!highlighted) {
            overrides.fill = colorValue != null ? colorScale.convert(colorValue) : fill;
            overrides.stroke = stroke;
        }

        if (itemStyler != null) {
            const itemStyle = this.cachedDatumCallback(
                createDatumId(datumId, highlighted ? 'highlight' : 'node'),
                () => {
                    return itemStyler({
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

        return overrides;
    }

    override updateSelections() {
        let highlightedNode: _ModuleSupport.HierarchyNode | undefined =
            this.ctx.highlightManager?.getActiveHighlight() as any;
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

        const descendants = Array.from(this.rootNode);

        const updateLabelGroup = (group: _ModuleSupport.Group) => {
            group.append([new Text({ tag: TextNodeTag.Primary }), new Text({ tag: TextNodeTag.Secondary })]);
        };

        this.rectSelection.update(descendants, undefined, (node) => this.getDatumId(node));
        this.labelSelection.update(descendants, updateLabelGroup, (node) => this.getDatumId(node));
    }

    updateNodes() {
        const { rootNode, data } = this;
        const { highlightStyle, tile, group } = this.properties;
        const { seriesRect } = this.chart ?? {};

        if (!seriesRect || !data) return;

        const { width, height } = seriesRect;
        const bboxes: (_ModuleSupport.BBox | undefined)[] = Array.from(this.rootNode, () => undefined);
        const paddings: (Padding | undefined)[] = Array.from(this.rootNode, () => undefined);
        this.squarify(rootNode, new BBox(0, 0, width, height), bboxes, paddings);

        this.updateNodeMidPoint(bboxes);

        const updateRectFn = (
            node: _ModuleSupport.HierarchyNode,
            rect: _ModuleSupport.Rect,
            groupStyle: ItemStyle,
            tileStyle: ItemStyle,
            highlighted: boolean
        ) => {
            const bbox = bboxes[node.index];
            if (bbox == null) {
                rect.visible = false;
                return;
            }

            const { datum, depth = -1, index, rootIndex, colorValue } = node;
            const isLeaf = node.children.length === 0;

            const style = isLeaf ? tileStyle : groupStyle;
            const overrides = isLeaf
                ? this.getTileStyleOverrides(String(index), datum, depth, rootIndex, colorValue, style, highlighted)
                : this.getGroupStyleOverrides(String(index), datum, depth, style, highlighted);

            rect.crisp = true;

            applyShapeStyle(rect, style, overrides);

            rect.cornerRadius = isLeaf ? tile.cornerRadius : group.cornerRadius;
            rect.zIndex = [0, depth, highlighted ? 1 : 0];

            const onlyLeaves = node.parent?.children.every((n) => n.children.length === 0);
            const parentBbox = node.parent != null ? bboxes[node.parent.index] : undefined;
            const parentPadding = node.parent != null ? paddings[node.parent.index] : undefined;
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
        this.rectSelection.each((rect, datum) => updateRectFn(datum, rect, baseGroupFormat, baseTileFormat, false));

        const highlightGroupFormat = this.getGroupBaseStyle(true);
        const highlightTileFormat = this.getTileBaseStyle(true);
        this.highlightSelection.each((rect, datum) => {
            updateRectFn(datum, rect, highlightGroupFormat, highlightTileFormat, true);
        });

        const labelMeta = Array.from(this.rootNode, (node) => {
            const { index, children } = node;
            const bbox = bboxes[index];
            const labelDatum = this.labelData?.[index];

            if (bbox == null || labelDatum == null) {
                return;
            }

            if (children.length === 0) {
                const layout = {
                    width: bbox.width,
                    height: bbox.height,
                    meta: null,
                };
                const formatting = formatLabels(
                    labelDatum.label,
                    this.properties.tile.label,
                    labelDatum.secondaryLabel,
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

                return {
                    label:
                        label != null
                            ? {
                                  text: label.text,
                                  fontSize: label.fontSize,
                                  lineHeight: label.lineHeight,
                                  style: this.properties.tile.label,
                                  x: labelX,
                                  y: labelYStart - (labelHeight - label.height) * 0.5,
                              }
                            : undefined,
                    secondaryLabel:
                        secondaryLabel != null
                            ? {
                                  text: secondaryLabel.text,
                                  fontSize: secondaryLabel.fontSize,
                                  lineHeight: secondaryLabel.fontSize,
                                  style: this.properties.tile.secondaryLabel,
                                  x: labelX,
                                  y: labelYStart + (labelHeight - secondaryLabel.height) * 0.5,
                              }
                            : undefined,
                    verticalAlign: 'middle' as const,
                    textAlign,
                };
            } else if (labelDatum?.label == null) {
                return;
            } else {
                const { padding, textAlign } = group;

                const groupTitleHeight = this.groupTitleHeight(node, bbox);
                if (groupTitleHeight == null) {
                    return;
                }

                const innerWidth = bbox.width - 2 * padding;
                const text = TextWrapper.wrapText(labelDatum.label, {
                    maxWidth: bbox.width - 2 * padding,
                    font: group.label,
                    textWrap: 'never',
                });
                const textAlignFactor = textAlignFactors[textAlign] ?? 0.5;

                return {
                    label: {
                        text,
                        fontSize: group.label.fontSize,
                        lineHeight: TextUtils.getLineHeight(group.label.fontSize),
                        style: this.properties.group.label,
                        x: bbox.x + padding + innerWidth * textAlignFactor,
                        y: bbox.y + padding + groupTitleHeight * 0.5,
                    },
                    secondaryLabel: undefined,
                    verticalAlign: 'middle' as const,
                    textAlign,
                };
            }
        });

        const updateLabelFn = (
            node: _ModuleSupport.HierarchyNode,
            text: _ModuleSupport.Text,
            tag: TextNodeTag,
            highlighted: boolean
        ) => {
            const isLeaf = node.children.length === 0;
            const meta = labelMeta[node.index];
            const label = tag === TextNodeTag.Primary ? meta?.label : meta?.secondaryLabel;
            if (meta == null || label == null) {
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

            text.fontStyle = label.style.fontStyle;
            text.fontFamily = label.style.fontFamily;
            text.fontWeight = label.style.fontWeight;
            text.fill = highlightedColor ?? label.style.color;

            text.textAlign = meta.textAlign;
            text.textBaseline = meta.verticalAlign;
            text.x = label.x;
            text.y = label.y;
            text.visible = true;

            text.zIndex = 1;
        };
        this.labelSelection.selectByClass(Text).forEach((text) => {
            updateLabelFn(text.datum, text, text.tag, false);
        });
    }

    private updateNodeMidPoint(bboxes: (_ModuleSupport.BBox | undefined)[]) {
        this.rootNode.walk((node) => {
            const bbox = bboxes[node.index];
            if (bbox != null) {
                node.midPoint.x = bbox.x + bbox.width / 2;
                node.midPoint.y = bbox.y;
            }
        });
    }

    protected override pickNodeClosestDatum(
        point: _ModuleSupport.Point
    ): _ModuleSupport.SeriesNodePickMatch | undefined {
        const exactMatch = this.pickNodeExactShape(point);
        if (exactMatch !== undefined) {
            return exactMatch;
        }

        // We don't need to recurse on the tree because the root's nodes bounding-box contain all bounding boxes
        // of the descendants. Therefore the nearest node is always a child of the root. If there is an exact
        // match, then the pickNodeExactShape function will return a result, and this function wouldn't be called.
        return this.pickNodeNearestDistantObject(point, this.rectSelection.nodes());
    }

    override getTooltipContent(
        nodeDatum: _ModuleSupport.HierarchyNode
    ): _ModuleSupport.TooltipContent | string | undefined {
        const { id: seriesId, properties } = this;
        const { labelKey, secondaryLabelKey, childrenKey, sizeKey, sizeName, colorKey, colorName, tooltip } =
            properties;
        const { datum, index, rootIndex, depth, children } = nodeDatum;
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
            Object.assign(
                format,
                this.getTileStyleOverrides(String(index), datum, depth, rootIndex, datumColor, format, false)
            );
        } else {
            format = this.getGroupBaseStyle(false) as Required<ItemStyle>;
            Object.assign(format, this.getGroupStyleOverrides(String(index), datum, depth, format, false));
        }

        const color = format.fill;

        const symbol: _ModuleSupport.LegendSymbolOptions | undefined = isLeaf
            ? {
                  marker: {
                      shape: 'square',
                      fill: color,
                      fillOpacity: 1,
                      stroke: undefined,
                      strokeWidth: 0,
                      strokeOpacity: 1,
                      lineDash: [0],
                      lineDashOffset: 0,
                  },
              }
            : undefined;

        return tooltip.formatTooltip(
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

    private focusSorted?: { childAt: (i: number) => _ModuleSupport.HierarchyNode<TDatum> };

    public override pickFocus(opts: _ModuleSupport.PickFocusInputs): _ModuleSupport.PickFocusOutputs | undefined {
        const { focusPath: path } = this;

        // Initialise this.focusSorted
        if (path.length < 2 || this.focusSorted == null) {
            path.length = 1;
            this.focusSorted = this.sortChildren(path[0].nodeDatum);
            path.push({ nodeDatum: this.focusSorted.childAt(0), childIndex: 0 });
        }

        const { datumIndexDelta: childDelta, otherIndexDelta: depthDelta } = opts;
        const current = path[path.length - 1];

        if (depthDelta === 1) {
            if (current.nodeDatum.children.length > 0) {
                this.focusSorted = this.sortChildren(current.nodeDatum);
                const newFocus = { nodeDatum: this.focusSorted.childAt(0), childIndex: 0 };
                path.push(newFocus);
                return this.computeFocusOutputs(newFocus);
            }
        } else if (childDelta !== 0) {
            const targetIndex = current.childIndex + childDelta;
            const maxIndex = (current.nodeDatum.parent?.children.length ?? 1) - 1;
            current.childIndex = clamp(0, targetIndex, maxIndex);
            current.nodeDatum = this.focusSorted.childAt(current.childIndex);
            return this.computeFocusOutputs(current);
        }

        const result = super.pickFocus(opts);
        if (depthDelta < 0) {
            this.focusSorted = this.sortChildren(path[path.length - 1].nodeDatum.parent!);
        }
        return result;
    }

    protected getAnimationData() {
        return {
            datumSelections: [],
        };
    }

    protected computeFocusBounds(
        node: _ModuleSupport.HierarchyNode<_ModuleSupport.SeriesNodeDatum>
    ): _ModuleSupport.BBox | undefined {
        return Transformable.toCanvas(this.contentGroup, this.rectSelection.at(node.index)?.getBBox());
    }
}
