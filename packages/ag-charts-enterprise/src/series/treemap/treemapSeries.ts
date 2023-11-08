import {
    type AgTooltipRendererResult,
    type AgTreemapSeriesFormatterParams,
    type AgTreemapSeriesLabelFormatterParams,
    type AgTreemapSeriesStyle,
    type AgTreemapSeriesTooltipRendererParams,
    type FontOptions,
    type TextAlign,
    type VerticalAlign,
    _ModuleSupport,
    _Scale,
    _Scene,
    _Util,
} from 'ag-charts-community';

import { TreemapSeriesTileLabel, formatLabels } from './treemapLabelFormatter';

const {
    HierarchyNode,
    HighlightStyle,
    SeriesNodeClickEvent,
    SeriesTooltip,
    Validate,
    NUMBER,
    BOOLEAN,
    OPT_COLOR_STRING,
    OPT_FUNCTION,
    OPT_NUMBER,
    OPT_STRING,
    TEXT_ALIGN,
    VERTICAL_ALIGN,
} = _ModuleSupport;
const { Rect, Label, Group, BBox, Selection, Text } = _Scene;
const { Color, Logger, isEqual } = _Util;

type Side = 'left' | 'right' | 'top' | 'bottom';

interface LabelData {
    label: string | undefined;
    secondaryLabel: string | undefined;
}

class TreemapSeriesNodeClickEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends SeriesNodeClickEvent<_ModuleSupport.HierarchyNode, TEvent> {
    readonly childrenKey?: string;
    readonly colorKey?: string;
    readonly labelKey?: string;
    readonly secondaryLabelKey?: string;
    readonly sizeKey?: string;
    constructor(type: TEvent, nativeEvent: MouseEvent, datum: _ModuleSupport.HierarchyNode, series: TreemapSeries) {
        super(type, nativeEvent, datum, series);
        this.childrenKey = series.childrenKey;
        this.colorKey = series.colorKey;
        this.labelKey = series.labelKey;
        this.secondaryLabelKey = series.secondaryLabelKey;
        this.secondaryLabelKey = series.secondaryLabelKey;
        this.sizeKey = series.sizeKey;
    }
}

class TreemapSeriesGroup {
    readonly label = new Label<AgTreemapSeriesLabelFormatterParams>();

    @Validate(BOOLEAN)
    interactive: boolean = true;

    @Validate(TEXT_ALIGN)
    textAlign: TextAlign = 'center';

    @Validate(OPT_STRING)
    fill: string = 'black';

    @Validate(OPT_NUMBER(0, 1))
    fillOpacity: number = 1;

    @Validate(OPT_COLOR_STRING)
    stroke: string = 'black';

    @Validate(OPT_NUMBER(0))
    strokeWidth: number = 1;

    @Validate(OPT_NUMBER(0, 1))
    strokeOpacity: number = 1;

    @Validate(OPT_NUMBER(0))
    padding: number = 0;

    @Validate(OPT_NUMBER(0))
    spacing: number = 0;

    @Validate(OPT_NUMBER(0))
    tileSpacing: number = 0;
}

class TreemapSeriesTile {
    readonly label = new TreemapSeriesTileLabel();

    readonly secondaryLabel = new TreemapSeriesTileLabel();

    @Validate(OPT_STRING)
    fill: string = 'black';

    @Validate(OPT_NUMBER(0, 1))
    fillOpacity: number = 1;

    @Validate(OPT_COLOR_STRING)
    stroke: string = 'black';

    @Validate(OPT_NUMBER(0))
    strokeWidth: number = 1;

    @Validate(OPT_NUMBER(0, 1))
    strokeOpacity: number = 1;

    @Validate(OPT_NUMBER(0))
    padding: number = 0;

    @Validate(OPT_NUMBER(0))
    spacing: number = 0;

    @Validate(TEXT_ALIGN)
    textAlign: TextAlign = 'center';

    @Validate(VERTICAL_ALIGN)
    verticalAlign: VerticalAlign = 'middle';
}

class TreemapSeriesGroupHighlightStyle {
    readonly label = new TreemapSeriesTileLabel();

    @Validate(OPT_STRING)
    fill?: string;

    @Validate(OPT_NUMBER(0, 1))
    fillOpacity?: number;

    @Validate(OPT_COLOR_STRING)
    stroke?: string;

    @Validate(OPT_NUMBER(0))
    strokeWidth?: number;

    @Validate(OPT_NUMBER(0, 1))
    strokeOpacity?: number;
}

