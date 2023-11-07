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
    HighlightStyle,
    SeriesNodeClickEvent,
    SeriesTooltip,
    Validate,
    NUMBER,
    BOOLEAN,
    OPT_COLOR_STRING_ARRAY,
    OPT_COLOR_STRING,
    OPT_FUNCTION,
    OPT_NUMBER_ARRAY,
    OPT_NUMBER,
    OPT_STRING,
    STRING,
    TEXT_ALIGN,
    VERTICAL_ALIGN,
} = _ModuleSupport;
const { Rect, Label, Group, BBox, Selection, Text } = _Scene;
const { ColorScale } = _Scale;
const { Color, Logger, isEqual } = _Util;

type TreeDatum = {
    [prop: string]: any;
};

type Side = 'left' | 'right' | 'top' | 'bottom';

interface TreemapNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    datum: TreeDatum | undefined;
    value: number;
    depth: number | undefined;
    label: string | undefined;
    secondaryLabel: string | undefined;
    fill: string;
    parent: TreemapNodeDatum | undefined;
    isLeaf: boolean;
    children: TreemapNodeDatum[];
}

class TreemapSeriesNodeClickEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends SeriesNodeClickEvent<TreemapNodeDatum, TEvent> {
    readonly childrenKey: string;
    readonly colorKey?: string;
    readonly labelKey?: string;
    readonly secondaryLabelKey?: string;
    readonly sizeKey?: string;
    constructor(type: TEvent, nativeEvent: MouseEvent, datum: TreemapNodeDatum, series: TreemapSeries) {
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

export class TreemapSeries extends _ModuleSupport.HierarchySeries<TreemapNodeDatum> {
    static className = 'TreemapSeries';
    static type = 'treemap' as const;

    protected override readonly NodeClickEvent = TreemapSeriesNodeClickEvent;

    private groupSelection: _Scene.Selection<_Scene.Group, TreemapNodeDatum> = Selection.select(
        this.contentGroup,
        Group
    );
    private highlightSelection: _Scene.Selection<_Scene.Group, TreemapNodeDatum> = Selection.select(
        this.highlightGroup,
        Group
    );

    private dataRoot?: TreemapNodeDatum;

    readonly group = new TreemapSeriesGroup();

    readonly tile = new TreemapSeriesTile();

    override readonly highlightStyle = new TreemapSeriesHighlightStyle();

    readonly tooltip = new SeriesTooltip<AgTreemapSeriesTooltipRendererParams<any>>();

    @Validate(NUMBER(0))
    spacing = 0;

    @Validate(OPT_STRING)
    labelKey?: string = 'label';

    @Validate(OPT_STRING)
    secondaryLabelKey?: string = undefined;

    @Validate(OPT_STRING)
    sizeKey?: string = 'size';

    @Validate(STRING)
    childrenKey: string = 'children';

    @Validate(OPT_STRING)
    colorKey?: string = 'color';

    @Validate(OPT_NUMBER_ARRAY)
    colorDomain?: number[] = undefined;

    @Validate(OPT_COLOR_STRING_ARRAY)
    colorRange?: string[] = undefined;

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgTreemapSeriesFormatterParams) => AgTreemapSeriesStyle = undefined;

    @Validate(STRING)
    colorName: string = 'Change';

    private groupTitleHeight(nodeDatum: TreemapNodeDatum, bbox: _Scene.BBox): number | undefined {
        if (nodeDatum.depth == null || nodeDatum.isLeaf) {
            return undefined;
        }

        const { label: font } = this.group;

        const heightRatioThreshold = 3;

        if (nodeDatum.label == null) {
            return undefined;
        } else if (
            font.fontSize > bbox.width / heightRatioThreshold ||
            font.fontSize > bbox.height / heightRatioThreshold
        ) {
            return undefined;
        } else {
            const { height: fontHeight } = getTextSize(nodeDatum.label, font);
            return Math.max(fontHeight, font.fontSize);
        }
    }

    private getNodePadding(nodeDatum: TreemapNodeDatum, bbox: _Scene.BBox) {
        if (nodeDatum.depth == null) {
            return {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
            };
        } else if (nodeDatum.isLeaf) {
            const { padding } = this.tile;
            return {
                top: padding,
                right: padding,
                bottom: padding,
                left: padding,
            };
        }

        const { padding, spacing } = this.group;
        const fontHeight = this.groupTitleHeight(nodeDatum, bbox);
        const titleHeight = fontHeight != null ? fontHeight + spacing : 0;

        return {
            top: padding + titleHeight,
            right: padding,
            bottom: padding,
            left: padding,
        };
    }

    /**
     * Squarified Treemap algorithm
     * https://www.win.tue.nl/~vanwijk/stm.pdf
     */
    private squarify(
        nodeDatum: TreemapNodeDatum,
        bbox: _Scene.BBox,
        outputNodesBoxes: Map<TreemapNodeDatum, _Scene.BBox> = new Map()
    ): typeof outputNodesBoxes {
        if (bbox.width <= 0 || bbox.height <= 0) {
            return outputNodesBoxes;
        }

        if (nodeDatum.depth != null) {
            outputNodesBoxes.set(nodeDatum, bbox);
        }

        const targetTileAspectRatio = 1; // The width and height will tend to this ratio
        const padding = this.getNodePadding(nodeDatum, bbox);
        const width = bbox.width - padding.left - padding.right;
        const height = bbox.height - padding.top - padding.bottom;
        if (width <= 0 || height <= 0 || nodeDatum.value <= 0) {
            return outputNodesBoxes;
        }

        let stackSum = 0;
        let startIndex = 0;
        let minRatioDiff = Infinity;
        let partitionSum = nodeDatum.value;
        const children = nodeDatum.children;
        const innerBox = new BBox(bbox.x + padding.left, bbox.y + padding.top, width, height);
        const partition = innerBox.clone();

        for (let i = 0; i < children.length; i++) {
            const value = children[i].value;
            const firstValue = children[startIndex].value;
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
                const child = children[j];

                const x = isVertical ? start : partition.x;
                const y = isVertical ? partition.y : start;
                const length = (partLength * child.value) / stackSum;
                const width = isVertical ? length : stackThickness;
                const height = isVertical ? stackThickness : length;

                const childBox = new BBox(x, y, width, height);
                this.applyGap(innerBox, childBox);
                this.squarify(child, childBox, outputNodesBoxes);

                partitionSum -= child.value;
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
            const x = isVertical ? start : partition.x;
            const y = isVertical ? partition.y : start;
            const part = children[i].value / partitionSum;
            const width = partition.width * (isVertical ? part : 1);
            const height = partition.height * (isVertical ? 1 : part);
            const childBox = new BBox(x, y, width, height);
            this.applyGap(innerBox, childBox);
            this.squarify(children[i], childBox, outputNodesBoxes);
            start += isVertical ? width : height;
        }

        return outputNodesBoxes;
    }

    private applyGap(innerBox: _Scene.BBox, childBox: _Scene.BBox) {
        const gap = this.group.tileSpacing / 2;
        const getBounds = (box: _Scene.BBox): Record<Side, number> => {
            return {
                left: box.x,
                top: box.y,
                right: box.x + box.width,
                bottom: box.y + box.height,
            };
        };
        const innerBounds = getBounds(innerBox);
        const childBounds = getBounds(childBox);
        const sides: Side[] = ['top', 'right', 'bottom', 'left'];
        sides.forEach((side) => {
            if (!isEqual(innerBounds[side], childBounds[side])) {
                childBox.shrink(gap, side);
            }
        });
    }

    override async processData() {
        const {
            data,
            childrenKey,
            colorKey,
            labelKey,
            secondaryLabelKey,
            sizeKey,
            colorDomain,
            colorRange,
            tile,
            group,
        } = this;

        if (!data || data.length === 0) {
            return;
        }

        let colorScale: _Scale.ColorScale | undefined;
        if (colorDomain != null && colorRange != null) {
            colorScale = new ColorScale();
            colorScale.domain = colorDomain;
            colorScale.range = colorRange;
            colorScale.update();
        }

        type CreateTreeNodeDatumParams = {
            datum?: TreeDatum;
            depth?: number;
            parent?: TreemapNodeDatum;
            children?: TreeDatum[];
        };
        const createTreeNodeDatum = ({
            datum,
            depth,
            parent,
            children = datum != null ? datum[childrenKey] : undefined,
        }: CreateTreeNodeDatumParams) => {
            const isLeaf = children == null || children.length === 0;

            const labelStyle = isLeaf ? tile.label : group.label;
            let label: string | undefined;
            if (datum != null && depth != null && labelKey != null && labelStyle.enabled) {
                label = this.getLabelText(labelStyle, {
                    datum,
                    depth,
                    parent: parent?.datum,
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
                    datum,
                    depth,
                    parent: parent?.datum,
                    childrenKey,
                    colorKey,
                    labelKey,
                    secondaryLabelKey,
                    sizeKey,
                    value: datum[secondaryLabelKey] ?? '',
                });
            }

            let colorScaleValue = (datum != null && colorKey != null ? datum[colorKey] : undefined) ?? depth;
            colorScaleValue = validateColor(colorScaleValue);
            let fill = isLeaf ? tile.fill : group.fill;
            if (typeof colorScaleValue === 'string') {
                fill = colorScaleValue;
            } else if (colorScale != null) {
                fill = colorScale.convert(colorScaleValue);
            }

            const nodeDatum: TreemapNodeDatum = {
                datum,
                depth,
                parent,
                value: 0,
                label,
                secondaryLabel,
                fill,
                series: this,
                isLeaf,
                children: [] as TreemapNodeDatum[],
            };

            if (isLeaf) {
                nodeDatum.value = datum != null && sizeKey != null ? datum[sizeKey] ?? 1 : 1;
            } else {
                children?.forEach((childDatum) => {
                    const childNodeDatum = createTreeNodeDatum({
                        datum: childDatum,
                        depth: depth != null ? depth + 1 : 0,
                        parent: nodeDatum,
                    });
                    const value = childNodeDatum.value;
                    if (!Number.isFinite(value) || value <= 0) {
                        return;
                    }
                    nodeDatum.value += value;
                    nodeDatum.children.push(childNodeDatum);
                });
                nodeDatum.children.sort((a, b) => {
                    return b.value - a.value;
                });
            }

            return nodeDatum;
        };

        this.dataRoot = createTreeNodeDatum({ children: data });
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

        const { chart, dataRoot } = this;

        if (!chart || !dataRoot) {
            return;
        }

        const seriesRect = chart.getSeriesRect();

        if (!seriesRect) {
            return;
        }

        const descendants: TreemapNodeDatum[] = [];

        this.traverseTree(dataRoot, (datum) => descendants.push(datum));

        const updateGroup = (group: _Scene.Group) => {
            group.append([new Rect(), new Text({ tag: TextNodeTag.Name }), new Text({ tag: TextNodeTag.Value })]);
        };

        this.groupSelection.update(descendants, updateGroup);
        this.highlightSelection.update(descendants, updateGroup);
    }

    private isDatumHighlighted(datum: TreemapNodeDatum) {
        const highlightedDatum = this.ctx.highlightManager?.getActiveHighlight();
        return datum === highlightedDatum && (datum.isLeaf || this.group.interactive);
    }

    private getTileFormat(datum: TreemapNodeDatum, isHighlighted: boolean): AgTreemapSeriesStyle {
        const {
            tile,
            group,
            formatter,
            ctx: { callbackCache },
        } = this;
        if (!formatter || datum.depth == null) {
            return {};
        }

        const { colorKey, labelKey, secondaryLabelKey, sizeKey } = this;

        const stroke = datum.isLeaf ? tile.stroke : group.stroke;
        const strokeWidth = datum.isLeaf ? tile.strokeWidth : group.strokeWidth;

        const result = callbackCache.call(formatter, {
            seriesId: this.id,
            datum: datum.datum,
            depth: datum.depth,
            parent: datum.parent?.datum,
            colorKey,
            labelKey,
            secondaryLabelKey,
            sizeKey,
            fill: datum.fill,
            stroke,
            strokeWidth,
            highlighted: isHighlighted,
        });

        return result ?? {};
    }

    async updateNodes() {
        if (!this.chart) return;

        const { highlightStyle, tile, group, dataRoot } = this;

        if (!dataRoot) return;

        const seriesRect = this.chart.getSeriesRect()!;
        const boxes = this.squarify(dataRoot, new BBox(0, 0, seriesRect.width, seriesRect.height));
        const labelMeta = this.buildLabelMeta(boxes);
        const highlightedSubtree = this.getHighlightedSubtree(dataRoot);

        this.updateNodeMidPoint(boxes);

        const updateRectFn = (rect: _Scene.Rect, datum: TreemapNodeDatum, highlighted: boolean) => {
            const box = boxes.get(datum)!;
            if (!box) {
                rect.visible = false;
                return;
            }

            const { isLeaf } = datum;

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

            const fill = highlightedFill ?? datum.fill;
            const fillOpacity = highlightedFillOpacity ?? (isLeaf ? tile.fillOpacity : group.fillOpacity);
            const stroke = highlightedStroke ?? (isLeaf ? tile.stroke : group.stroke);
            const strokeWidth = highlightedStrokeWidth ?? (isLeaf ? tile.strokeWidth : group.strokeWidth);
            const strokeOpacity = highlightedStrokeOpacity ?? (isLeaf ? tile.strokeOpacity : group.strokeOpacity);

            const format = this.getTileFormat(datum, highlighted);

            rect.fill = validateColor(format?.fill ?? fill);
            rect.fillOpacity = format?.fillOpacity ?? fillOpacity;
            rect.stroke = validateColor(format?.stroke ?? stroke);
            rect.strokeWidth = format?.strokeWidth ?? strokeWidth;
            rect.strokeOpacity = format?.strokeOpacity ?? strokeOpacity;
            rect.crisp = true;

            rect.x = box.x;
            rect.y = box.y;
            rect.width = box.width;
            rect.height = box.height;
            rect.visible = true;
        };
        this.groupSelection.selectByClass(Rect).forEach((rect) => updateRectFn(rect, rect.datum, false));
        this.highlightSelection.selectByClass(Rect).forEach((rect) => {
            const isDatumHighlighted = this.isDatumHighlighted(rect.datum);

            rect.visible = isDatumHighlighted || highlightedSubtree.has(rect.datum);
            if (rect.visible) {
                updateRectFn(rect, rect.datum, isDatumHighlighted);
            }
        });

        const updateLabelFn = (
            text: _Scene.Text,
            datum: TreemapNodeDatum,
            highlighted: boolean,
            key: 'label' | 'value'
        ) => {
            const meta = labelMeta.get(datum);
            const label = meta?.[key];
            if (!label) {
                text.visible = false;
                return;
            }

            const { isLeaf } = datum;

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
            .forEach((text) => updateLabelFn(text, text.datum, false, 'label'));
        this.highlightSelection.selectByTag<_Scene.Text>(TextNodeTag.Name).forEach((text) => {
            const isDatumHighlighted = this.isDatumHighlighted(text.datum);

            text.visible = isDatumHighlighted || highlightedSubtree.has(text.datum);
            if (text.visible) {
                updateLabelFn(text, text.datum, isDatumHighlighted, 'label');
            }
        });

        this.groupSelection
            .selectByTag<_Scene.Text>(TextNodeTag.Value)
            .forEach((text) => updateLabelFn(text, text.datum, false, 'value'));
        this.highlightSelection.selectByTag<_Scene.Text>(TextNodeTag.Value).forEach((text) => {
            const isDatumHighlighted = this.isDatumHighlighted(text.datum);

            text.visible = isDatumHighlighted || highlightedSubtree.has(text.datum);
            if (text.visible) {
                updateLabelFn(text, text.datum, isDatumHighlighted, 'value');
            }
        });
    }

    private updateNodeMidPoint(boxes: Map<TreemapNodeDatum, _Scene.BBox>) {
        boxes.forEach((box, treeNodeDatum) => {
            treeNodeDatum.midPoint = {
                x: box.x + box.width / 2,
                y: box.y,
            };
        });
    }

    private getHighlightedSubtree(dataRoot: TreemapNodeDatum): Set<TreemapNodeDatum> {
        const items = new Set<TreemapNodeDatum>();
        this.traverseTree(dataRoot, (datum) => {
            if (this.isDatumHighlighted(datum) || (datum.parent && items.has(datum.parent))) {
                items.add(datum);
            }
        });
        return items;
    }

    private traverseTree<D extends { children?: D[] }>(datum: D, iterator: (datum: D) => void) {
        iterator(datum);
        datum.children?.forEach((childDatum) => this.traverseTree(childDatum, iterator));
    }

    buildLabelMeta(boxes: Map<TreemapNodeDatum, _Scene.BBox>) {
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

        type LabelMeta = { label?: TextMeta; value?: TextMeta };
        const labelMeta = new Map<TreemapNodeDatum, LabelMeta>();

        boxes.forEach((box, datum) => {
            if (datum.label == null) {
                return;
            } else if (datum.isLeaf) {
                const labelFormatting = formatLabels(
                    datum.label,
                    tile.label,
                    datum.secondaryLabel,
                    tile.secondaryLabel,
                    box,
                    tile
                );

                if (labelFormatting == null) {
                    return;
                }

                const { textAlign, verticalAlign, padding } = tile;
                const { label, secondaryLabel } = labelFormatting;

                const totalHeight =
                    secondaryLabel != null ? label.height + tile.spacing + secondaryLabel.height : label.height;

                const textAlignFactor = textAlignFactors[textAlign] ?? 0.5;
                const labelX = box.x + padding + (box.width - 2 * padding) * textAlignFactor;

                const verticalAlignFactor = verticalAlignFactors[verticalAlign] ?? 0.5;
                const labelYStart =
                    box.y +
                    padding +
                    totalHeight * 0.5 +
                    (box.height - 2 * padding - totalHeight) * verticalAlignFactor;

                labelMeta.set(datum, {
                    label: {
                        text: label.text,
                        fontSize: label.fontSize,
                        style: tile.label,
                        hAlign: textAlign,
                        vAlign: 'middle',
                        x: labelX,
                        y: labelYStart - (totalHeight - label.height) * 0.5,
                    },
                    value:
                        secondaryLabel != null
                            ? {
                                  text: secondaryLabel.text,
                                  fontSize: secondaryLabel.fontSize,
                                  style: tile.secondaryLabel,
                                  hAlign: textAlign,
                                  vAlign: 'middle',
                                  x: labelX,
                                  y: labelYStart + (totalHeight - secondaryLabel.height) * 0.5,
                              }
                            : undefined,
                });
            } else {
                const { padding, label, textAlign } = group;
                const groupTitleHeight = this.groupTitleHeight(datum, box);

                if (groupTitleHeight == null) {
                    return;
                }

                const innerWidth = box.width - 2 * padding;
                const text = Text.wrap(datum.label, box.width - 2 * padding, Infinity, label, 'never');
                const textAlignFactor = textAlignFactors[textAlign] ?? 0.5;

                labelMeta.set(datum, {
                    label: {
                        text,
                        fontSize: label.fontSize,
                        style: label,
                        hAlign: textAlign,
                        vAlign: 'middle',
                        x: box.x + padding + innerWidth * textAlignFactor,
                        y: box.y + padding + groupTitleHeight * 0.5,
                    },
                });
            }
        });

        return labelMeta;
    }

    override getSeriesDomain(_direction: _ModuleSupport.ChartAxisDirection): any[] {
        return [0, 1];
    }

    getTooltipHtml(nodeDatum: TreemapNodeDatum): string {
        const { tooltip, colorKey, labelKey, secondaryLabelKey, sizeKey, id: seriesId } = this;
        const { datum, parent, depth, isLeaf } = nodeDatum;
        const interactive = isLeaf || this.group.interactive;
        if (datum == null || depth == null || !interactive) {
            return '';
        }

        const title = labelKey != null ? datum[labelKey] : undefined;

        const format = this.getTileFormat(nodeDatum, false);
        const color = format?.fill ?? nodeDatum.fill;

        const defaults: AgTooltipRendererResult = {
            title,
            backgroundColor: color,
        };

        if (!tooltip.renderer && !tooltip.format && !title) {
            return '';
        }

        return tooltip.toTooltipHtml(defaults, {
            datum: datum,
            parent: parent?.datum,
            depth: depth,
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
