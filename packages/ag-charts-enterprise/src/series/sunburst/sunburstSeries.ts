import {
    type AgSunburstSeriesFormatterParams,
    type AgSunburstSeriesLabelFormatterParams,
    type AgSunburstSeriesStyle,
    type AgSunburstSeriesTooltipRendererParams,
    type AgTooltipRendererResult,
    _ModuleSupport,
    _Scene,
    _Util,
} from 'ag-charts-community';

import { AutoSizeableLabel, formatLabels } from '../util/labelFormatter';

const { Logger } = _Util;

const { HighlightStyle, SeriesTooltip, Validate, OPT_COLOR_STRING, OPT_FUNCTION, OPT_NUMBER, NUMBER, OPT_STRING } =
    _ModuleSupport;
const { Sector, Group, Selection, Text } = _Scene;

interface LabelData {
    label: string | undefined;
    secondaryLabel: string | undefined;
}

const getAngleData = (
    node: _ModuleSupport.HierarchyNode,
    startAngle = 0,
    angleScale = (2 * Math.PI) / node.sumSize,
    angleData: Array<{ start: number; end: number } | undefined> = Array.from(node, () => undefined)
) => {
    let currentAngle = startAngle;
    for (const child of node.children) {
        const start = currentAngle;
        const end = currentAngle + child.sumSize * angleScale;
        angleData[child.index] = { start, end };
        getAngleData(child, start, angleScale, angleData);
        currentAngle = end;
    }
    return angleData;
};

class SunburstLabel extends AutoSizeableLabel<AgSunburstSeriesLabelFormatterParams> {
    @Validate(NUMBER())
    spacing: number = 0;
}

class SunburstSeriesTileHighlightStyle extends HighlightStyle {
    readonly label = new AutoSizeableLabel<AgSunburstSeriesLabelFormatterParams>();

    readonly secondaryLabel = new AutoSizeableLabel<AgSunburstSeriesLabelFormatterParams>();

    @Validate(OPT_STRING)
    fill?: string = undefined;

    @Validate(OPT_NUMBER(0, 1))
    fillOpacity?: number = undefined;

    @Validate(OPT_COLOR_STRING)
    stroke?: string = undefined;

    @Validate(OPT_NUMBER(0))
    strokeWidth?: number = undefined;

    @Validate(OPT_NUMBER(0, 1))
    strokeOpacity?: number = undefined;
}

enum CircleQuarter {
    TopLeft = 0b0001,
    TopRight = 0b0010,
    BottomRight = 0b0100,
    BottomLeft = 0b1000,
    Top = 0b0011,
    Right = 0b0110,
    Bottom = 0b1100,
    Left = 0b1001,
}

enum LabelPlacement {
    CenterCircle,
    Parallel,
    Perpendicular,
}

enum TextNodeTag {
    Primary,
    Secondary,
}

export class SunburstSeries extends _ModuleSupport.HierarchySeries<_ModuleSupport.HierarchyNode> {
    static className = 'SunburstSeries';
    static type = 'sunburst' as const;

    readonly tooltip = new SeriesTooltip<AgSunburstSeriesTooltipRendererParams<any>>();

    private groupSelection: _Scene.Selection<_Scene.Group, _ModuleSupport.HierarchyNode> = Selection.select(
        this.contentGroup,
        Group
    );
    private highlightSelection: _Scene.Selection<_Scene.Group, _ModuleSupport.HierarchyNode> = Selection.select(
        this.highlightGroup,
        Group
    );

    private angleData: Array<{ start: number; end: number } | undefined> = [];

    private labelData?: (LabelData | undefined)[];

    override readonly highlightStyle = new SunburstSeriesTileHighlightStyle();

    readonly label = new SunburstLabel();

    readonly secondaryLabel = new AutoSizeableLabel<AgSunburstSeriesLabelFormatterParams>();

    @Validate(OPT_STRING)
    labelKey?: string = undefined;

    @Validate(OPT_STRING)
    secondaryLabelKey?: string = undefined;