class TreemapSeriesTileHighlightStyle {
    readonly label = new TreemapSeriesTileLabel();

    readonly secondaryLabel = new TreemapSeriesTileLabel();

    @Validate(OPT_STRING)
    fill?: string;

    @Validate(OPT_NUMBER(0, 1))
    fillOpacity?: number;

    @Validate(OPT_COLOR_STRING)
    stroke?: string;

    @Validate(OPT_NUMBER(0))
    strokeWidth?: number;

    @Validate(OPT_NUMBER(0, 1))
    strokeOpacity?: number;
}

class TreemapSeriesHighlightStyle extends HighlightStyle {
    readonly group = new TreemapSeriesGroupHighlightStyle();

    readonly tile = new TreemapSeriesTileHighlightStyle();
}

enum TextNodeTag {
    Name,
    Value,
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

export class TreemapSeries extends _ModuleSupport.HierarchySeries<_ModuleSupport.HierarchyNode> {
    static className = 'TreemapSeries';
    static type = 'treemap' as const;

    protected override readonly NodeClickEvent = TreemapSeriesNodeClickEvent;

    private groupSelection: _Scene.Selection<_Scene.Group, _ModuleSupport.HierarchyNode> = Selection.select(
        this.contentGroup,
        Group
    );
    private highlightSelection: _Scene.Selection<_Scene.Group, _ModuleSupport.HierarchyNode> = Selection.select(
        this.highlightGroup,
        Group
    );

    private labelData?: (LabelData | undefined)[];
    private sumSizes?: number[];

    readonly group = new TreemapSeriesGroup();

    readonly tile = new TreemapSeriesTile();

    override readonly highlightStyle = new TreemapSeriesHighlightStyle();

    readonly tooltip = new SeriesTooltip<AgTreemapSeriesTooltipRendererParams<any>>();

    @Validate(NUMBER(0))
    spacing = 0;

    @Validate(OPT_STRING)
    secondaryLabelKey?: string = undefined;

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgTreemapSeriesFormatterParams) => AgTreemapSeriesStyle = undefined;

    private groupTitleHeight(node: _ModuleSupport.HierarchyNode, bbox: _Scene.BBox): number | undefined {
        const label = this.labelData?.[node.index]?.label;

        const { label: font } = this.group;

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
            const { padding } = this.tile;
            return {
                top: padding,
                right: padding,
                bottom: padding,
                left: padding,
            };
        }

        const { padding, spacing } = this.group;
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
        super.processData();

        const { data, childrenKey, colorKey, labelKey, secondaryLabelKey, sizeKey, tile, group } = this;

        if (data == null || data.length === 0) {
            this.labelData = undefined;
            return;
        }

        const labelData: LabelData[] = new Array(data.length + 1).fill(undefined);

        this.rootNode.walk(({ index, datum, depth, children }) => {
            const isLeaf = children.length === 0;

            const labelStyle = isLeaf ? tile.label : group.label;
            let label: string | undefined;
            if (datum != null && depth != null && labelKey != null && labelStyle.enabled) {
                label = this.getLabelText(labelStyle, {
                    depth,
                    datum,
                    childrenKey,
                    colorKey,
                    labelKey,
                    secondaryLabelKey,
                    sizeKey,
                    value: datum[labelKey] ?? '',
                });
            }

            let secondaryLabel: string | undefined;
            if (isLeaf && datum != null && depth != null && secondaryLabelKey != null && tile.secondaryLabel.enabled) {
                secondaryLabel = this.getLabelText(tile.secondaryLabel, {
                    depth,
                    datum,
                    childrenKey,
                    colorKey,
                    labelKey,
                    secondaryLabelKey,
                    sizeKey,
                    value: datum[secondaryLabelKey] ?? '',
                });
            }

            labelData[index] = { label, secondaryLabel };
        });

        this.labelData = labelData;

        const sumSizes: number[] = new Array(data.length + 1).fill(0);

        this.rootNode.walk(({ index, size, children }) => {
            sumSizes[index] = children.reduce((sumSize, child) => sumSize + sumSizes[child.index], size);
        }, HierarchyNode.Walk.PostOrder);

