import { _ModuleSupport } from 'ag-charts-community';
import type { InternalAgColorType } from 'ag-charts-core';
import type { AgSunburstSeriesStyle, FontStyle, FontWeight } from 'ag-charts-types';

import { formatLabels } from '../util/labelFormatter';
import { SunburstSeriesProperties } from './sunburstSeriesProperties';

const {
    fromToMotion,
    normalizeAngle360,
    createDatumId,
    Sector,
    Group,
    ScalableGroup,
    Selection,
    TransformableText,
    BBox,
    applyShapeStyle,
    getShapeStyle,
} = _ModuleSupport;

class SunburstNode extends _ModuleSupport.HierarchyNode<SunburstNode> {
    label: LabelLayout | undefined = undefined;
    secondaryLabel: LabelLayout | undefined = undefined;
    contentHeight: number = 0;
    bbox: _ModuleSupport.BBox | undefined = undefined;
    startAngle: number = 0;
    endAngle: number = 0;
}

interface LabelLayout {
    text: string;
    fontSize: number;
    lineHeight: number;
    fontStyle: FontStyle;
    fontFamily: string;
    fontWeight: FontWeight;
    color: string;
    labelPlacement: LabelPlacement;
    circleQuarter: number;
    radius: number;
    theta: number;
    width: number;
    height: number;
}

