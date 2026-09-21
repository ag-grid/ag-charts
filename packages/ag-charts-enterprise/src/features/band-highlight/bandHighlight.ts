import { _ModuleSupport, _Widget } from 'ag-charts-community';
import {
    AbstractModuleInstance,
    ChartAxisDirection,
    ChartUpdateType,
    type NormalisedBandHighlightOptions,
    type RequiredInternalAgGradientColor,
    type RequiredInternalAgImageFill,
    type RequiredInternalAgPatternColor,
    ZIndexMap,
    createId,
} from 'ag-charts-core';

const { Range, TranslatableGroup, BBox, getShapeFill, InteractionState } = _ModuleSupport;

// Shape definitions `getShapeFill` completes a user-supplied non-flat fill with; internal only.
const FILL_GRADIENT_DEFAULTS: RequiredInternalAgGradientColor = {
    type: 'gradient',
    colorStops: [],
    bounds: 'item',
    gradient: 'linear',
    rotation: 0,
    reverse: false,
    colorSpace: 'rgb',
};
const FILL_PATTERN_DEFAULTS: RequiredInternalAgPatternColor = {
    type: 'pattern',
    rotation: 0,
    scale: 1,
    pattern: 'forward-slanted-lines',
    width: 26,
    height: 26,
    padding: 6,
    fill: 'black',
    fillOpacity: 1,
    backgroundFill: 'white',
    backgroundFillOpacity: 1,
    stroke: 'black',
    strokeOpacity: 1,
    strokeWidth: 0,
};
const FILL_IMAGE_DEFAULTS: RequiredInternalAgImageFill = {
    type: 'image',
    url: '',
    rotation: 0,
    backgroundFill: 'black',
    backgroundFillOpacity: 1,
    repeat: 'no-repeat',
    fit: 'contain',
};

type HoverLikeEvent =
    | _Widget.ClickWidgetEvent
    | _ModuleSupport.MouseWidgetEvent<'mousemove'>
    | _ModuleSupport.DragWidgetEvent<'drag-move'>;

export class BandHighlight extends AbstractModuleInstance {
    static readonly className = 'BandHighlight';
    readonly id = createId(this);

    private options: NormalisedBandHighlightOptions | undefined;

    private readonly axisCtx: _ModuleSupport.AxisContext;
    private bounds: _ModuleSupport.BBox = new BBox(0, 0, 0, 0);
    private axisLayout?: _ModuleSupport.AxisLayout;

    private readonly bandHighlightGroup = new TranslatableGroup({
        name: 'bandHighlight',
        zIndex: ZIndexMap.AXIS_BAND_HIGHLIGHT,
    });
    private readonly rangeNode: _ModuleSupport.Range<any> = this.bandHighlightGroup.appendChild(new Range());

    private activeAxisHighlight?: _ModuleSupport.AxisBandDatum = undefined;

    constructor(private readonly ctx: _ModuleSupport.ChartAxisRegistry<_ModuleSupport.AxisContext>) {
        super();

        this.axisCtx = ctx.parent;
        this.hideBand();

        const {
            widgets: { seriesBoundsWidget, seriesDragInterpreter },
            animationManager,
            eventsHub,
        } = ctx;

        this.cleanup.register(
            ctx.scene.attachNode(this.bandHighlightGroup),
            seriesBoundsWidget.addListener('mousemove', (event) => this.onHoverLikeEvent(event)),
            seriesBoundsWidget.addListener('mouseleave', () => this.clearAllHighlight()),
            animationManager.addListener('animation-start', () => this.clearAllHighlight()),
            eventsHub.on('layout:complete', (event) => this.layout(event)),
            eventsHub.on('dom:series-blurred', () => this.onSeriesBlurred()),
            eventsHub.on('series:focus-change', () => this.onKeyPress()),
            eventsHub.on('zoom:pan-start', () => this.clearAllHighlight()),
            eventsHub.on('zoom:change-complete', () => this.clearAllHighlight()),
            eventsHub.on('dom:resize', () => this.clearAllHighlight()),
            eventsHub.on('axis:change', () => this.axisChange())
        );

        if (seriesDragInterpreter) {
            this.cleanup.register(
                seriesDragInterpreter.events.on('drag-move', (event) => this.onHoverLikeEvent(event)),
                seriesDragInterpreter.events.on('click', (event) => this.onClick(event))
            );
        }
    }

