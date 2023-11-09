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

const { SeriesTooltip, Validate, OPT_COLOR_STRING, OPT_FUNCTION, OPT_NUMBER, OPT_STRING } = _ModuleSupport;
const { Sector, Group, Selection } = _Scene;

export class SunburstSeries extends _ModuleSupport.HierarchySeries<_ModuleSupport.HierarchyNode> {
    static className = 'SunburstSeries';
    static type = 'sunburst' as const;

    readonly tooltip = new SeriesTooltip<AgSunburstSeriesTooltipRendererParams<any>>();

    private groupSelection: _Scene.Selection<_Scene.Group, _ModuleSupport.HierarchyNode> = Selection.select(
        this.contentGroup,
        Group
    );

    private angleData: Array<{ start: number; end: number } | undefined> = [];

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

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgSunburstSeriesFormatterParams) => AgSunburstSeriesStyle = undefined;

    override async processData() {
        super.processData();

        const angleData: Array<{ start: number; end: number } | undefined> = Array.from(this.rootNode, () => undefined);

        const angleScale = (2 * Math.PI) / this.rootNode.sumSize;

        const setAngleData = (node: _ModuleSupport.HierarchyNode, startAngle: number) => {
            let currentAngle = startAngle;
            for (const child of node.children) {
                const start = currentAngle;
                const end = currentAngle + child.sumSize * angleScale;
                angleData[child.index] = { start, end };
                setAngleData(child, start);
                currentAngle = end;
            }
        };

        setAngleData(this.rootNode, 0);

        this.angleData = angleData;
    }

    async updateSelections() {
        const descendants: _ModuleSupport.HierarchyNode[] = Array.from(this.rootNode) as any;

        const updateGroup = (group: _Scene.Group) => {
            group.append([new Sector()]);
        };

        this.groupSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
    }

    async updateNodes() {
        const { chart, data } = this;

        if (chart == null || data == null) return;

        const { width, height } = chart.getSeriesRect()!;

        this.contentGroup.translationX = width / 2;
        this.contentGroup.translationY = height / 2;

        const radius = Math.min(width, height) / 2;
        const maxDepth = 4;
        const radiusScale = radius / (maxDepth + 1);

        const { fill, fillOpacity = 1, stroke, strokeWidth = 0, strokeOpacity = 1 } = this;
        const angleOffset = -Math.PI / 2;

        this.groupSelection.selectByClass(Sector).forEach((sector) => {
            const { index, color, depth }: _ModuleSupport.HierarchyNode = sector.datum;
            const angleDatum = this.angleData[index];
            if (angleDatum == null || depth == null) {
                sector.visible = false;
                return;
            }

            sector.centerX = 0;
            sector.centerY = 0;
            sector.innerRadius = depth * radiusScale;
            sector.outerRadius = (depth + 1) * radiusScale;
            sector.angleOffset = angleOffset;
            sector.startAngle = angleDatum.start;
            sector.endAngle = angleDatum.end;
            sector.fill = color ?? fill;
            sector.fillOpacity = fillOpacity ?? 1;
            sector.stroke = stroke;
            sector.strokeWidth = strokeWidth;
            sector.strokeOpacity = strokeOpacity;
            sector.visible = true;
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
