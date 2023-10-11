import {
    type AgTooltipRendererResult,
    type AgTreemapSeriesFormat,
    type AgTreemapSeriesFormatterParams,
    type AgTreemapSeriesLabelsOptions,
    type AgTreemapSeriesTooltipRendererParams,
    type TextWrap,
    _ModuleSupport,
    _Scale,
    _Scene,
    _Util,
} from 'ag-charts-community';

const {
    Validate,
    OPT_FUNCTION,
    BOOLEAN,
    NUMBER,
    OPT_COLOR_STRING,
    OPT_NUMBER,
    OPT_STRING,
    SeriesTooltip,
    SeriesNodeClickEvent,
    TEXT_WRAP,
    HighlightStyle,
    STRING,
    NUMBER_ARRAY,
    COLOR_STRING_ARRAY,
    OPT_BOOLEAN,
} = _ModuleSupport;
const { Rect, Label, Group, DropShadow, BBox, Selection, Text } = _Scene;
const { ColorScale } = _Scale;
const { Color, Logger, toFixed, isEqual } = _Util;

type TreeDatum = {
    [prop: string]: any;
    children?: TreeDatum[];
};

type Side = 'left' | 'right' | 'top' | 'bottom';

interface TreemapNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    datum: TreeDatum;
    value: number;
    depth: number;
    label: string;
    fill: string;
    parent?: TreemapNodeDatum;
    isLeaf: boolean;
    children: TreemapNodeDatum[];
}

class TreemapSeriesNodeClickEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends SeriesNodeClickEvent<TreemapNodeDatum, TEvent> {
    readonly colorKey?: string;
    readonly labelKey?: string;
    readonly sizeKey?: string;
    constructor(type: TEvent, nativeEvent: MouseEvent, datum: TreemapNodeDatum, series: TreemapSeries) {
        super(type, nativeEvent, datum, series);
        this.colorKey = series.colorKey;
        this.labelKey = series.labelKey;
        this.sizeKey = series.sizeKey;
    }
}

class TreemapSeriesLabel extends Label {
    @Validate(NUMBER(0))
    padding = 10;
}

class TreemapSeriesTileLabel extends Label {
    @Validate(TEXT_WRAP)
    wrapping: TextWrap = 'on-space';
}

class TreemapValueLabel {
    @Validate(OPT_STRING)
    key?: string;

    @Validate(OPT_STRING)
    name?: string;

    @Validate(OPT_FUNCTION)
    formatter?: (params: { datum: any }) => string | undefined;

    style = (() => {
        const label = new Label();
        label.color = 'white';
        return label;
    })();
}

enum TextNodeTag {
    Name,
    Value,
}

const tempText = new Text();