    @Validate(NUMBER(0, 1))
    fillOpacity: number = 1;

    @Validate(NUMBER(0))
    strokeWidth: number = 0;

    @Validate(NUMBER(0, 1))
    strokeOpacity: number = 1;

    @Validate(OPT_NUMBER())
    sectorSpacing?: number = undefined;

    @Validate(OPT_NUMBER())
    padding?: number = undefined;

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgSunburstSeriesFormatterParams) => AgSunburstSeriesStyle = undefined;

    override async processData() {
        const { labelKey, secondaryLabelKey, childrenKey, colorKey, sizeKey } = this;

        super.processData();

        this.angleData = getAngleData(this.rootNode);

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

        const hasInvalidFontSize = (label: AutoSizeableLabel<AgSunburstSeriesLabelFormatterParams> | undefined) => {
            return (
                label != null &&
                label.minimumFontSize != null &&
                label.fontSize &&
                label.minimumFontSize > label.fontSize
            );
        };

        if (hasInvalidFontSize(this.label) || hasInvalidFontSize(this.secondaryLabel)) {
            Logger.warnOnce(`minimumFontSize should be set to a value less than or equal to the font size`);
        }

        this.labelData = Array.from(this.rootNode, ({ datum, depth }) => {
            let label: string | undefined;
            if (datum != null && depth != null && labelKey != null && this.label.enabled) {
                const value = datum[labelKey] ?? '';
                label = this.getLabelText(
                    this.label,
                    { depth, datum, childrenKey, colorKey, labelKey, secondaryLabelKey, sizeKey, value },
                    defaultLabelFormatter
                );
            }
            if (label === '') {
                label = undefined;
            }

            let secondaryLabel: string | undefined;
            if (datum != null && depth != null && secondaryLabelKey != null && this.secondaryLabel.enabled) {
                const value = datum[secondaryLabelKey] ?? '';
                secondaryLabel = this.getLabelText(
                    this.secondaryLabel,
                    { depth, datum, childrenKey, colorKey, labelKey, secondaryLabelKey, sizeKey, value },
                    defaultLabelFormatter
                );
            }
            if (secondaryLabel === '') {
                secondaryLabel = undefined;
            }

            return label != null || secondaryLabel != null ? { label, secondaryLabel } : undefined;
        });
    }

    async updateSelections() {
        if (!this.nodeDataRefresh) return;
        this.nodeDataRefresh = false;

        const { chart } = this;
        if (chart == null) return;

        const seriesRect = chart.seriesRect;
        if (seriesRect == null) return;

        const descendants: _ModuleSupport.HierarchyNode[] = Array.from(this.rootNode);

        const updateGroup = (group: _Scene.Group) => {
            group.append([
                new Sector(),
                new Text({ tag: TextNodeTag.Primary }),
                new Text({ tag: TextNodeTag.Secondary }),
            ]);
        };

        this.groupSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
        this.highlightSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
    }

    async updateNodes() {
        const { chart, data, maxDepth, sectorSpacing = 0, padding = 0, highlightStyle, labelData } = this;

        if (chart == null || data == null || labelData == null) return;

        const { width, height } = chart.seriesRect!;

        this.contentGroup.translationX = width / 2;
        this.contentGroup.translationY = height / 2;
        this.highlightGroup.translationX = width / 2;
        this.highlightGroup.translationY = height / 2;

        const baseInset = sectorSpacing * 0.5;
        const radius = Math.min(width, height) / 2;
        const radiusScale = radius / (maxDepth + 1);
        const angleOffset = -Math.PI / 2;

        const highlightedNode: _ModuleSupport.HierarchyNode | undefined =
            this.ctx.highlightManager?.getActiveHighlight() as any;

        const labelTextNode = new Text();
        labelTextNode.setFont(this.label);

        this.rootNode.walk((node) => {
            const angleDatum = this.angleData[node.index];
            if (node.depth != null && angleDatum != null) {
                const midAngle = angleDatum.end - angleDatum.start;
                const midRadius = (node.depth + 0.5) * radiusScale;
                node.midPoint.x = Math.cos(midAngle) * midRadius;
                node.midPoint.y = Math.sin(midAngle) * midRadius;
            }
        });

        const updateSector = (node: _ModuleSupport.HierarchyNode, sector: _Scene.Sector, highlighted: boolean) => {
            const { depth } = node;
            const angleDatum = this.angleData[node.index];
            if (depth == null || angleDatum == null) {
                sector.visible = false;
                return;
            }

            sector.visible = true;

            let highlightedFill: string | undefined;
            let highlightedFillOpacity: number | undefined;
            let highlightedStroke: string | undefined;
            let highlightedStrokeWidth: number | undefined;
            let highlightedStrokeOpacity: number | undefined;
            if (highlighted) {
                highlightedFill = highlightStyle.fill;
                highlightedFillOpacity = highlightStyle.fillOpacity;
                highlightedStroke = highlightStyle.stroke;
                highlightedStrokeWidth = highlightStyle.strokeWidth;
                highlightedStrokeOpacity = highlightStyle.strokeOpacity;
            }

            const format = this.getSectorFormat(node, highlighted);

            const fill = format?.fill ?? highlightedFill ?? node.fill;
            const fillOpacity = format?.fillOpacity ?? highlightedFillOpacity ?? this.fillOpacity;
            const stroke = format?.stroke ?? highlightedStroke ?? node.stroke;
            const strokeWidth = format?.strokeWidth ?? highlightedStrokeWidth ?? this.strokeWidth;
            const strokeOpacity = format?.strokeOpacity ?? highlightedStrokeOpacity ?? this.strokeOpacity;

            sector.fill = fill;
            sector.fillOpacity = fillOpacity;
            sector.stroke = stroke;
            sector.strokeWidth = strokeWidth;
            sector.strokeOpacity = strokeOpacity;

            sector.centerX = 0;
            sector.centerY = 0;
            sector.innerRadius = depth * radiusScale;
            sector.outerRadius = (depth + 1) * radiusScale;
            sector.angleOffset = angleOffset;
            sector.startAngle = angleDatum.start;
            sector.endAngle = angleDatum.end;
            sector.inset = baseInset + strokeWidth * 0.5;
        };

        this.groupSelection.selectByClass(Sector).forEach((sector) => {
            updateSector(sector.datum, sector, false);
        });
        this.highlightSelection.selectByClass(Sector).forEach((sector) => {
            const node: _ModuleSupport.HierarchyNode = sector.datum;
            const isHighlighted = highlightedNode === node;
            sector.visible = isHighlighted;
            if (sector.visible) {
                updateSector(sector.datum, sector, isHighlighted);
            }
        });

        const labelMeta = Array.from(this.rootNode, (node, index) => {
            const { depth } = node;
            const labelDatum = labelData[index];
            const angleData = this.angleData[index];
            if (depth == null || angleData == null) return undefined;

            const innerRadius = depth * radiusScale;
            const outerRadius = (depth + 1) * radiusScale;
            const { start: startAngle, end: endAngle } = angleData;

            const sizeFittingHeight = (height: number) => {
                const isCenterCircle = depth === 0 && node.parent?.sumSize === node.sumSize;
                if (isCenterCircle) {
                    const width = 2 * Math.sqrt(outerRadius ** 2 - (height * 0.5) ** 2);
                    return { width, height, meta: LabelPlacement.CenterCircle };
                }

                const parallelHeight = height;
                const availableWidthUntilItHitsTheOuterRadius =
                    2 * Math.sqrt(outerRadius ** 2 - (innerRadius + parallelHeight) ** 2);
                const deltaAngle = endAngle - startAngle;
                const availableWidthUntilItHitsTheStraightEdges =
                    deltaAngle < Math.PI ? 2 * innerRadius * Math.tan(deltaAngle * 0.5) : Infinity;
                const parallelWidth = Math.min(
                    availableWidthUntilItHitsTheOuterRadius,
                    availableWidthUntilItHitsTheStraightEdges
                );

                let perpendicularHeight: number;
                let perpendicularWidth: number;
                if (depth === 0) {
                    // Wedge from center - maximize the width of a box with fixed height
                    perpendicularHeight = height;
                    perpendicularWidth =
                        Math.sqrt(outerRadius ** 2 - (perpendicularHeight / 2) ** 2) -
                        height / (2 * Math.tan(deltaAngle * 0.5));
                } else {
                    // Outer wedge - fit the height to the sector, then fit the width
                    perpendicularHeight = 2 * innerRadius * Math.tan(deltaAngle * 0.5);
                    perpendicularWidth = Math.sqrt(outerRadius ** 2 - (perpendicularHeight / 2) ** 2) - innerRadius;
                }

                return parallelWidth >= perpendicularWidth
                    ? { width: parallelWidth, height: parallelHeight, meta: LabelPlacement.Parallel }
                    : { width: perpendicularWidth, height: perpendicularHeight, meta: LabelPlacement.Perpendicular };
            };

            const formatting = formatLabels<LabelPlacement, AgSunburstSeriesLabelFormatterParams>(
                labelDatum?.label,
                this.label,
                labelDatum?.secondaryLabel,
                this.secondaryLabel,
                { spacing: this.label.spacing, padding },
                sizeFittingHeight
            );

            if (formatting == null) return undefined;

            const { width, height, meta: labelPlacement, label, secondaryLabel } = formatting;

            const theta = angleOffset + (angleData.start + angleData.end) / 2;
            const top = Math.sin(theta) >= 0;
            const right = Math.cos(theta) >= 0;
            const circleQuarter =
                (top ? CircleQuarter.Top : CircleQuarter.Bottom) & (right ? CircleQuarter.Right : CircleQuarter.Left);

            let radius: number;
            switch (labelPlacement) {
                case LabelPlacement.CenterCircle:
                    radius = 0;
                    break;
                case LabelPlacement.Parallel: {
                    const opticalCentering = 0.58; // Between 0 and 1 - there's no maths behind this, just what visually looks good
                    const insetOuterRadius = outerRadius - baseInset;
                    const idealRadius = insetOuterRadius - (radiusScale - height) * opticalCentering;
                    const maximumRadius = Math.sqrt((insetOuterRadius - padding) ** 2 - (width / 2) ** 2);
                    radius = Math.min(idealRadius, maximumRadius);
                    break;
                }
                case LabelPlacement.Perpendicular:
                    if (depth === 0) {
                        const minimumRadius = height / (2 * Math.tan((endAngle - startAngle) * 0.5)) + width * 0.5;
                        const maximumRadius = Math.sqrt(outerRadius ** 2 - (height * 0.5) ** 2) - width * 0.5;
                        radius = (minimumRadius + maximumRadius) * 0.5;
                    } else {
                        radius = (innerRadius + outerRadius) * 0.5;
                    }
                    break;
            }

            return { width, height, labelPlacement, circleQuarter, radius, theta, label, secondaryLabel };
        });

        const updateText = (
            node: _ModuleSupport.HierarchyNode,
            text: _Scene.Text,
            tag: TextNodeTag,
            highlighted: boolean
        ) => {
            const { index, depth } = node;
            const meta = labelMeta?.[index];
            const labelStyle = tag === TextNodeTag.Primary ? this.label : this.secondaryLabel;
            const label = tag === TextNodeTag.Primary ? meta?.label : meta?.secondaryLabel;
            if (depth == null || meta == null || label == null || meta == null) {
                text.visible = false;
                return;
            }

            const { height, labelPlacement, circleQuarter, radius, theta } = meta;

            let highlightedColor: string | undefined;
            if (highlighted) {
                const highlightedLabelStyle =
                    tag === TextNodeTag.Primary ? this.highlightStyle.label : this.highlightStyle.secondaryLabel;
                highlightedColor = highlightedLabelStyle.color;
            }

            text.text = label.text;
            text.fontSize = label.fontSize;

            text.fontStyle = labelStyle.fontStyle;
            text.fontFamily = labelStyle.fontFamily;
            text.fontWeight = labelStyle.fontWeight;
            text.fill = highlightedColor ?? labelStyle.color;

            switch (labelPlacement) {
                case LabelPlacement.CenterCircle:
                    text.textAlign = 'center';
                    text.textBaseline = 'top';
                    text.translationX = 0;
                    text.translationY = (tag === TextNodeTag.Primary ? 0 : height - label.height) - height * 0.5;
                    text.rotation = 0;
                    break;
                case LabelPlacement.Parallel: {
                    const topHalf = (circleQuarter & CircleQuarter.Top) !== 0;
                    const translationRadius =
                        (tag === TextNodeTag.Primary) === !topHalf ? radius : radius - (height - label.height);
                    text.textAlign = 'center';
                    text.textBaseline = topHalf ? 'bottom' : 'top';
                    text.translationX = Math.cos(theta) * translationRadius;
                    text.translationY = Math.sin(theta) * translationRadius;
                    text.rotation = topHalf ? theta - Math.PI * 0.5 : theta + Math.PI * 0.5;
                    break;
                }
                case LabelPlacement.Perpendicular: {
                    const rightHalf = (circleQuarter & CircleQuarter.Right) !== 0;
                    const translation =
                        (tag === TextNodeTag.Primary) === !rightHalf
                            ? (height - label.height) * 0.5
                            : (label.height - height) * 0.5;
                    text.textAlign = 'center';
                    text.textBaseline = 'middle';
                    text.translationX = Math.cos(theta) * radius + Math.cos(theta + Math.PI / 2) * translation;
                    text.translationY = Math.sin(theta) * radius + Math.sin(theta + Math.PI / 2) * translation;
                    text.rotation = rightHalf ? theta : theta + Math.PI;
                    break;
                }
            }
            text.visible = true;
        };

        this.groupSelection.selectByClass(Text).forEach((text) => {
            updateText(text.datum, text, text.tag, false);
        });
        this.highlightSelection.selectByClass(Text).forEach((text) => {
            const node: _ModuleSupport.HierarchyNode = text.datum;
            const isHighlighted = highlightedNode === node;
            text.visible = isHighlighted;
            if (text.visible) {
                updateText(text.datum, text, text.tag, isHighlighted);
            }
        });
    }

    override async update() {
        await this.updateSelections();
        await this.updateNodes();
    }

    private getSectorFormat(node: _ModuleSupport.HierarchyNode, isHighlighted: boolean): AgSunburstSeriesStyle {
        const { datum, fill, stroke, depth } = node;
        const {
            formatter,
            ctx: { callbackCache },
        } = this;
        if (!formatter || datum == null || depth == null) {
            return {};
        }

        const { colorKey, labelKey, sizeKey, strokeWidth } = this;

        const result = callbackCache.call(formatter, {
            seriesId: this.id,
            depth,
            datum,
            colorKey,
            labelKey,
            sizeKey,
            fill,
            stroke,
            strokeWidth,
            highlighted: isHighlighted,
        });

        return result ?? {};
    }

    override getTooltipHtml(node: _ModuleSupport.HierarchyNode): string {
        const { tooltip, colorKey, labelKey, sizeKey, id: seriesId } = this;
        const { datum, depth } = node;
        if (datum == null || depth == null) {
            return '';
        }

        const title = labelKey != null ? datum[labelKey] : undefined;

        const format = this.getSectorFormat(node, false);
        const color = format?.fill ?? node.fill;

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
            sizeKey,
            title,
            color,
            seriesId,
        });
    }

    override async createNodeData() {
        return [];
    }

    override getSeriesDomain() {
        return [NaN, NaN];
    }

    override getLegendData() {
        return [];
    }
}