        this.sumSizes = sumSizes;
    }

    /**
     * Squarified Treemap algorithm
     * https://www.win.tue.nl/~vanwijk/stm.pdf
     */
    private squarify(node: _ModuleSupport.HierarchyNode, bbox: _Scene.BBox, outputBoxes: (_Scene.BBox | undefined)[]) {
        const { sumSizes } = this;
        const { index, datum, children } = node;

        if (bbox.width <= 0 || bbox.height <= 0 || sumSizes == null) {
            outputBoxes[index] = undefined;
            return;
        }

        outputBoxes[index] = index !== 0 ? bbox : undefined;

        const nodeSize = (node: _ModuleSupport.HierarchyNode) => sumSizes[node.index];

        const sortedChildrenIndices = Array.from(children, (_, index) => index).sort((aIndex, bIndex) => {
            return nodeSize(children[bIndex]) - nodeSize(children[aIndex]);
        });

        const childAt = (index: number) => {
            const sortedIndex = sortedChildrenIndices[index];
            return children[sortedIndex];
        };

        const targetTileAspectRatio = 1; // The width and height will tend to this ratio
        const padding = datum != null ? this.getNodePadding(node, bbox) : { top: 0, right: 0, bottom: 0, left: 0 };
        const width = bbox.width - padding.left - padding.right;
        const height = bbox.height - padding.top - padding.bottom;

        if (width <= 0 || height <= 0) {
            return;
        }

        let stackSum = 0;
        let startIndex = 0;
        let minRatioDiff = Infinity;
        let partitionSum = nodeSize(node);
        const innerBox = new BBox(bbox.x + padding.left, bbox.y + padding.top, width, height);
        const partition = innerBox.clone();

        for (let i = 0; i < children.length; i++) {
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

                const x = isVertical ? start : partition.x;
                const y = isVertical ? partition.y : start;
                const length = (partLength * nodeSize(child)) / stackSum;
                const width = isVertical ? length : stackThickness;
                const height = isVertical ? stackThickness : length;

                const childBbox = new BBox(x, y, width, height);
                this.applyGap(innerBox, childBbox);
                this.squarify(child, childBbox, outputBoxes);

                partitionSum -= nodeSize(child);
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
        for (let i = startIndex; i < children.length; i++) {
            const child = childAt(i);
            const x = isVertical ? start : partition.x;
            const y = isVertical ? partition.y : start;
            const part = nodeSize(child) / partitionSum;
            const width = partition.width * (isVertical ? part : 1);
            const height = partition.height * (isVertical ? 1 : part);
            const childBox = new BBox(x, y, width, height);
            this.applyGap(innerBox, childBox);
            this.squarify(child, childBox, outputBoxes);
            start += isVertical ? width : height;
        }
    }

    private applyGap(innerBox: _Scene.BBox, childBox: _Scene.BBox) {
        const gap = this.group.tileSpacing / 2;
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

    async update() {
        await this.updateSelections();
        await this.updateNodes();
    }

    async updateSelections() {
        if (!this.nodeDataRefresh) {
            return;
        }
        this.nodeDataRefresh = false;

        const { chart } = this;

        if (!chart) {
            return;
        }

        const seriesRect = chart.getSeriesRect();

        if (!seriesRect) {
            return;
        }

        const descendants: _ModuleSupport.HierarchyNode[] = Array.from(this.rootNode) as any;
        descendants.shift();

        const updateGroup = (group: _Scene.Group) => {
            group.append([new Rect(), new Text({ tag: TextNodeTag.Name }), new Text({ tag: TextNodeTag.Value })]);
        };

        this.groupSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
        this.highlightSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
    }

    private isDatumHighlighted(node: _ModuleSupport.HierarchyNode) {
        const highlightedNode = this.ctx.highlightManager?.getActiveHighlight();
        return node === highlightedNode && (node.children.length === 0 || this.group.interactive);
    }

    private getTileFormat(node: _ModuleSupport.HierarchyNode, isHighlighted: boolean): AgTreemapSeriesStyle {
        const { datum, color: fill, depth, children } = node;
        const {
            tile,
            group,
            formatter,
            ctx: { callbackCache },
        } = this;
        if (!formatter || datum == null || depth == null) {
            return {};
        }

        const { colorKey, labelKey, secondaryLabelKey, sizeKey } = this;
        const isLeaf = children.length === 0;

        const stroke = isLeaf ? tile.stroke : group.stroke;
        const strokeWidth = isLeaf ? tile.strokeWidth : group.strokeWidth;

        const result = callbackCache.call(formatter, {
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

    async updateNodes() {
        const { rootNode, data, highlightStyle, tile, group } = this;

        if (!this.chart || !data) return;

        const { width, height } = this.chart.getSeriesRect()!;
        const bboxes: (_Scene.BBox | undefined)[] = new Array(data.length + 1);
        this.squarify(rootNode, new BBox(0, 0, width, height), bboxes);

        const labelMeta = this.buildLabelMeta(bboxes);

        const highlightedSubtree = this.getHighlightedSubtree();

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

            const fill = highlightedFill ?? node.color ?? (isLeaf ? tile.fill : group.fill);
            const fillOpacity = highlightedFillOpacity ?? (isLeaf ? tile.fillOpacity : group.fillOpacity);
            const stroke = highlightedStroke ?? (isLeaf ? tile.stroke : group.stroke);
            const strokeWidth = highlightedStrokeWidth ?? (isLeaf ? tile.strokeWidth : group.strokeWidth);
            const strokeOpacity = highlightedStrokeOpacity ?? (isLeaf ? tile.strokeOpacity : group.strokeOpacity);

            const format = this.getTileFormat(node, highlighted);

            rect.fill = validateColor(format?.fill ?? fill);
            rect.fillOpacity = format?.fillOpacity ?? fillOpacity;
            rect.stroke = validateColor(format?.stroke ?? stroke);
            rect.strokeWidth = format?.strokeWidth ?? strokeWidth;
            rect.strokeOpacity = format?.strokeOpacity ?? strokeOpacity;
            rect.crisp = true;

            rect.x = bbox.x;
            rect.y = bbox.y;
            rect.width = bbox.width;
            rect.height = bbox.height;
            rect.visible = true;
        };
        this.groupSelection.selectByClass(Rect).forEach((rect) => updateRectFn(rect.datum, rect, false));
        this.highlightSelection.selectByClass(Rect).forEach((rect) => {
            const isDatumHighlighted = this.isDatumHighlighted(rect.datum);

            rect.visible = isDatumHighlighted || highlightedSubtree.has(rect.datum);
            if (rect.visible) {
                updateRectFn(rect.datum, rect, isDatumHighlighted);
            }
        });

        const updateLabelFn = (
            node: _ModuleSupport.HierarchyNode,
            text: _Scene.Text,
            highlighted: boolean,
            key: 'label' | 'secondaryLabel'
        ) => {
            const isLeaf = node.children.length === 0;
            const meta = labelMeta[node.index];
            const label = meta?.[key];
            if (!label) {
                text.visible = false;
                return;
            }

            let highlightedColor: string | undefined;
            if (highlighted) {
                const { tile, group } = highlightStyle;
                highlightedColor = !isLeaf
                    ? group.label.color
                    : key === 'label'
                    ? tile.label.color
                    : tile.secondaryLabel.color;
            }

            text.text = label.text;
            text.fontSize = label.fontSize;

            text.fontFamily = label.style.fontFamily;
            text.fontWeight = label.style.fontWeight;
            text.fill = highlightedColor ?? label.style.color;

            text.textAlign = label.hAlign;
            text.textBaseline = label.vAlign;
            text.x = label.x;
            text.y = label.y;
            text.visible = true;
        };
        this.groupSelection
            .selectByTag<_Scene.Text>(TextNodeTag.Name)
            .forEach((text) => updateLabelFn(text.datum, text, false, 'label'));
        this.highlightSelection.selectByTag<_Scene.Text>(TextNodeTag.Name).forEach((text) => {
            const isDatumHighlighted = this.isDatumHighlighted(text.datum);

            text.visible = isDatumHighlighted || highlightedSubtree.has(text.datum);
            if (text.visible) {
                updateLabelFn(text.datum, text, isDatumHighlighted, 'label');
            }
        });
        this.groupSelection
            .selectByTag<_Scene.Text>(TextNodeTag.Value)
            .forEach((text) => updateLabelFn(text.datum, text, false, 'secondaryLabel'));
        this.highlightSelection.selectByTag<_Scene.Text>(TextNodeTag.Value).forEach((text) => {
            const isDatumHighlighted = this.isDatumHighlighted(text.datum);

            text.visible = isDatumHighlighted || highlightedSubtree.has(text.datum);
            if (text.visible) {
                updateLabelFn(text.datum, text, isDatumHighlighted, 'secondaryLabel');
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

    private getHighlightedSubtree(): Set<_ModuleSupport.HierarchyNode> {
        const highlightedNode: _ModuleSupport.HierarchyNode | undefined =
            this.ctx.highlightManager?.getActiveHighlight() as any;
        return highlightedNode != null ? new Set(highlightedNode) : new Set();
    }

    buildLabelMeta(bboxes: (_Scene.BBox | undefined)[]) {
        const { group, tile } = this;

        type TextMeta = {
            text: string;
            fontSize: number;
            style: Omit<_Scene.Label, 'fontSize'>;
            x: number;
            y: number;
            hAlign: CanvasTextAlign;
            vAlign: CanvasTextBaseline;
        };

        type LabelMeta = { label?: TextMeta; secondaryLabel?: TextMeta };

        return Array.from(this.rootNode, (node): LabelMeta | undefined => {
            const { index, datum, children } = node;
            const bbox = bboxes[index];
            const labelData = this.labelData![index];
            const label = labelData?.label;
            const secondaryLabel = labelData?.secondaryLabel;

            if (datum == null || bbox == null || label == null) {
                return undefined;
            } else if (children.length === 0) {
                const labelsFormatting = formatLabels(
                    label,
                    tile.label,
                    secondaryLabel,
                    tile.secondaryLabel,
                    bbox,
                    tile
                );

                if (labelsFormatting == null) {
                    return undefined;
                }

                const { textAlign, verticalAlign, padding } = tile;
                const { label: labelFormatting, secondaryLabel: secondaryLabelFormatting } = labelsFormatting;

                const totalHeight =
                    secondaryLabelFormatting != null
                        ? labelFormatting.height + tile.spacing + secondaryLabelFormatting.height
                        : labelFormatting.height;

                const textAlignFactor = textAlignFactors[textAlign] ?? 0.5;
                const labelX = bbox.x + padding + (bbox.width - 2 * padding) * textAlignFactor;

                const verticalAlignFactor = verticalAlignFactors[verticalAlign] ?? 0.5;
                const labelYStart =
                    bbox.y +
                    padding +
                    totalHeight * 0.5 +
                    (bbox.height - 2 * padding - totalHeight) * verticalAlignFactor;

                return {
                    label: {
                        text: labelFormatting.text,
                        fontSize: labelFormatting.fontSize,
                        style: tile.label,
                        hAlign: textAlign,
                        vAlign: 'middle',
                        x: labelX,
                        y: labelYStart - (totalHeight - labelFormatting.height) * 0.5,
                    },
                    secondaryLabel:
                        secondaryLabelFormatting != null
                            ? {
                                  text: secondaryLabelFormatting.text,
                                  fontSize: secondaryLabelFormatting.fontSize,
                                  style: tile.secondaryLabel,
                                  hAlign: textAlign,
                                  vAlign: 'middle',
                                  x: labelX,
                                  y: labelYStart + (totalHeight - secondaryLabelFormatting.height) * 0.5,
                              }
                            : undefined,
                };
            } else if (datum != null) {
                const { padding, textAlign } = group;
                const groupTitleHeight = this.groupTitleHeight(node, bbox);

                if (groupTitleHeight == null) {
                    return undefined;
                }

                const innerWidth = bbox.width - 2 * padding;
                const text = Text.wrap(label, bbox.width - 2 * padding, Infinity, group.label, 'never');
                const textAlignFactor = textAlignFactors[textAlign] ?? 0.5;

                return {
                    label: {
                        text,
                        fontSize: group.label.fontSize,
                        style: group.label,
                        hAlign: textAlign,
                        vAlign: 'middle',
                        x: bbox.x + padding + innerWidth * textAlignFactor,
                        y: bbox.y + padding + groupTitleHeight * 0.5,
                    },
                    secondaryLabel: undefined,
                };
            }
        });
    }

    override getSeriesDomain(_direction: _ModuleSupport.ChartAxisDirection): any[] {
        return [0, 1];
    }

    getTooltipHtml(node: _ModuleSupport.HierarchyNode): string {
        const { tooltip, colorKey, labelKey, secondaryLabelKey, sizeKey, id: seriesId } = this;
        const { datum, depth } = node;
        const isLeaf = node.children.length === 0;
        const interactive = isLeaf || this.group.interactive;
        if (datum == null || depth == null || !interactive) {
            return '';
        }

        const title = labelKey != null ? datum[labelKey] : undefined;

        const format = this.getTileFormat(node, false);
        const color = format?.fill ?? node.color;

        const defaults: AgTooltipRendererResult = {
            title,
            backgroundColor: color,
        };

        if (!tooltip.renderer && !tooltip.format && !title) {
            return '';
        }

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

    getLegendData() {
        // Override point for subclasses.
        return [];
    }
}