function setAngleData(node: SunburstNode, startAngle = 0, angleScale = (2 * Math.PI) / node.sumSize) {
    for (const child of node.children) {
        const endAngle = startAngle + child.sumSize * angleScale;
        child.startAngle = startAngle;
        child.endAngle = endAngle;
        setAngleData(child, startAngle, angleScale);
        startAngle = endAngle;
    }
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

type ItemStyle = Pick<AgSunburstSeriesStyle, 'fill' | 'stroke'> &
    Omit<Required<AgSunburstSeriesStyle>, 'fill' | 'stroke'>;

export class SunburstSeries extends _ModuleSupport.HierarchySeries<
    _ModuleSupport.Sector,
    SunburstSeriesProperties,
    SunburstNode
> {
    static readonly className = 'SunburstSeries';
    static readonly type = 'sunburst' as const;

    NodeClass = SunburstNode;

    override properties = new SunburstSeriesProperties();

    private readonly scalingGroup = this.contentGroup.appendChild(new ScalableGroup());
    private readonly sectorGroup = this.scalingGroup.appendChild(new Group());
    private readonly sectorLabelGroup = this.scalingGroup.appendChild(new Group());
    private readonly highlightSectorGroup = this.scalingGroup.appendChild(new Group());

    readonly datumSelection = Selection.select<_ModuleSupport.Sector, SunburstNode>(this.sectorGroup, Sector);
    private readonly labelSelection = Selection.select<_ModuleSupport.Group, SunburstNode>(
        this.sectorLabelGroup,
        Group
    );
    private readonly highlightSelection = Selection.select<_ModuleSupport.Sector, SunburstNode>(
        this.highlightSectorGroup,
        Sector
    );

    override processData() {
        super.processData();

        setAngleData(this.rootNode!);
    }

    updateSelections() {
        const highlightedNode: SunburstNode | undefined = this.ctx.highlightManager?.getActiveHighlight() as any;
        this.highlightSelection.update(highlightedNode != null ? [highlightedNode] : [], undefined, (node) =>
            this.getDatumId(node)
        );

        if (!this.nodeDataRefresh) return;
        this.nodeDataRefresh = false;

        const { chart } = this;
        if (chart == null) return;

        const seriesRect = chart.seriesRect;
        if (seriesRect == null) return;

        const descendants = Array.from(this.rootNode!);

        const updateLabelGroup = (group: _ModuleSupport.Group) => {
            group.append([
                new TransformableText({ tag: TextNodeTag.Primary }),
                new TransformableText({ tag: TextNodeTag.Secondary }),
            ]);
        };

        this.datumSelection.update(descendants, undefined, (node) => this.getDatumId(node));
        this.labelSelection.update(descendants, updateLabelGroup, (node) => this.getDatumId(node));
    }

    private getItemBaseStyle(highlighted: boolean): ItemStyle {
        const { properties } = this;
        const highlightStyle = highlighted ? properties.highlightStyle : undefined;

        return getShapeStyle(
            {
                fill: highlightStyle?.fill,
                fillOpacity: highlightStyle?.fillOpacity ?? properties.fillOpacity,
                stroke: highlightStyle?.stroke,
                strokeWidth: highlightStyle?.strokeWidth ?? this.getStrokeWidth(properties.strokeWidth),
                strokeOpacity: highlightStyle?.strokeOpacity ?? properties.strokeOpacity,
            },
            properties.fillGradientDefaults,
            properties.fillPatternDefaults
        );
    }

    private getItemStyleOverrides(
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

        return getShapeStyle(overrides, this.properties.fillGradientDefaults, this.properties.fillPatternDefaults);
    }

    updateNodes() {
        const { chart, data, maxDepth } = this;

        if (chart == null || data == null) {
            return;
        }

        const { width, height } = chart.seriesRect!;
        const {
            sectorSpacing = 0,
            padding = 0,
            cornerRadius,
            childrenKey,
            colorKey,
            colorName,
            labelKey,
            secondaryLabelKey,
            sizeKey,
            sizeName,
        } = this.properties;

        this.contentGroup.translationX = width / 2;
        this.contentGroup.translationY = height / 2;

        const baseInset = sectorSpacing * 0.5;
        const radius = Math.min(width, height) / 2;
        const radiusScale = radius / (maxDepth + 1);
        const angleOffset = -Math.PI / 2;

        const seriesFillBBox: _ModuleSupport.ShapeFillBBox = {
            series: new BBox(-radius, -radius, 2 * radius, 2 * radius),
            axis: new BBox(-radius, -radius, 2 * radius, 2 * radius),
        };

        this.rootNode?.walk((node) => {
            const { startAngle, endAngle } = node;
            if (node.depth != null) {
                const midAngle = (startAngle + endAngle) / 2 + angleOffset;
                const midRadius = (node.depth + 0.5) * radiusScale;
                node.midPoint.x = Math.cos(midAngle) * midRadius;
                node.midPoint.y = Math.sin(midAngle) * midRadius;
            }
        });

        this.rootNode?.walk((node) => {
            const { datum, depth, startAngle, endAngle, parent, sumSize } = node;

            node.label = undefined;
            node.secondaryLabel = undefined;
            node.contentHeight = 0;

            let labelValue: string | undefined;
            if (datum != null && depth != null && labelKey != null) {
                const value = (datum as any)[labelKey];
                labelValue = this.getLabelText(this.properties.label, {
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
            if (labelValue === '') {
                labelValue = undefined;
            }

            let secondaryLabelValue: string | undefined;
            if (datum != null && depth != null && secondaryLabelKey != null) {
                const value = (datum as any)[secondaryLabelKey];
                secondaryLabelValue = this.getLabelText(this.properties.secondaryLabel, {
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
            if (secondaryLabelValue === '') {
                secondaryLabelValue = undefined;
            }

            if (depth == null) return;

            const innerRadius = depth * radiusScale + baseInset;
            const outerRadius = (depth + 1) * radiusScale - baseInset;
            const innerAngleOffset = innerRadius > baseInset ? baseInset / innerRadius : baseInset;
            const outerAngleOffset = outerRadius > baseInset ? baseInset / outerRadius : baseInset;
            const innerStartAngle = startAngle + innerAngleOffset;
            const innerEndAngle = endAngle + innerAngleOffset;
            const deltaInnerAngle = innerEndAngle - innerStartAngle;
            const outerStartAngle = startAngle + outerAngleOffset;
            const outerEndAngle = endAngle + outerAngleOffset;
            const deltaOuterAngle = outerEndAngle - outerStartAngle;

            const sizeFittingHeight = (labelHeight: number) => {
                const isCenterCircle = depth === 0 && parent?.sumSize === sumSize;
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

                const maxPerpendicularAngle = Math.PI / 4;
                let perpendicularHeight: number;
                let perpendicularWidth: number;
                if (depth === 0) {
                    // Wedge from center - maximize the width of a box with fixed height
                    perpendicularHeight = labelHeight;
                    perpendicularWidth =
                        Math.sqrt(outerRadius ** 2 - (perpendicularHeight / 2) ** 2) -
                        labelHeight / (2 * Math.tan(deltaOuterAngle * 0.5));
                } else if (normalizeAngle360(deltaInnerAngle) < maxPerpendicularAngle) {
                    // Outer wedge - fit the height to the sector, then fit the width
                    perpendicularHeight = 2 * innerRadius * Math.tan(deltaInnerAngle * 0.5);
                    perpendicularWidth = Math.sqrt(outerRadius ** 2 - (perpendicularHeight / 2) ** 2) - innerRadius;
                } else {
                    perpendicularWidth = 0;
                    perpendicularHeight = 0;
                }

                return parallelWidth >= perpendicularWidth
                    ? { width: parallelWidth, height: parallelHeight, meta: LabelPlacement.Parallel }
                    : { width: perpendicularWidth, height: perpendicularHeight, meta: LabelPlacement.Perpendicular };
            };

            const formatting = formatLabels<LabelPlacement>(
                labelValue,
                this.properties.label,
                secondaryLabelValue,
                this.properties.secondaryLabel,
                { padding },
                sizeFittingHeight
            );

            if (formatting == null) return;

            const { width: labelWidth, height: labelHeight, meta: labelPlacement, label, secondaryLabel } = formatting;

            const theta = angleOffset + (startAngle + endAngle) / 2;
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

            if (label != null) {
                const {
                    fontStyle = 'normal',
                    fontFamily,
                    fontWeight = 'normal',
                    color = 'black',
                } = this.properties.label;
                node.label = {
                    ...label,
                    fontStyle,
                    fontFamily,
                    fontWeight,
                    color,
                    labelPlacement,
                    circleQuarter,
                    radius: labelRadius,
                    theta,
                };
            }

            if (secondaryLabel != null) {
                const {
                    fontStyle = 'normal',
                    fontFamily,
                    fontWeight = 'normal',
                    color = 'black',
                } = this.properties.secondaryLabel;
                node.secondaryLabel = {
                    ...secondaryLabel,
                    fontStyle,
                    fontFamily,
                    fontWeight,
                    color,
                    labelPlacement,
                    circleQuarter,
                    radius: labelRadius,
                    theta,
                };
            }

            node.contentHeight = formatting.height;
        });

        const updateSector = (
            nodeDatum: SunburstNode,
            sector: _ModuleSupport.Sector,
            style: ItemStyle,
            highlighted: boolean
        ) => {
            const { datum, datumIndex, depth, colorValue, startAngle, endAngle } = nodeDatum;
            if (depth == null) {
                sector.visible = false;
                return;
            }

            sector.visible = true;

            const overrides = this.getItemStyleOverrides(datumIndex, datum, depth, colorValue, style, highlighted);

            const fill = overrides.fill ?? style.fill;
            const strokeWidth = overrides.strokeWidth ?? style.strokeWidth;

            const fillBBox = _ModuleSupport.isGradientFill(fill) && fill.bounds !== 'item' ? seriesFillBBox : undefined;
            applyShapeStyle(sector, style, overrides, fillBBox);

            sector.centerX = 0;
            sector.centerY = 0;
            sector.innerRadius = depth * radiusScale;
            sector.outerRadius = (depth + 1) * radiusScale;
            sector.startAngle = startAngle + angleOffset;
            sector.endAngle = endAngle + angleOffset;
            sector.inset = baseInset + strokeWidth * 0.5;
            sector.cornerRadius = cornerRadius;
        };

        const baseFormat = this.getItemBaseStyle(false);

        this.datumSelection.each((sector, datum) => {
            updateSector(datum, sector, baseFormat, false);
        });
        const highlightFormat = this.getItemBaseStyle(true);
        this.highlightSelection.each((rect, datum) => {
            updateSector(datum, rect, highlightFormat, true);
        });

        const updateText = (
            node: SunburstNode,
            text: _ModuleSupport.TransformableText,
            tag: TextNodeTag,
            highlighted: boolean
        ) => {
            const { depth, contentHeight } = node;
            const primary = tag === TextNodeTag.Primary;
            const label = primary ? node.label : node.secondaryLabel;
            if (depth == null || label == null) {
                text.visible = false;
                return;
            }

            const { labelPlacement, circleQuarter, radius: textRadius, theta } = label;

            let highlightedColor: string | undefined;
            if (highlighted) {
                const highlightedLabelStyle = primary
                    ? this.properties.highlightStyle.label
                    : this.properties.highlightStyle.secondaryLabel;
                highlightedColor = highlightedLabelStyle.color;
            }

            text.text = label.text;
            text.fontSize = label.fontSize;
            text.lineHeight = label.lineHeight;
            text.fontStyle = label.fontStyle;
            text.fontFamily = label.fontFamily;
            text.fontWeight = label.fontWeight;
            text.fill = highlightedColor ?? label.color;

            switch (labelPlacement) {
                case LabelPlacement.CenterCircle:
                    text.textAlign = 'center';
                    text.textBaseline = 'top';
                    text.translationX = 0;
                    text.translationY = (primary ? 0 : contentHeight - label.height) - contentHeight * 0.5;
                    text.rotation = 0;
                    break;
                case LabelPlacement.Parallel: {
                    const topHalf = (circleQuarter & CircleQuarter.Top) !== 0;
                    const translationRadius =
                        primary === !topHalf ? textRadius : textRadius - (contentHeight - label.height);
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
                        primary === !rightHalf
                            ? (contentHeight - label.height) * 0.5
                            : (label.height - contentHeight) * 0.5;
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
        const highlightedDatum = this.ctx.highlightManager?.getActiveHighlight() as any;
        this.labelSelection.selectByClass(TransformableText).forEach((text) => {
            const datum = text.closestDatum();
            updateText(datum, text, text.tag, datum === highlightedDatum);
        });
    }

    override getTooltipContent(datumIndex: number[]): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, properties } = this;
        const { labelKey, secondaryLabelKey, childrenKey, sizeKey, sizeName, colorKey, colorName, tooltip } =
            properties;
        const nodeDatum = datumIndex.reduce((n, i) => n?.children[i], this.rootNode);
        if (nodeDatum == null) return;
        const { datum, depth } = nodeDatum;
        if (datum == null || depth == null) return;

        const data: _ModuleSupport.TooltipContentDataRow[] = [];

        const datumSize = sizeKey != null ? datum[sizeKey] : undefined;
        if (datumSize != null) {
            data.push({ label: sizeName, fallbackLabel: sizeKey!, value: datumSize });
        }

        const datumColor = colorKey != null ? datum[colorKey] : undefined;
        if (datumColor != null) {
            data.push({ label: colorName, fallbackLabel: colorKey!, value: datumColor });
        }

        const format = this.getItemBaseStyle(false) as Required<ItemStyle>;
        Object.assign(format, this.getItemStyleOverrides(datumIndex, datum, depth, datumColor, format, false));

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
            properties.fillGradientDefaults,
            properties.fillPatternDefaults
        );

        if (_ModuleSupport.isGradientFill(markerStyle.fill)) {
            markerStyle.fill = { ...markerStyle.fill, gradient: 'linear', rotation: 0, reverse: false };
        }

        return this.formatTooltipWithContext(
            tooltip,
            {
                title: labelKey != null ? datum[labelKey] : undefined,
                symbol: {
                    marker: markerStyle,
                },
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

    override createNodeData() {
        return undefined;
    }

    protected override pickNodeClosestDatum(
        point: _ModuleSupport.Point
    ): _ModuleSupport.SeriesNodePickMatch | undefined {
        return this.pickNodeNearestDistantObject(point, this.datumSelection.selectByClass(Sector));
    }

    protected override animateEmptyUpdateReady() {
        fromToMotion<
            _ModuleSupport.ScalableGroup,
            Pick<_ModuleSupport.ScalableGroup, 'scalingX' | 'scalingY'>,
            SunburstNode
        >(this.id, 'nodes', this.ctx.animationManager, [this.scalingGroup] as any, {
            toFn() {
                return { scalingX: 1, scalingY: 1 };
            },
            fromFn() {
                return { scalingX: 0, scalingY: 0 };
            },
        });
    }

    protected override computeFocusBounds(node: _ModuleSupport.Sector): _ModuleSupport.Path | undefined {
        return node;
    }
}