    applyOptions(options: NormalisedBandHighlightOptions) {
        this.options = options;
    }

    private axisChange() {
        this.onHighlightChange();
    }

    private isHover(event: HoverLikeEvent): boolean {
        return (
            event.type === 'mousemove' ||
            event.type === 'click' ||
            (event.device === 'touch' && this.ctx.chartState.getValue('options', 'touch').dragAction === 'hover')
        );
    }

    private onClick(event: _Widget.ClickWidgetEvent) {
        if (event.device === 'touch') {
            this.onHoverLikeEvent(event);
        }
    }

    private clearAllHighlight() {
        if (!this.ctx.interactionManager.isState(InteractionState.Hoverable)) return;

        this.onHighlightChange();
    }

    private onSeriesBlurred() {
        if (!this.bandHighlightGroup.visible) return;
        this.hideBand();
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SCENE_RENDER });
    }

    private onKeyPress() {
        if (this.ctx.interactionManager.isState(InteractionState.Default)) {
            this.onHighlightChange();
        }
    }

    private onHoverLikeEvent(event: HoverLikeEvent): void {
        const requiredState = this.isHover(event) ? InteractionState.Hoverable : InteractionState.AnnotationsMoveable;
        if (!this.ctx.interactionManager.isState(requiredState)) return;
        this.handleHoverHighlight(event);
    }

    private handleHoverHighlight(event: HoverLikeEvent) {
        if (event == null || event.device === 'keyboard') return;

        const { currentX: x, currentY: y } = event;

        this.onHighlightChange(this.axisCtx.pickBand({ x, y }));
    }

    private layout({ series: { rect, visible }, axes }: _ModuleSupport.LayoutCompleteEvent) {
        if (!visible || axes == null || !this.options?.enabled) return;

        const { position: axisPosition = 'left', axisId } = this.axisCtx;

        const axisLayout = axes[axisId];
        if (axisLayout == null) return;

        this.axisLayout = axisLayout;
        this.bounds = rect.clone().grow(axisLayout.gridPadding, axisPosition);

        const { bandHighlightGroup, bounds } = this;
        bandHighlightGroup.translationX = Math.round(bounds.x);
        bandHighlightGroup.translationY = Math.round(bounds.y);

        this.updateBand();
    }

    private updateBand() {
        const { rangeNode: node, axisLayout, options } = this;

        if (!axisLayout || !options) return;

        const { stroke, strokeWidth, strokeOpacity, lineDash, fill, fillOpacity, lineDashOffset } = options;

        node.stroke = stroke;
        node.strokeWidth = strokeWidth;
        node.strokeOpacity = strokeOpacity;
        node.lineDash = lineDash;
        node.lineDashOffset = lineDashOffset;
        node.fill = getShapeFill(fill, FILL_GRADIENT_DEFAULTS, FILL_PATTERN_DEFAULTS, FILL_IMAGE_DEFAULTS);
        node.fillOpacity = fillOpacity;
        node.startLine = true;
        node.endLine = true;
    }

    private isVertical(): boolean {
        return this.axisCtx.direction === ChartAxisDirection.X;
    }

    private onHighlightChange(axisBandDatum?: _ModuleSupport.AxisBandDatum) {
        if (!this.options?.enabled) return;

        this.activeAxisHighlight = axisBandDatum;

        if (this.activeAxisHighlight) {
            this.showBand();
        } else {
            this.hideBand();
        }

        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SCENE_RENDER });
    }

    private updateBandPosition() {
        const { rangeNode, bounds } = this;

        const { band } = this.activeAxisHighlight ?? {};

        if (band == undefined) {
            this.hideBand();
            return;
        }

        let r0 = Math.min(...band);
        let r1 = Math.max(...band);

        if (r1 - r0 < 1) {
            const mid = (r0 + r1) / 2;
            r0 = mid - 0.5;
            r1 = mid + 0.5;
        }

        if (this.isVertical()) {
            rangeNode.y1 = 0;
            rangeNode.y2 = bounds.height;
            rangeNode.x1 = r0;
            rangeNode.x2 = r1;
            rangeNode.horizontal = true;
        } else {
            rangeNode.y1 = r0;
            rangeNode.y2 = r1;
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