function getTextSize(text: string, style: _Scene.Label): { width: number; height: number } {
    const { fontStyle, fontWeight, fontSize, fontFamily } = style;
    tempText.fontStyle = fontStyle;
    tempText.fontWeight = fontWeight;
    tempText.fontSize = fontSize;
    tempText.fontFamily = fontFamily;
    tempText.text = text;
    tempText.x = 0;
    tempText.y = 0;
    tempText.textAlign = 'left';
    tempText.textBaseline = 'top';
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

class TreemapTextHighlightStyle {
    @Validate(OPT_COLOR_STRING)
    color?: string = 'black';
}

class TreemapHighlightStyle extends HighlightStyle {
    override readonly text = new TreemapTextHighlightStyle();
}

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

    readonly title: TreemapSeriesLabel = (() => {
        const label = new TreemapSeriesLabel();
        label.color = 'white';
        label.fontWeight = 'bold';
        label.fontSize = 12;
        label.fontFamily = 'Verdana, sans-serif';
        label.padding = 15;
        return label;
    })();

    readonly subtitle: TreemapSeriesLabel = (() => {
        const label = new TreemapSeriesLabel();
        label.color = 'white';
        label.fontSize = 9;
        label.fontFamily = 'Verdana, sans-serif';
        label.padding = 13;
        return label;
    })();

    readonly labels = {
        large: (() => {
            const label = new TreemapSeriesTileLabel();
            label.color = 'white';
            label.fontWeight = 'bold';
            label.fontSize = 18;
            return label;
        })(),
        medium: (() => {
            const label = new TreemapSeriesTileLabel();
            label.color = 'white';
            label.fontWeight = 'bold';
            label.fontSize = 14;
            return label;
        })(),
        small: (() => {
            const label = new TreemapSeriesTileLabel();
            label.color = 'white';
            label.fontWeight = 'bold';
            label.fontSize = 10;
            return label;
        })(),
        formatter: undefined as AgTreemapSeriesLabelsOptions<any>['formatter'],
        value: new TreemapValueLabel(),
    };

    @Validate(NUMBER(0))
    nodePadding = 2;

    @Validate(NUMBER(0))
    nodeGap = 0;

    @Validate(STRING)
    labelKey: string = 'label';

    @Validate(OPT_STRING)
    sizeKey?: string = 'size';

    @Validate(OPT_STRING)
    colorKey?: string = 'color';

    @Validate(NUMBER_ARRAY)
    colorDomain: number[] = [-5, 5];

    @Validate(COLOR_STRING_ARRAY)
    colorRange: string[] = ['#cb4b3f', '#6acb64'];

    @Validate(OPT_STRING)
    groupFill: string = '#272931';

    @Validate(OPT_COLOR_STRING)
    groupStroke: string = 'black';

    @Validate(OPT_NUMBER(0))
    groupStrokeWidth: number = 1;

    @Validate(OPT_COLOR_STRING)
    tileStroke: string = 'black';

    @Validate(OPT_NUMBER(0))
    tileStrokeWidth: number = 1;

    @Validate(BOOLEAN)
    gradient: boolean = true;

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgTreemapSeriesFormatterParams) => AgTreemapSeriesFormat = undefined;

    @Validate(STRING)
    colorName: string = 'Change';

    @Validate(STRING)
    rootName: string = 'Root';

    @Validate(OPT_BOOLEAN)
    highlightGroups: boolean = true;

    tileShadow = new DropShadow();

    labelShadow = new DropShadow();

    readonly tooltip = new SeriesTooltip<AgTreemapSeriesTooltipRendererParams<any>>();

    override readonly highlightStyle = new TreemapHighlightStyle();

    private getNodePaddingTop(nodeDatum: TreemapNodeDatum, bbox: _Scene.BBox) {
        const { title, subtitle, nodePadding } = this;
        const label = nodeDatum.label;
        if (nodeDatum.isLeaf || !label || nodeDatum.depth === 0) {
            return nodePadding;
        }

        const font = nodeDatum.depth > 1 ? subtitle : title;
        const textSize = getTextSize(label, font);
        const heightRatioThreshold = 3;
        if (font.fontSize > bbox.width / heightRatioThreshold || font.fontSize > bbox.height / heightRatioThreshold) {
            return nodePadding;
        }

        if (textSize.height >= bbox.height) {
            return nodePadding;
        }

        return textSize.height + nodePadding + (font.padding ?? 0);
    }

    private getNodePadding(nodeDatum: TreemapNodeDatum, bbox: _Scene.BBox) {
        const { nodePadding } = this;
        const top = this.getNodePaddingTop(nodeDatum, bbox);
        return {
            top,
            right: nodePadding,
            bottom: nodePadding,
            left: nodePadding,
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

        outputNodesBoxes.set(nodeDatum, bbox);

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
        const gap = this.nodeGap / 2;
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
        const sides = Object.keys(innerBounds) as Side[];
        sides.forEach((side) => {
            if (!isEqual(innerBounds[side], childBounds[side])) {
                childBox.shrink(gap, side);
            }
        });
    }

    override async processData() {
        if (!this.data) {
            return;
        }

        const { data, sizeKey, labelKey, colorKey, colorDomain, colorRange, groupFill } = this;
        const labelFormatter = this.labels.formatter;

        const colorScale = new ColorScale();
        colorScale.domain = colorDomain;
        colorScale.range = colorRange;
        colorScale.update();

        const createTreeNodeDatum = (datum: TreeDatum, depth = 0, parent?: TreemapNodeDatum) => {
            let label;
            if (labelFormatter) {
                label = this.ctx.callbackCache.call(labelFormatter, {
                    datum,
                    seriesId: this.id,
                    defaultValue: null,
                });
            }
            label ??= labelKey ? datum[labelKey] ?? '' : '';
            let colorScaleValue = colorKey ? datum[colorKey] ?? depth : depth;
            colorScaleValue = validateColor(colorScaleValue);
            const isLeaf = !datum.children;
            let fill = groupFill;
            if (typeof colorScaleValue === 'string') {
                fill = colorScaleValue;
            } else if (isLeaf || !groupFill) {
                fill = colorScale.convert(colorScaleValue);
            }
            const nodeDatum: TreemapNodeDatum = {
                datum,
                depth,
                parent,
                value: 0,
                label,
                fill,
                series: this,
                isLeaf,
                children: [] as TreemapNodeDatum[],
            };
            if (isLeaf) {
                nodeDatum.value = sizeKey ? datum[sizeKey] ?? 1 : 1;
            } else {
                datum.children?.forEach((child) => {
                    const childNodeDatum = createTreeNodeDatum(child, depth + 1, nodeDatum);
                    const value = childNodeDatum.value;
                    if (isNaN(value) || !isFinite(value) || value === 0) {
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
        this.dataRoot = createTreeNodeDatum(data);
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
        return datum === highlightedDatum && (datum.isLeaf || this.highlightGroups);
    }

    private getTileFormat(datum: TreemapNodeDatum, isHighlighted: boolean): AgTreemapSeriesFormat {
        const {
            formatter,
            ctx: { callbackCache },
        } = this;
        if (!formatter) {
            return {};
        }

        const { gradient, colorKey, labelKey, sizeKey, tileStroke, tileStrokeWidth, groupStroke, groupStrokeWidth } =
            this;

        const stroke = datum.isLeaf ? tileStroke : groupStroke;
        const strokeWidth = datum.isLeaf ? tileStrokeWidth : groupStrokeWidth;

        const result = callbackCache.call(formatter, {
            seriesId: this.id,
            datum: datum.datum,
            depth: datum.depth,
            parent: datum.parent?.datum,
            colorKey,
            sizeKey,
            labelKey,
            fill: datum.fill,
            stroke,
            strokeWidth,
            gradient,
            highlighted: isHighlighted,
        });

        return result ?? {};
    }

    async updateNodes() {
        if (!this.chart) return;

        const {
            gradient,
            highlightStyle: {
                item: {
                    fill: highlightedFill,
                    fillOpacity: highlightedFillOpacity,
                    stroke: highlightedStroke,
                    strokeWidth: highlightedDatumStrokeWidth,
                },
                text: { color: highlightedTextColor },
            },
            tileStroke,
            tileStrokeWidth,
            groupStroke,
            groupStrokeWidth,
            tileShadow,
            labelShadow,
            dataRoot,
        } = this;

        if (!dataRoot) return;

        const seriesRect = this.chart.getSeriesRect()!;
        const boxes = this.squarify(dataRoot, new BBox(0, 0, seriesRect.width, seriesRect.height));
        const labelMeta = this.buildLabelMeta(boxes);
        const highlightedSubtree = this.getHighlightedSubtree(dataRoot);

        this.updateNodeMidPoint(boxes);

        const updateRectFn = (rect: _Scene.Rect, datum: TreemapNodeDatum, isDatumHighlighted: boolean) => {
            const box = boxes.get(datum)!;
            if (!box) {
                rect.visible = false;
                return;
            }

            const fill = isDatumHighlighted && highlightedFill !== undefined ? highlightedFill : datum.fill;
            const fillOpacity = (isDatumHighlighted ? highlightedFillOpacity : 1) ?? 1;
            let stroke = groupStroke;
            if (isDatumHighlighted && highlightedStroke !== undefined) {
                stroke = highlightedStroke;
            } else if (datum.isLeaf) {
                stroke = tileStroke;
            }
            let strokeWidth = groupStrokeWidth;
            if (isDatumHighlighted && highlightedDatumStrokeWidth !== undefined) {
                strokeWidth = highlightedDatumStrokeWidth;
            } else if (datum.isLeaf) {
                strokeWidth = tileStrokeWidth;
            }
            const format = this.getTileFormat(datum, isDatumHighlighted);

            const fillColor = validateColor(format?.fill ?? fill);
            if (format?.gradient ?? gradient) {
                const start = Color.tryParseFromString(fill).brighter().toString();
                const end = Color.tryParseFromString(fill).darker().toString();
                rect.fill = `linear-gradient(180deg, ${start}, ${end})`;
            } else {
                rect.fill = fillColor;
            }
            rect.fillOpacity = format?.fillOpacity ?? fillOpacity;
            rect.stroke = validateColor(format?.stroke ?? stroke);
            rect.strokeWidth = format?.strokeWidth ?? strokeWidth;
            rect.fillShadow = tileShadow;
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

            text.text = label.text;
            text.fontFamily = label.style.fontFamily;
            text.fontSize = label.style.fontSize;
            text.fontWeight = label.style.fontWeight;
            text.fill = highlighted ? highlightedTextColor ?? label.style.color : label.style.color;
            text.fillShadow = highlighted ? undefined : labelShadow;

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
        const {
            labels,
            title,
            subtitle,
            nodePadding,
            labelKey,
            ctx: { callbackCache },
        } = this;
        const wrappedRegExp = /-$/m;

        type TextMeta = {
            text: string;
            style: _Scene.Label;
            x: number;
            y: number;
            hAlign: CanvasTextAlign;
            vAlign: CanvasTextBaseline;
        };

        type LabelMeta = { label?: TextMeta; value?: TextMeta };
        const labelMeta = new Map<TreemapNodeDatum, LabelMeta>();

        boxes.forEach((box, datum) => {
            if (!labelKey || datum.depth === 0) {
                return;
            }

            const availTextWidth = box.width - 2 * nodePadding;
            const availTextHeight = box.height - 2 * nodePadding;
            const isBoxTooSmall = (labelStyle: _Scene.Label) => {
                const minSizeRatio = 3;
                return (
                    labelStyle.fontSize > box.width / minSizeRatio || labelStyle.fontSize > box.height / minSizeRatio
                );
            };

            let labelText = datum.isLeaf ? datum.label : datum.label.toUpperCase();

            let valueText = '';
            const valueConfig = labels.value;
            const valueStyle = valueConfig.style;
            const valueMargin = Math.ceil(valueStyle.fontSize * 2 * (_Scene.Text.defaultLineHeightRatio - 1));
            if (datum.isLeaf) {
                if (valueConfig.formatter) {
                    valueText = callbackCache.call(valueConfig.formatter, { datum: datum.datum }) ?? '';
                } else if (valueConfig.key) {
                    valueText = datum.datum[valueConfig.key];
                }
            }
            let valueSize = getTextSize(valueText, valueStyle);
            if (valueText && valueSize.width > availTextWidth) {
                valueText = '';
            }

            let labelStyle: _Scene.Label;
            let wrappedText = '';
            if (datum.isLeaf) {
                const pickStyle = () => {
                    const availHeight = availTextHeight - (valueText ? valueStyle.fontSize + valueMargin : 0);
                    const labelStyles = [labels.large, labels.medium, labels.small];
                    for (const style of labelStyles) {
                        const { width, height } = getTextSize(labelText, style);
                        if (height > availHeight || isBoxTooSmall(style)) {
                            continue;
                        }
                        if (width <= availTextWidth) {
                            return { style, wrappedText: undefined };
                        }
                        // Avoid hyphens and ellipsis for large and medium label styles
                        const wrapped = Text.wrap(labelText, availTextWidth, availHeight, style, style.wrapping);
                        if (
                            wrapped &&
                            wrapped !== '\u2026' &&
                            (style === labels.small || !(wrappedRegExp.exec(wrapped) || wrapped.endsWith('\u2026')))
                        ) {
                            return { style, wrappedText: wrapped };
                        }
                    }
                    // Check if small font fits by height
                    const smallSize = getTextSize(labelText, labels.small);
                    if (smallSize.height <= availHeight && !isBoxTooSmall(labels.small)) {
                        return { style: labels.small, wrappedText: undefined };
                    }
                    return { style: undefined, wrappedText: undefined };
                };

                let result = pickStyle();
                if (!result.style && valueText) {
                    valueText = '';
                    result = pickStyle();
                }
                labelStyle = result.style ?? labels.small;
                wrappedText = result.wrappedText ?? '';
            } else if (datum.depth === 1) {
                labelStyle = title;
            } else {
                labelStyle = subtitle;
            }

            const labelSize = getTextSize(wrappedText || labelText, labelStyle);
            if (isBoxTooSmall(labelStyle)) {
                // Avoid labels on too small tiles
                return;
            }

            // Crop text if not enough space
            if (labelSize.width > availTextWidth) {
                const textLength = Math.floor((labelText.length * availTextWidth) / labelSize.width) - 1;
                labelText = `${labelText.substring(0, textLength).trim()}…`;
            }

            valueSize = getTextSize(valueText, valueStyle);
            const hasValueText =
                valueText &&
                valueSize.width < availTextWidth &&
                valueSize.height + labelSize.height + valueMargin < availTextHeight;

            labelMeta.set(datum, {
                label: {
                    text: wrappedText || labelText,
                    style: labelStyle,
                    ...(datum.isLeaf
                        ? {
                              hAlign: 'center',
                              vAlign: 'middle',
                              x: box.x + box.width / 2,
                              y: box.y + box.height / 2 - (hasValueText ? valueSize.height / 2 + valueMargin / 2 : 0),
                          }
                        : {
                              hAlign: 'left',
                              vAlign: 'top',
                              x: box.x + nodePadding,
                              y: box.y + nodePadding,
                          }),
                },
                value: hasValueText
                    ? {
                          text: valueText,
                          style: valueStyle,
                          hAlign: 'center',
                          vAlign: 'middle',
                          x: box.x + box.width / 2,
                          y: box.y + box.height / 2 + labelSize.height / 2 + valueMargin / 2,
                      }
                    : undefined,
            });
        });

        return labelMeta;
    }

    override getSeriesDomain(_direction: _ModuleSupport.ChartAxisDirection): any[] {
        return [0, 1];
    }

    getTooltipHtml(nodeDatum: TreemapNodeDatum): string {
        if (!this.highlightGroups && !nodeDatum.isLeaf) {
            return '';
        }

        const {
            tooltip,
            sizeKey,
            labelKey,
            colorKey,
            rootName,
            id: seriesId,
            labels,
            ctx: { callbackCache },
        } = this;
        const { datum } = nodeDatum;

        const title: string | undefined = nodeDatum.depth ? datum[labelKey] : datum[labelKey] ?? rootName;
        let content = '';
        const format = this.getTileFormat(nodeDatum, false);
        const color = format?.fill ?? nodeDatum.fill ?? 'gray';

        const valueKey = labels.value.key;
        const valueFormatter = labels.value.formatter;
        if (valueKey || valueFormatter) {
            let valueText: string | undefined = '';
            if (valueFormatter) {
                valueText = callbackCache.call(valueFormatter, { datum });
            } else if (valueKey != null) {
                const value = datum[valueKey];
                if (typeof value === 'number' && isFinite(value)) {
                    valueText = toFixed(value);
                }
            }
            if (valueText) {
                if (labels.value.name) {
                    content += `<b>${labels.value.name}:</b> `;
                }
                content += valueText;
            }
        }

        const defaults: AgTooltipRendererResult = {
            title,
            backgroundColor: color,
            content,
        };

        if (!tooltip.renderer && !tooltip.format && !title && !content) {
            return '';
        }

        return tooltip.toTooltipHtml(defaults, {
            datum: nodeDatum.datum,
            parent: nodeDatum.parent?.datum,
            depth: nodeDatum.depth,
            sizeKey,
            labelKey,
            colorKey,
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
