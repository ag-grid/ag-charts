import {
    type AgSunburstSeriesFormatterParams,
    type AgSunburstSeriesStyle,
    type AgSunburstSeriesTooltipRendererParams,
    AgTooltipRendererResult,
    _ModuleSupport,
    _Scale,
    _Scene,
    _Util,
} from 'ag-charts-community';

import { TreemapSeriesTileLabel, formatLabels } from '../treemap/treemapLabelFormatter';

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

class SunburstSeriesTileHighlightStyle extends HighlightStyle {
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

    readonly label = new TreemapSeriesTileLabel();

    readonly secondaryLabel = new TreemapSeriesTileLabel();

    @Validate(OPT_STRING)
    labelKey?: string = undefined;

    @Validate(OPT_STRING)
    secondaryLabelKey?: string = undefined;

    @Validate(OPT_STRING)
    fill?: string = undefined;

    @Validate(NUMBER(0, 1))
    fillOpacity: number = 1;

    @Validate(OPT_COLOR_STRING)
    stroke?: string = undefined;

    @Validate(NUMBER(0))
    strokeWidth: number = 0;

    @Validate(NUMBER(0, 1))
    strokeOpacity: number = 1;

    @Validate(OPT_NUMBER())
    spacing?: number = undefined;

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
            group.append([new Sector(), new Text()]);
        };

        this.groupSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
        this.highlightSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
    }

    async updateNodes() {
        const { chart, data, spacing = 0, highlightStyle, labelData } = this;

        if (chart == null || data == null || labelData == null) return;

        const { width, height } = chart.seriesRect!;

        this.contentGroup.translationX = width / 2;
        this.contentGroup.translationY = height / 2;
        this.highlightGroup.translationX = width / 2;
        this.highlightGroup.translationY = height / 2;

        const baseInset = spacing * 0.5;
        const radius = Math.min(width, height) / 2;
        const maxDepth = 4;
        const radiusScale = radius / (maxDepth + 1);
        const angleOffset = -Math.PI / 2;

        const highlightedNode: _ModuleSupport.HierarchyNode | undefined =
            this.ctx.highlightManager?.getActiveHighlight() as any;

        const descendants = Array.from(this.rootNode);
        const labelTextNode = new Text();
        labelTextNode.setFont(this.label);
        const labelMeta = labelData.map((labelData, index) => {
            const label = labelData?.label;
            const { depth } = descendants[index];
            const angleData = this.angleData[index];
            if (label == null || depth == null || angleData == null) return undefined;

            const labelFontSize = this.label.fontSize;
            const minHeight = labelFontSize;
            const availableWidthUntilItHitsTheOuterRadius =
                2 * Math.sqrt(((depth + 1) * radiusScale) ** 2 - (depth * radiusScale + minHeight) ** 2);
            const deltaAngle = angleData.end - angleData.start;
            const availableWidthUntilItHitsTheStraightEdges =
                deltaAngle < Math.PI ? 2 * depth * radiusScale * Math.tan(deltaAngle * 0.5) : Infinity;
            const availableWidth = Math.min(
                availableWidthUntilItHitsTheOuterRadius,
                availableWidthUntilItHitsTheStraightEdges
            );

            const labelText = Text.wrap(label, availableWidth, minHeight, this.label, 'on-space');
            if (labelText === '' || labelText === Text.ellipsis) return undefined;

            labelTextNode.text = labelText;
            labelTextNode.fontSize = labelFontSize;
            const { width, height } = labelTextNode.computeBBox();

            const labelWidth = width;
            const labelHeight = Math.max(height, labelFontSize);

            return { text: labelText, fontSize: labelFontSize, width: labelWidth, height: labelHeight };
        });

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

            const fill = format?.fill ?? highlightedFill ?? node.color ?? this.fill;
            const fillOpacity = format?.fillOpacity ?? highlightedFillOpacity ?? this.fillOpacity;
            const stroke = format?.stroke ?? highlightedStroke ?? this.stroke;
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

        const updateText = (
            node: _ModuleSupport.HierarchyNode,
            text: _Scene.Text,
            highlighted: boolean,
            key: 'label' | 'secondaryLabel'
        ) => {
            const { index, depth } = node;
            const label = labelMeta?.[index];
            const angleData = this.angleData?.[index];
            if (depth == null || label == null || angleData == null) {
                text.visible = false;
                return;
            }

            const theta = angleOffset + (angleData.start + angleData.end) / 2;
            const bottomHalf = Math.sin(theta) >= 0;

            const opticalCentering = 0.58; // Between 0 and 1 - there's no maths behind this, just what visually looks good
            const idealRadius = (depth + 1) * radiusScale - baseInset - (radiusScale - label.height) * opticalCentering;
            const maximumRadius = Math.sqrt(((depth + 1) * radiusScale - baseInset) ** 2 - (label.width / 2) ** 2);
            const radius = Math.min(idealRadius, maximumRadius);

            // let highlightedColor: string | undefined;
            // if (highlighted) {
            //     highlightedColor = key === 'label' ? this.label.color : this.secondaryLabel.color;
            // }

            text.text = label.text;
            text.fontSize = label.fontSize;

            text.fontFamily = this.label.fontFamily; // label.style.fontFamily;
            text.fontWeight = this.label.fontWeight; // label.style.fontWeight;
            text.fill = this.label.color; // highlightedColor ?? label.style.color;

            text.textAlign = 'center';
            text.textBaseline = bottomHalf ? 'bottom' : 'top';
            text.translationX = Math.cos(theta) * radius;
            text.translationY = Math.sin(theta) * radius;
            text.rotation = bottomHalf ? theta - Math.PI * 0.5 : theta + Math.PI * 0.5;
            text.visible = true;
        };

        this.groupSelection.selectByClass(Text).forEach((text) => {
            updateText(text.datum, text, false, 'label');
        });
        this.highlightSelection.selectByClass(Text).forEach((text) => {
            const node: _ModuleSupport.HierarchyNode = text.datum;
            const isHighlighted = highlightedNode === node;
            text.visible = isHighlighted;
            if (text.visible) {
                updateText(text.datum, text, isHighlighted, 'label');
            }
        });
    }

    override async update() {
        await this.updateSelections();
        await this.updateNodes();
    }

    private getSectorFormat(node: _ModuleSupport.HierarchyNode, isHighlighted: boolean): AgSunburstSeriesStyle {
        const { datum, color: fill, depth } = node;
        const {
            formatter,
            ctx: { callbackCache },
        } = this;
        if (!formatter || datum == null || depth == null) {
            return {};
        }

        const { colorKey, labelKey, sizeKey, stroke, strokeWidth } = this;

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
        // FIXME: Is this right?
        return [0, 1];
    }

    override getLegendData() {
        return [];
    }
}
