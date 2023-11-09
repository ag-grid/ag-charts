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

const { HighlightStyle, SeriesTooltip, Validate, OPT_COLOR_STRING, OPT_FUNCTION, OPT_NUMBER, NUMBER, OPT_STRING } =
    _ModuleSupport;
const { Sector, Group, Selection } = _Scene;

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

    override readonly highlightStyle = new SunburstSeriesTileHighlightStyle();

    @Validate(OPT_STRING)
    fill?: string;

    @Validate(NUMBER(0, 1))
    fillOpacity: number = 1;

    @Validate(OPT_COLOR_STRING)
    stroke?: string;

    @Validate(NUMBER(0))
    strokeWidth: number = 0;

    @Validate(NUMBER(0, 1))
    strokeOpacity: number = 1;

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgSunburstSeriesFormatterParams) => AgSunburstSeriesStyle = undefined;

    override async processData() {
        super.processData();
        this.angleData = getAngleData(this.rootNode);
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

        const descendants: _ModuleSupport.HierarchyNode[] = Array.from(this.rootNode);

        const updateGroup = (group: _Scene.Group) => {
            group.append([new Sector()]);
        };

        this.groupSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
        this.highlightSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
    }

    async updateNodes() {
        const { chart, data } = this;

        if (chart == null || data == null) return;

        const { width, height } = chart.getSeriesRect()!;

        this.contentGroup.translationX = width / 2;
        this.contentGroup.translationY = height / 2;
        this.highlightGroup.translationX = width / 2;
        this.highlightGroup.translationY = height / 2;

        const radius = Math.min(width, height) / 2;
        const maxDepth = 4;
        const radiusScale = radius / (maxDepth + 1);

        this.rootNode.walk((node) => {
            const angleDatum = this.angleData[node.index];
            if (node.depth != null && angleDatum != null) {
                const midAngle = angleDatum.end - angleDatum.start;
                const midRadius = (node.depth + 0.5) * radiusScale;
                node.midPoint.x = Math.cos(midAngle) * midRadius;
                node.midPoint.y = Math.sin(midAngle) * midRadius;
            }
        });

        const angleOffset = -Math.PI / 2;
        const updateSector = (node: _ModuleSupport.HierarchyNode, sector: _Scene.Sector, highlighted: boolean) => {
            const { depth } = node;
            const angleDatum = this.angleData[node.index];
            if (depth == null || angleDatum == null) {
                sector.visible = false;
                return;
            }

            sector.visible = true;

            const { highlightStyle } = this;

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

            const fill = highlightedFill ?? node.color ?? this.fill;
            const fillOpacity = highlightedFillOpacity ?? this.fillOpacity;
            const stroke = highlightedStroke ?? this.stroke;
            const strokeWidth = highlightedStrokeWidth ?? this.strokeWidth;
            const strokeOpacity = highlightedStrokeOpacity ?? this.strokeOpacity;

            const format = this.getSectorFormat(node, highlighted);

            sector.fill = format?.fill ?? fill;
            sector.fillOpacity = format?.fillOpacity ?? fillOpacity;
            sector.stroke = format?.stroke ?? stroke;
            sector.strokeWidth = format?.strokeWidth ?? strokeWidth;
            sector.strokeOpacity = format?.strokeOpacity ?? strokeOpacity;

            sector.centerX = 0;
            sector.centerY = 0;
            sector.innerRadius = depth * radiusScale;
            sector.outerRadius = (depth + 1) * radiusScale;
            sector.angleOffset = angleOffset;
            sector.startAngle = angleDatum.start;
            sector.endAngle = angleDatum.end;
        };

        this.groupSelection.selectByClass(Sector).forEach((sector) => {
            updateSector(sector.datum, sector, false);
        });

        const highlightedNode: _ModuleSupport.HierarchyNode | undefined =
            this.ctx.highlightManager?.getActiveHighlight() as any;
        this.highlightSelection.selectByClass(Sector).forEach((sector) => {
            const node: _ModuleSupport.HierarchyNode = sector.datum;
            const isHighlighted = highlightedNode === node;
            sector.visible = isHighlighted;
            if (sector.visible) {
                updateSector(sector.datum, sector, isHighlighted);
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

    override async createNodeData(): Promise<
        _ModuleSupport.SeriesNodeDataContext<_ModuleSupport.HierarchyNode, _ModuleSupport.HierarchyNode>[]
    > {
        return [];
    }

    override getSeriesDomain(): any[] {
        // FIXME: Is this right?
        return [0, 1];
    }

    override getLegendData() {
        return [];
    }
}
