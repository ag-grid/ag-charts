import {
    type AgTooltipRendererResult,
    type AgTreemapSeriesStyle,
    type FontOptions,
    type TextAlign,
    type VerticalAlign,
    _ModuleSupport,
    _Scene,
    _Util,
} from 'ag-charts-community';

import { AutoSizedLabel, formatLabels } from '../util/labelFormatter';
import { TreemapSeriesProperties } from './treemapSeriesProperties';

const { Rect, Group, BBox, Selection, Text } = _Scene;
const { Color, Logger, isEqual, sanitizeHtml } = _Util;

type Side = 'left' | 'right' | 'top' | 'bottom';

interface LabelData {
    label: string | undefined;
    secondaryLabel: string | undefined;
}

enum TextNodeTag {
    Primary,
    Secondary,
}

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

    const { width, height } = tempText.computeBBox();
    return { width, height };
}

function validateColor(color?: string): string | undefined {
    if (typeof color === 'string' && !Color.validColorString(color)) {
        const fallbackColor = 'black';
        Logger.warnOnce(
            `invalid Treemap tile colour string "${color}". Affected treemap tiles will be coloured ${fallbackColor}.`
        );
        return fallbackColor;
    }
    return color;
}

function nodeSize(node: _ModuleSupport.HierarchyNode) {
    return node.children.length > 0 ? node.sumSize - node.size : node.size;
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

export class TreemapSeries<
    TDatum extends _ModuleSupport.SeriesNodeDatum = _ModuleSupport.SeriesNodeDatum,
> extends _ModuleSupport.HierarchySeries<_Scene.Group, TDatum> {
    static className = 'TreemapSeries';
    static type = 'treemap' as const;

    override properties = new TreemapSeriesProperties();

    groupSelection = Selection.select(this.contentGroup, Group);
    private highlightSelection: _Scene.Selection<_Scene.Group, _ModuleSupport.HierarchyNode> = Selection.select(
        this.highlightGroup,
        Group
    );

    private labelData?: (LabelData | undefined)[];

    private groupTitleHeight(node: _ModuleSupport.HierarchyNode, bbox: _Scene.BBox): number | undefined {
        const label = this.labelData?.[node.index]?.label;

        const { label: font } = this.properties.group;

        const heightRatioThreshold = 3;

        if (label == null) {
            return undefined;
        } else if (
            font.fontSize > bbox.width / heightRatioThreshold ||
            font.fontSize > bbox.height / heightRatioThreshold
        ) {
            return undefined;
        } else {
            const { height: fontHeight } = getTextSize(label, font);
            return Math.max(fontHeight, font.fontSize);
        }
    }

    private getNodePadding(node: _ModuleSupport.HierarchyNode, bbox: _Scene.BBox) {
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

    override async processData() {
        await super.processData();

        const { childrenKey, colorKey, colorName, labelKey, secondaryLabelKey, sizeKey, sizeName, tile, group } =
            this.properties;

        if (!this.data?.length) {
            this.labelData = undefined;
            return;
        }

        const defaultLabelFormatter = (value: any) => {
            if (typeof value === 'number') {
                // This copies what other series are doing - we should look to provide format customization
                return value.toFixed(2);
            } else if (typeof value === 'string') {
                return value;
            } else {
                return '';
            }
        };

        this.labelData = Array.from(this.rootNode, ({ datum, depth, children }): LabelData | undefined => {
            const isLeaf = children.length === 0;

            const labelStyle = isLeaf ? tile.label : group.label;
            let label: string | undefined;
            if (datum != null && depth != null && labelKey != null) {
                const value = (datum as any)[labelKey];
                label = this.getLabelText(
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
                    },
                    defaultLabelFormatter
                );
            }
            if (label === '') {
                label = undefined;
            }

            let secondaryLabel: string | undefined;
            if (isLeaf && datum != null && depth != null && secondaryLabelKey != null) {
                const value = (datum as any)[secondaryLabelKey];
                secondaryLabel = this.getLabelText(
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
                    },
                    defaultLabelFormatter
                );
            }
            if (secondaryLabel === '') {
                secondaryLabel = undefined;
            }

            return label != null || secondaryLabel != null ? { label, secondaryLabel } : undefined;
        });
    }

    /**
     * Squarified Treemap algorithm
     * https://www.win.tue.nl/~vanwijk/stm.pdf
     */
    private squarify(node: _ModuleSupport.HierarchyNode, bbox: _Scene.BBox, outputBoxes: (_Scene.BBox | undefined)[]) {
        const { index, datum, children } = node;

        if (bbox.width <= 0 || bbox.height <= 0) {
            outputBoxes[index] = undefined;
            return;
        }

        outputBoxes[index] = index !== 0 ? bbox : undefined;

        const sortedChildrenIndices = Array.from(children, (_, index) => index)
            .filter((index) => nodeSize(children[index]) > 0)
            .sort((aIndex, bIndex) => nodeSize(children[bIndex]) - nodeSize(children[aIndex]));

        const childAt = (index: number) => {
            const sortedIndex = sortedChildrenIndices[index];
            return children[sortedIndex];
        };

        const allLeafNodes = sortedChildrenIndices.every((index) => childAt(index).children.length === 0);

        const targetTileAspectRatio = 1; // The width and height will tend to this ratio
        const padding = datum != null ? this.getNodePadding(node, bbox) : { top: 0, right: 0, bottom: 0, left: 0 };
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

        for (let i = 0; i < numChildren; i++) {
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
                const width = isVertical ? length : stackThickness;
                const height = isVertical ? stackThickness : length;

                const childBbox = new BBox(x, y, width, height);
                this.applyGap(innerBox, childBbox, allLeafNodes);
                this.squarify(child, childBbox, outputBoxes);

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
            i--;
        }

        // Process remaining space
        const isVertical = partition.width < partition.height;
        let start = isVertical ? partition.x : partition.y;
        for (let i = startIndex; i < numChildren; i++) {
            const child = childAt(i);
            const x = isVertical ? start : partition.x;
            const y = isVertical ? partition.y : start;
            const part = nodeSize(child) / partitionSum;
            const width = partition.width * (isVertical ? part : 1);
            const height = partition.height * (isVertical ? 1 : part);
            const childBox = new BBox(x, y, width, height);
            this.applyGap(innerBox, childBox, allLeafNodes);
            this.squarify(child, childBox, outputBoxes);
            start += isVertical ? width : height;
        }
    }

    private applyGap(innerBox: _Scene.BBox, childBox: _Scene.BBox, allLeafNodes: boolean) {
        const gap = allLeafNodes ? this.properties.tile.gap * 0.5 : this.properties.group.gap * 0.5;
        const getBounds = (box: _Scene.BBox): Record<Side, number> => ({
            left: box.x,
            top: box.y,
            right: box.x + box.width,
            bottom: box.y + box.height,
        });
        const innerBounds = getBounds(innerBox);
        const childBounds = getBounds(childBox);
        const sides: Side[] = ['top', 'right', 'bottom', 'left'];
        sides.forEach((side) => {
            if (!isEqual(innerBounds[side], childBounds[side])) {
                childBox.shrink(gap, side);
            }
        });
    }

    async createNodeData() {
        return [];
    }

    async updateSelections() {
        if (!this.nodeDataRefresh) {
            return;
        }
        this.nodeDataRefresh = false;

        const { seriesRect } = this.chart ?? {};
        if (!seriesRect) return;

        const descendants = Array.from(this.rootNode);

        const updateGroup = (group: _Scene.Group) => {
            group.append([
                new Rect(),
                new Text({ tag: TextNodeTag.Primary }),
                new Text({ tag: TextNodeTag.Secondary }),
            ]);
        };

        this.groupSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
        this.highlightSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
    }

    private getTileFormat(node: _ModuleSupport.HierarchyNode, isHighlighted: boolean): AgTreemapSeriesStyle {
        const { datum, depth, children } = node;
        const { colorKey, labelKey, secondaryLabelKey, sizeKey, tile, group, formatter } = this.properties;

        if (!formatter || datum == null || depth == null) {
            return {};
        }

        const isLeaf = children.length === 0;
        const fill = (isLeaf ? tile.fill : group.fill) ?? node.fill;
        const stroke = (isLeaf ? tile.stroke : group.stroke) ?? node.stroke;
        const strokeWidth = isLeaf ? tile.strokeWidth : group.strokeWidth;

        const result = this.ctx.callbackCache.call(formatter, {
            seriesId: this.id,
            depth,
            datum,
            colorKey,
            labelKey,
            secondaryLabelKey,
            sizeKey,
            fill,
            stroke,
            strokeWidth,
            highlighted: isHighlighted,
        });

        return result ?? {};
    }

    private getNodeFill(node: _ModuleSupport.HierarchyNode) {
        const isLeaf = node.children.length === 0;
        if (isLeaf) {
            return this.properties.tile.fill ?? node.fill;
        }
        const { undocumentedGroupFills } = this.properties;
        const defaultFill = undocumentedGroupFills[Math.min(node.depth ?? 0, undocumentedGroupFills.length)];
        return this.properties.group.fill ?? defaultFill;
    }

    private getNodeStroke(node: _ModuleSupport.HierarchyNode) {
        const isLeaf = node.children.length === 0;
        if (isLeaf) {
            return this.properties.tile.stroke ?? node.stroke;
        }
        const { undocumentedGroupStrokes } = this.properties;
        const defaultStroke = undocumentedGroupStrokes[Math.min(node.depth ?? 0, undocumentedGroupStrokes.length)];
        return this.properties.group.stroke ?? defaultStroke;
    }

    async updateNodes() {
        const { rootNode, data } = this;
        const { highlightStyle, tile, group } = this.properties;
        const { seriesRect } = this.chart ?? {};

        if (!seriesRect || !data) return;

        const { width, height } = seriesRect;
        const bboxes: (_Scene.BBox | undefined)[] = Array.from(this.rootNode, () => undefined);
        this.squarify(rootNode, new BBox(0, 0, width, height), bboxes);

        let highlightedNode: _ModuleSupport.HierarchyNode | undefined =
            this.ctx.highlightManager?.getActiveHighlight() as any;
        if (highlightedNode != null && !this.properties.group.interactive && highlightedNode.children.length !== 0) {
            highlightedNode = undefined;
        }

        this.updateNodeMidPoint(bboxes);

        const updateRectFn = (node: _ModuleSupport.HierarchyNode, rect: _Scene.Rect, highlighted: boolean) => {
            const bbox = bboxes[node.index];
            if (bbox == null) {
                rect.visible = false;
                return;
            }

            const isLeaf = node.children.length === 0;

            let highlightedFill: string | undefined;
            let highlightedFillOpacity: number | undefined;
            let highlightedStroke: string | undefined;
            let highlightedStrokeWidth: number | undefined;
            let highlightedStrokeOpacity: number | undefined;
            if (highlighted) {
                const { tile, group } = highlightStyle;
                highlightedFill = isLeaf ? tile.fill : group.fill;
                highlightedFillOpacity = isLeaf ? tile.fillOpacity : group.fillOpacity;
                highlightedStroke = isLeaf ? tile.stroke : group.stroke;
                highlightedStrokeWidth = isLeaf ? tile.strokeWidth : group.strokeWidth;
                highlightedStrokeOpacity = isLeaf ? tile.strokeOpacity : group.strokeOpacity;
            }

            const format = this.getTileFormat(node, highlighted);

            const fill = format?.fill ?? highlightedFill ?? this.getNodeFill(node);
            const fillOpacity =
                format?.fillOpacity ?? highlightedFillOpacity ?? (isLeaf ? tile.fillOpacity : group.fillOpacity);
            const stroke = format?.stroke ?? highlightedStroke ?? this.getNodeStroke(node);
            const strokeWidth =
                format?.strokeWidth ?? highlightedStrokeWidth ?? (isLeaf ? tile.strokeWidth : group.strokeWidth);
            const strokeOpacity =
                format?.strokeOpacity ??
                highlightedStrokeOpacity ??
                (isLeaf ? tile.strokeOpacity : group.strokeOpacity);

            rect.fill = validateColor(fill);
            rect.fillOpacity = fillOpacity;
            rect.stroke = validateColor(stroke);
            rect.strokeWidth = strokeWidth;
            rect.strokeOpacity = strokeOpacity;
            rect.crisp = true;

            rect.x = bbox.x;
            rect.y = bbox.y;
            rect.width = bbox.width;
            rect.height = bbox.height;
            rect.visible = true;
        };
        this.groupSelection.selectByClass(Rect).forEach((rect) => updateRectFn(rect.datum, rect, false));
        this.highlightSelection.selectByClass(Rect).forEach((rect) => {
            const isDatumHighlighted = rect.datum === highlightedNode;

            rect.visible = isDatumHighlighted || (highlightedNode?.contains(rect.datum) ?? false);
            if (rect.visible) {
                updateRectFn(rect.datum, rect, isDatumHighlighted);
            }
        });

        const labelMeta = Array.from(this.rootNode, (node) => {
            const { index, children } = node;
            const bbox = bboxes[index];
            const labelDatum = this.labelData?.[index];

            if (bbox == null || labelDatum == null) return undefined;

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
                if (formatting == null) return undefined;

                const { height, label, secondaryLabel } = formatting;
                const { textAlign, verticalAlign, padding } = tile;

                const textAlignFactor = textAlignFactors[textAlign] ?? 0.5;
                const labelX = bbox.x + padding + (bbox.width - 2 * padding) * textAlignFactor;

                const verticalAlignFactor = verticalAlignFactors[verticalAlign] ?? 0.5;
                const labelYStart =
                    bbox.y + padding + height * 0.5 + (bbox.height - 2 * padding - height) * verticalAlignFactor;

                return {
                    label:
                        label != null
                            ? {
                                  text: label.text,
                                  fontSize: label.fontSize,
                                  lineHeight: label.lineHeight,
                                  style: this.properties.tile.label,
                                  x: labelX,
                                  y: labelYStart - (height - label.height) * 0.5,
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
                                  y: labelYStart + (height - secondaryLabel.height) * 0.5,
                              }
                            : undefined,
                    verticalAlign: 'middle' as const,
                    textAlign,
                };
            } else if (labelDatum?.label != null) {
                const { padding, textAlign } = group;

                const groupTitleHeight = this.groupTitleHeight(node, bbox);
                if (groupTitleHeight == null) return undefined;

                const innerWidth = bbox.width - 2 * padding;
                const { text } = Text.wrap(labelDatum.label, bbox.width - 2 * padding, Infinity, group.label, 'never');
                const textAlignFactor = textAlignFactors[textAlign] ?? 0.5;

                return {
                    label: {
                        text,
                        fontSize: group.label.fontSize,
                        lineHeight: AutoSizedLabel.lineHeight(group.label.fontSize),
                        style: this.properties.group.label,
                        x: bbox.x + padding + innerWidth * textAlignFactor,
                        y: bbox.y + padding + groupTitleHeight * 0.5,
                    },
                    secondaryLabel: undefined,
                    verticalAlign: 'middle' as const,
                    textAlign,
                };
            } else {
                return undefined;
            }
        });

        const updateLabelFn = (
            node: _ModuleSupport.HierarchyNode,
            text: _Scene.Text,
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
                const { tile, group } = highlightStyle;
                highlightedColor = !isLeaf
                    ? group.label.color
                    : tag === TextNodeTag.Primary
                      ? tile.label.color
                      : tile.secondaryLabel.color;
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
        };
        this.groupSelection.selectByClass(Text).forEach((text) => {
            updateLabelFn(text.datum, text, text.tag, false);
        });
        this.highlightSelection.selectByClass(Text).forEach((text) => {
            const isDatumHighlighted = text.datum === highlightedNode;

            text.visible = isDatumHighlighted || (highlightedNode?.contains(text.datum) ?? false);
            if (text.visible) {
                updateLabelFn(text.datum, text, text.tag, isDatumHighlighted);
            }
        });
    }

    private updateNodeMidPoint(bboxes: (_Scene.BBox | undefined)[]) {
        this.rootNode.walk((node) => {
            const bbox = bboxes[node.index];
            if (bbox != null) {
                node.midPoint.x = bbox.x + bbox.width / 2;
                node.midPoint.y = bbox.y;
            }
        });
    }

    getTooltipHtml(node: _ModuleSupport.HierarchyNode): string {
        const { datum, depth } = node;
        const { id: seriesId } = this;
        const {
            tooltip,
            colorKey,
            colorName = colorKey,
            labelKey,
            secondaryLabelKey,
            sizeKey,
            sizeName = sizeKey,
        } = this.properties;
        const isLeaf = node.children.length === 0;
        const interactive = isLeaf || this.properties.group.interactive;
        if (datum == null || depth == null || !interactive) {
            return '';
        }

        const title = labelKey != null ? datum[labelKey] : undefined;

        const format = this.getTileFormat(node, false);
        const color = format?.fill ?? this.getNodeFill(node);

        if (!tooltip.renderer && !title) {
            return '';
        }

        const contentArray: string[] = [];

        const datumSecondaryLabel = secondaryLabelKey != null ? datum[secondaryLabelKey] : undefined;
        if (datumSecondaryLabel != null && secondaryLabelKey !== colorKey && secondaryLabelKey !== sizeKey) {
            contentArray.push(sanitizeHtml(datumSecondaryLabel));
        }

        const datumSize = sizeKey != null ? datum[sizeKey] : undefined;
        if (datumSize != null) {
            contentArray.push(`${sizeName!}: ${sanitizeHtml(datumSize)}`);
        }

        const datumColor = colorKey != null ? datum[colorKey] : undefined;
        if (datumColor != null) {
            contentArray.push(`${colorName!}: ${sanitizeHtml(datumColor)}`);
        }

        const content = contentArray.join('<br>');

        const defaults: AgTooltipRendererResult = {
            title,
            color: isLeaf ? this.properties.tile.label.color : this.properties.group.label.color,
            backgroundColor: color,
            content,
        };

        return tooltip.toTooltipHtml(defaults, {
            depth,
            datum,
            colorKey,
            labelKey,
            secondaryLabelKey,
            sizeKey,
            title,
            color,
            seriesId,
        });
    }
}
