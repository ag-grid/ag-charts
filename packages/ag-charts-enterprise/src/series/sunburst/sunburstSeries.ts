import {
    type AgSunburstSeriesLabelFormatterParams,
    type AgSunburstSeriesStyle,
    type AgTooltipRendererResult,
    _ModuleSupport,
    _Scene,
    _Util,
} from 'ag-charts-community';

import { formatLabels } from '../util/labelFormatter';
import { SunburstSeriesProperties } from './sunburstSeriesProperties';

const { fromToMotion } = _ModuleSupport;
const { Sector, Group, Selection, Text } = _Scene;
const { sanitizeHtml } = _Util;

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

export class SunburstSeries extends _ModuleSupport.HierarchySeries<
    _Scene.Group,
    SunburstSeriesProperties,
    _ModuleSupport.SeriesNodeDatum
> {
    static readonly className = 'SunburstSeries';
    static readonly type = 'sunburst' as const;

    override properties = new SunburstSeriesProperties();

    groupSelection = Selection.select(this.contentGroup, Group);
    private highlightSelection: _Scene.Selection<_Scene.Group, _ModuleSupport.HierarchyNode> = Selection.select(
        this.highlightGroup,
        Group
    );

    private angleData: Array<{ start: number; end: number } | undefined> = [];

    private labelData?: (LabelData | undefined)[];

    override async processData() {
        const { childrenKey, colorKey, colorName, labelKey, secondaryLabelKey, sizeKey, sizeName } = this.properties;

        await super.processData();

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

        this.labelData = Array.from(this.rootNode, ({ datum, depth }) => {
            let label: string | undefined;
            if (datum != null && depth != null && labelKey != null) {
                const value = (datum as any)[labelKey];
                label = this.getLabelText(
                    this.properties.label,
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
            if (datum != null && depth != null && secondaryLabelKey != null) {
                const value = (datum as any)[secondaryLabelKey];
                secondaryLabel = this.getLabelText(
                    this.properties.secondaryLabel,
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
        const { chart, data, maxDepth, labelData } = this;

        if (chart == null || data == null || labelData == null) {
            return;
        }

        const { width, height } = chart.seriesRect!;
        const { sectorSpacing = 0, padding = 0, cornerRadius, highlightStyle } = this.properties;

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
        labelTextNode.setFont(this.properties.label);

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
            const fillOpacity = format?.fillOpacity ?? highlightedFillOpacity ?? this.properties.fillOpacity;
            const stroke = format?.stroke ?? highlightedStroke ?? node.stroke;
            const strokeWidth = format?.strokeWidth ?? highlightedStrokeWidth ?? this.properties.strokeWidth;
            const strokeOpacity = format?.strokeOpacity ?? highlightedStrokeOpacity ?? this.properties.strokeOpacity;

            sector.fill = fill;
            sector.fillOpacity = fillOpacity;
            sector.stroke = stroke;
            sector.strokeWidth = strokeWidth;
            sector.strokeOpacity = strokeOpacity;

            sector.centerX = 0;
            sector.centerY = 0;
            sector.innerRadius = depth * radiusScale;
            sector.outerRadius = (depth + 1) * radiusScale;
            sector.startAngle = angleDatum.start + angleOffset;
            sector.endAngle = angleDatum.end + angleOffset;
            sector.inset = baseInset + strokeWidth * 0.5;
            sector.cornerRadius = cornerRadius;
            sector.scaleCornerRadiiIndependently = true;
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
            if (depth == null || angleData == null) {
                return;
            }

            const innerRadius = depth * radiusScale + baseInset;
            const outerRadius = (depth + 1) * radiusScale - baseInset;
            const innerAngleOffset = innerRadius > baseInset ? baseInset / innerRadius : baseInset;
            const outerAngleOffset = outerRadius > baseInset ? baseInset / outerRadius : baseInset;
            const innerStartAngle = angleData.start + innerAngleOffset;
            const innerEndAngle = angleData.end + innerAngleOffset;
            const deltaInnerAngle = innerEndAngle - innerStartAngle;
            const outerStartAngle = angleData.start + outerAngleOffset;
            const outerEndAngle = angleData.end + outerAngleOffset;
            const deltaOuterAngle = outerEndAngle - outerStartAngle;

            const sizeFittingHeight = (labelHeight: number) => {
                const isCenterCircle = depth === 0 && node.parent?.sumSize === node.sumSize;
                if (isCenterCircle) {
                    const labelWidth = 2 * Math.sqrt(outerRadius ** 2 - (labelHeight * 0.5) ** 2);
                    return { width: labelWidth, height: labelHeight, meta: LabelPlacement.CenterCircle };
                }

                const parallelHeight = labelHeight;
                const availableWidthUntilItHitsTheOuterRadius =
                    2 * Math.sqrt(outerRadius ** 2 - (innerRadius + parallelHeight) ** 2);
                const availableWidthUntilItHitsTheStraightEdges =
                    deltaInnerAngle < Math.PI ? 2 * innerRadius * Math.tan(deltaInnerAngle * 0.5) : Infinity;
                const parallelWidth = Math.min(
                    availableWidthUntilItHitsTheOuterRadius,
                    availableWidthUntilItHitsTheStraightEdges
                );

                let perpendicularHeight: number;
                let perpendicularWidth: number;
                if (depth === 0) {
                    // Wedge from center - maximize the width of a box with fixed height
                    perpendicularHeight = labelHeight;
                    perpendicularWidth =
                        Math.sqrt(outerRadius ** 2 - (perpendicularHeight / 2) ** 2) -
                        labelHeight / (2 * Math.tan(deltaOuterAngle * 0.5));
                } else {
                    // Outer wedge - fit the height to the sector, then fit the width
                    perpendicularHeight = 2 * innerRadius * Math.tan(deltaInnerAngle * 0.5);
                    perpendicularWidth = Math.sqrt(outerRadius ** 2 - (perpendicularHeight / 2) ** 2) - innerRadius;
                }

                return parallelWidth >= perpendicularWidth
                    ? { width: parallelWidth, height: parallelHeight, meta: LabelPlacement.Parallel }
                    : { width: perpendicularWidth, height: perpendicularHeight, meta: LabelPlacement.Perpendicular };
            };

            const formatting = formatLabels<LabelPlacement, AgSunburstSeriesLabelFormatterParams>(
                labelDatum?.label,
                this.properties.label,
                labelDatum?.secondaryLabel,
                this.properties.secondaryLabel,
                { padding },
                sizeFittingHeight
            );

            if (formatting == null) {
                return;
            }

            const { width: labelWidth, height: labelHeight, meta: labelPlacement, label, secondaryLabel } = formatting;

            const theta = angleOffset + (angleData.start + angleData.end) / 2;
            const top = Math.sin(theta) >= 0;
            const right = Math.cos(theta) >= 0;
            const circleQuarter =
                (top ? CircleQuarter.Top : CircleQuarter.Bottom) & (right ? CircleQuarter.Right : CircleQuarter.Left);

            let labelRadius: number;
            switch (labelPlacement) {
                case LabelPlacement.CenterCircle:
                    labelRadius = 0;
                    break;
                case LabelPlacement.Parallel: {
                    const opticalCentering = 0.58; // Between 0 and 1 - there's no maths behind this, just what visually looks good
                    const idealRadius = outerRadius - (radiusScale - labelHeight) * opticalCentering;
                    const maximumRadius = Math.sqrt((outerRadius - padding) ** 2 - (labelWidth / 2) ** 2);
                    labelRadius = Math.min(idealRadius, maximumRadius);
                    break;
                }
                case LabelPlacement.Perpendicular:
                    if (depth === 0) {
                        const minimumRadius = labelHeight / (2 * Math.tan(deltaInnerAngle * 0.5)) + labelWidth * 0.5;
                        const maximumRadius = Math.sqrt(outerRadius ** 2 - (labelHeight * 0.5) ** 2) - labelWidth * 0.5;
                        labelRadius = (minimumRadius + maximumRadius) * 0.5;
                    } else {
                        labelRadius = (innerRadius + outerRadius) * 0.5;
                    }
                    break;
            }

            return {
                width: labelWidth,
                height: labelHeight,
                labelPlacement,
                circleQuarter,
                radius: labelRadius,
                theta,
                label,
                secondaryLabel,
            };
        });

        const updateText = (
            node: _ModuleSupport.HierarchyNode,
            text: _Scene.Text,
            tag: TextNodeTag,
            highlighted: boolean
        ) => {
            const { index, depth } = node;
            const meta = labelMeta?.[index];
            const labelStyle = tag === TextNodeTag.Primary ? this.properties.label : this.properties.secondaryLabel;
            const label = tag === TextNodeTag.Primary ? meta?.label : meta?.secondaryLabel;
            if (depth == null || meta == null || label == null) {
                text.visible = false;
                return;
            }

            const { height: textHeight, labelPlacement, circleQuarter, radius: textRadius, theta } = meta;

            let highlightedColor: string | undefined;
            if (highlighted) {
                const highlightedLabelStyle =
                    tag === TextNodeTag.Primary
                        ? this.properties.highlightStyle.label
                        : this.properties.highlightStyle.secondaryLabel;
                highlightedColor = highlightedLabelStyle.color;
            }

            text.text = label.text;
            text.fontSize = label.fontSize;
            text.lineHeight = label.lineHeight;

            text.fontStyle = labelStyle.fontStyle;
            text.fontFamily = labelStyle.fontFamily;
            text.fontWeight = labelStyle.fontWeight;
            text.fill = highlightedColor ?? labelStyle.color;

            switch (labelPlacement) {
                case LabelPlacement.CenterCircle:
                    text.textAlign = 'center';
                    text.textBaseline = 'top';
                    text.translationX = 0;
                    text.translationY =
                        (tag === TextNodeTag.Primary ? 0 : textHeight - label.height) - textHeight * 0.5;
                    text.rotation = 0;
                    break;
                case LabelPlacement.Parallel: {
                    const topHalf = (circleQuarter & CircleQuarter.Top) !== 0;
                    const translationRadius =
                        (tag === TextNodeTag.Primary) === !topHalf
                            ? textRadius
                            : textRadius - (textHeight - label.height);
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
                            ? (textHeight - label.height) * 0.5
                            : (label.height - textHeight) * 0.5;
                    text.textAlign = 'center';
                    text.textBaseline = 'middle';
                    text.translationX = Math.cos(theta) * textRadius + Math.cos(theta + Math.PI / 2) * translation;
                    text.translationY = Math.sin(theta) * textRadius + Math.sin(theta + Math.PI / 2) * translation;
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

    private getSectorFormat(node: _ModuleSupport.HierarchyNode, isHighlighted: boolean): AgSunburstSeriesStyle {
        const { datum, fill, stroke, depth } = node;
        const {
            ctx: { callbackCache },
            properties: { formatter },
        } = this;

        if (!formatter || datum == null || depth == null) {
            return {};
        }

        const { colorKey, labelKey, sizeKey, strokeWidth } = this.properties;

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
        const { datum, depth } = node;
        if (datum == null || depth == null) {
            return '';
        }

        const title = labelKey != null ? datum[labelKey] : undefined;

        const format = this.getSectorFormat(node, false);
        const color = format?.fill ?? node.fill;

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
            color: this.properties.label.color,
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

    override async createNodeData() {
        return undefined;
    }

    protected override animateEmptyUpdateReady({
        datumSelections,
    }: _ModuleSupport.HierarchyAnimationData<_Scene.Group, _ModuleSupport.SeriesNodeDatum>) {
        fromToMotion<
            _Scene.Group,
            Pick<_Scene.Group, 'scalingX' | 'scalingY'>,
            _ModuleSupport.HierarchyNode<_ModuleSupport.SeriesNodeDatum>
        >(this.id, 'nodes', this.ctx.animationManager, datumSelections, {
            toFn(_group, _datum, _status) {
                return { scalingX: 1, scalingY: 1 };
            },
            fromFn(group, datum, status) {
                if (status === 'unknown' && datum != null && group.previousDatum == null) {
                    return { scalingX: 0, scalingY: 0 };
                } else {
                    return { scalingX: 1, scalingY: 1 };
                }
            },
        });
    }
}
