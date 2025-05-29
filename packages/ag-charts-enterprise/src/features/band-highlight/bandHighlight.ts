import { _ModuleSupport } from 'ag-charts-community';
import { type InternalAgColorType, createId } from 'ag-charts-core';

const {
    Range,
    TranslatableGroup,
    BBox,
    Property,
    ZIndexMap,
    ChartAxisDirection,
    FillGradientDefaults,
    FillImageDefaults,
    FillPatternDefaults,
    getShapeFill,
} = _ModuleSupport;

export class BandHighlight extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    readonly id = createId(this);

    @Property
    enabled = false;

    @Property
    stroke?: string = 'rgb(195, 195, 195)';

    @Property
    lineDash?: number[] = [6, 3];

    @Property
    lineDashOffset: number = 0;

    @Property
    strokeWidth: number = 1;

    @Property
    strokeOpacity: number = 1;

    @Property
    fill: InternalAgColorType = '#c16068';

    @Property
    readonly fillGradientDefaults = new FillGradientDefaults();

    @Property
    readonly fillPatternDefaults = new FillPatternDefaults();

    @Property
    readonly fillImageDefaults = new FillImageDefaults();

    private readonly axisCtx: _ModuleSupport.AxisContext;
    private bounds: _ModuleSupport.BBox = new BBox(0, 0, 0, 0);
    private axisLayout?: _ModuleSupport.AxisLayout;

    private readonly bandHighlightGroup = new TranslatableGroup({
        name: 'bandHighlight',
        zIndex: ZIndexMap.AXIS_BAND_HIGHLIGHT,
    });
    private readonly rangeNode: _ModuleSupport.Range<any> = this.bandHighlightGroup.appendChild(new Range());

    private activeAxisHighlight?: _ModuleSupport.AxisHighlightChangeEvent['currentHighlight'] = undefined;
    constructor(private readonly ctx: _ModuleSupport.ModuleContextWithParent<_ModuleSupport.AxisContext>) {
        super();

        this.axisCtx = ctx.parent;
        this.hideBand();

        ctx.domManager.addEventListener('focusin', ({ target }) => {
            const isSeriesAreaChild = target instanceof HTMLElement && ctx.domManager.contains(target, 'series-area');
            if (this.bandHighlightGroup.visible && !isSeriesAreaChild) {
                this.hideBand();
                this.ctx.updateService.update(_ModuleSupport.ChartUpdateType.PERFORM_LAYOUT);
            }
        });

        this.cleanup.register(
            ctx.scene.attachNode(this.bandHighlightGroup),
            ctx.axisHighlightManager.addListener('axis-highlight-change', (event) => this.onHighlightChange(event)),
            ctx.layoutManager.addListener('layout:complete', (event) => this.layout(event))
        );
    }

    private layout({ series: { rect, visible }, axes }: _ModuleSupport.LayoutCompleteEvent) {
        if (!visible || !axes || !this.enabled) return;

        const { position: axisPosition = 'left', axisId } = this.axisCtx;

        const axisLayout = axes.find((a) => a.id === axisId);

        if (!axisLayout) return;

        this.axisLayout = axisLayout;
        this.bounds = rect.clone().grow(axisLayout.gridPadding, axisPosition);

        const { bandHighlightGroup, bounds } = this;
        bandHighlightGroup.translationX = Math.round(bounds.x);
        bandHighlightGroup.translationY = Math.round(bounds.y);

        this.updateBand();
    }

    private updateBand() {
        const {
            rangeNode: node,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            fill,
            fillGradientDefaults,
            fillPatternDefaults,
            fillImageDefaults,
            lineDashOffset,
            axisLayout,
        } = this;

        if (!axisLayout) return;

        node.stroke = stroke;
        node.strokeWidth = strokeWidth;
        node.strokeOpacity = strokeOpacity;
        node.lineDash = lineDash;
        node.lineDashOffset = lineDashOffset;
        node.fill = getShapeFill(fill, fillGradientDefaults, fillPatternDefaults, fillImageDefaults);
        node.startLine = true;
        node.endLine = true;
    }

    private isVertical(): boolean {
        return this.axisCtx.direction === ChartAxisDirection.X;
    }

    private onHighlightChange(event: _ModuleSupport.AxisHighlightChangeEvent) {
        if (!this.enabled) return;

        const axisMatch = event.axisId === this.axisCtx.axisId;

        if (!axisMatch) {
            return;
        }

        this.activeAxisHighlight = event.currentHighlight;

        if (!this.activeAxisHighlight) {
            this.hideBand();
        } else {
            this.showBand();
        }

        this.ctx.updateService.update(_ModuleSupport.ChartUpdateType.SCENE_RENDER);
    }

    private updateBandPosition(band: [number, number] | undefined) {
        const { rangeNode, bounds } = this;
        if (band == undefined) {
            this.hideBand();
            return;
        }

        if (this.isVertical()) {
            rangeNode.y1 = 0;
            rangeNode.y2 = bounds.height;
            rangeNode.x1 = band[0];
            rangeNode.x2 = band[1];
            rangeNode.horizontal = true;
        } else {
            rangeNode.y1 = band[0];
            rangeNode.y2 = band[1];
            rangeNode.x1 = 0;
            rangeNode.x2 = bounds.width;
            rangeNode.horizontal = false;
        }
    }

    private showBand() {
        this.updateBandPosition(this.activeAxisHighlight?.band);

        this.bandHighlightGroup.visible = true;
    }

    private hideBand() {
        this.bandHighlightGroup.visible = false;
    }
}
