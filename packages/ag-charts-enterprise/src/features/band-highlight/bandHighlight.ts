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
    BandScale,
    getShapeFill,
    clampArray,
    InteractionState,
} = _ModuleSupport;

interface AxisBandDatum {
    readonly id: string;
    readonly value: any;
    readonly band: [number, number];
    readonly position: number;
}

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
    fillOpacity: number = 1;

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

    private activeAxisHighlight?: AxisBandDatum = undefined;
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

        const {
            widgets: { seriesWidget, seriesDragInterpreter },
            animationManager,
            eventsHub,
        } = ctx;

        this.cleanup.register(
            ctx.scene.attachNode(this.bandHighlightGroup),
            seriesWidget.addListener('mousemove', (event) => this.onHoverLikeEvent(event)),
            seriesWidget.addListener('drag-move', (event) => this.onHoverLikeEvent(event)),
            seriesWidget.addListener('mouseleave', () => this.clearAllHighlight()),
            seriesDragInterpreter.events.on('click', (event) => this.onClick(event)),
            animationManager.addListener('animation-start', () => this.clearAllHighlight()),

            eventsHub.on('layout:complete', (event) => this.layout(event)),
            eventsHub.on('highlight:change', (event) => this.highlightChange(event)),
            eventsHub.on('zoom:pan-start', () => this.clearAllHighlight()),
            eventsHub.on('zoom:change', () => this.clearAllHighlight()),
            eventsHub.on('dom:resize', () => this.clearAllHighlight()),
            eventsHub.on('axis:change', () => this.axisChange())
        );
    }

    private axisChange() {
        this.onHighlightChange();
    }

    private isHover(event: _ModuleSupport.HoverLikeEvent): boolean {
        return (
            event.type === 'mousemove' ||
            event.type === 'click' ||
            (event.device === 'touch' && this.ctx.chartService.touch.dragAction === 'hover')
        );
    }

    private onClick(event: _ModuleSupport.DragInterpreterClickEvent) {
        if (event.device === 'touch') {
            this.onHoverLikeEvent(event);
        }
    }

    private clearAllHighlight() {
        if (!this.ctx.interactionManager.isState(InteractionState.Clickable)) return;

        this.onHighlightChange();
    }

    private highlightChange(event: _ModuleSupport.HighlightChangeEvent) {
        if (event.currentHighlight) {
            this.onHighlightChange(this.getBand((event.currentHighlight as any).xValue));
        }
    }

    private onHoverLikeEvent(event: _ModuleSupport.HoverLikeEvent): void {
        const requiredState = this.isHover(event) ? InteractionState.Clickable : InteractionState.AnnotationsMoveable;
        if (!this.ctx.interactionManager.isState(requiredState)) return;
        this.handleHoverHighlight(event);
    }

    private handleHoverHighlight(event: _ModuleSupport.HoverLikeEvent) {
        if (!event) return;

        const { currentX: x, currentY: y } = event;

        const { axisCtx } = this;
        const isVertical = axisCtx.direction === ChartAxisDirection.Y;
        const value = axisCtx.scale.invert(isVertical ? y : x, true);
        const band = value != null ? this.getBand(value) : undefined;
        this.onHighlightChange(band);
    }

    private getBand(value: any): AxisBandDatum | undefined {
        const { scale } = this.axisCtx;

        if (!BandScale.is(scale)) return;

        const { bandwidth = 0, step = 0, range } = scale;
        const offset = (step - bandwidth) / 2;

        const position = scale.convert(value);

        const start = position - offset;
        const end = position + bandwidth + offset;

        return {
            id: this.id,
            value,
            band: [clampArray(start, range), clampArray(end, range)],
            position,
        };
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
            fillOpacity,
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
        node.fillOpacity = fillOpacity;
        node.startLine = true;
        node.endLine = true;
    }

    private isVertical(): boolean {
        return this.axisCtx.direction === ChartAxisDirection.X;
    }

    private onHighlightChange(axisBandDatum?: AxisBandDatum) {
        if (!this.enabled) return;

        this.activeAxisHighlight = axisBandDatum;

        if (this.activeAxisHighlight) {
            this.showBand();
        } else {
            this.hideBand();
        }

        this.ctx.updateService.update(_ModuleSupport.ChartUpdateType.SCENE_RENDER);
    }

    private updateBandPosition() {
        const { rangeNode, bounds } = this;

        const band = this.activeAxisHighlight?.band;

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
        this.updateBandPosition();

        this.bandHighlightGroup.visible = true;
    }

    private hideBand() {
        this.bandHighlightGroup.visible = false;
    }
}
