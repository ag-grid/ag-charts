import { _ModuleSupport } from 'ag-charts-community';
import { AbstractModuleInstance, type BoxBounds, type DynamicContext, clamp } from 'ag-charts-core';

import { MiniChart } from './miniChart';
import { type NavigatorButtonType, NavigatorDOMProxy } from './navigatorDOMProxy';
import { RangeHandle } from './shapes/rangeHandle';
import { RangeMask } from './shapes/rangeMask';
import { RangeSelector } from './shapes/rangeSelector';

interface BBoxProvider {
    id: string;
    visible?: boolean;
    toCanvasBBox(): BoxBounds;
    getBBox(): _ModuleSupport.BBox;
}

export class Navigator extends AbstractModuleInstance {
    public miniChart?: MiniChart;

    public mask = new RangeMask();
    public minHandle = new RangeHandle();
    public maxHandle = new RangeHandle();

    // Navigator is only created when the `navigator` subtree is configured, so we
    // assert the subtree's presence here and rely on theme defaults for fields.
    private get opts(): _ModuleSupport.NormalisedNavigatorOptions {
        return this.ctx.chartState.getValue('options', 'navigator')!;
    }

    get enabled(): boolean {
        return this.opts.enabled;
    }

    private readonly maskVisibleRange: BBoxProvider = {
        id: 'navigator-mask-visible-range',
        getBBox: (): _ModuleSupport.BBox => this.mask.computeVisibleRangeBBox(),
        toCanvasBBox: (): _ModuleSupport.BBox => this.mask.computeVisibleRangeBBox(),
    };

    protected x = 0;
    protected y = 0;
    protected width = 0;

    private readonly rangeSelector = new RangeSelector([this.mask, this.minHandle, this.maxHandle]);

    private panStart?: number;
    private readonly domProxy: NavigatorDOMProxy;

    public constructor(private readonly ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super();

        this.miniChart = new MiniChart(ctx);
        this.updateBackground(undefined, this.miniChart.root);
        this.domProxy = new NavigatorDOMProxy(ctx, this);

        this.cleanup.register(
            ctx.scene.attachNode(this.rangeSelector),
            ctx.eventsHub.on('locale:change', () => this.updateZoom()),
            ctx.layoutManager.registerElement(_ModuleSupport.LayoutElement.Navigator, (e) => this.onLayoutStart(e)),
            ctx.eventsHub.on('layout:complete', (e) => this.onLayoutComplete(e)),
            ctx.eventsHub.on('zoom:change-complete', (event) => this.onZoomChange(event)),
            ctx.chartState.observe((get) => {
                const enabled = get('options', 'navigator.enabled') ?? false;
                ctx.zoomManager?.setNavigatorEnabled(Boolean(enabled));
                this.updateGroupVisibility();
            }),
            ctx.chartState.observe((get) => {
                this.mask.cornerRadius = get('options', 'navigator.cornerRadius') ?? 0;
            }),
            ctx.chartState.observe((get) => {
                const mask = get('options', 'navigator.mask');
                if (mask == null) return;
                this.applyShapeOptions(this.mask, mask);
            }),
            ctx.chartState.observe((get) => {
                const minHandle = get('options', 'navigator.minHandle');
                if (minHandle == null) return;
                this.applyHandleOptions(this.minHandle, minHandle);
            }),
            ctx.chartState.observe((get) => {
                const maxHandle = get('options', 'navigator.maxHandle');
                if (maxHandle == null) return;
                this.applyHandleOptions(this.maxHandle, maxHandle);
            })
        );

        this.updateGroupVisibility();
    }

    private applyShapeOptions(
        target: _ModuleSupport.Path,
        options: { fill?: string; fillOpacity?: number; stroke?: string; strokeWidth?: number }
    ) {
        if (options.fill != null) target.fill = options.fill;
        if (options.fillOpacity != null) target.fillOpacity = options.fillOpacity;
        if (options.stroke != null) target.stroke = options.stroke;
        if (options.strokeWidth != null) target.strokeWidth = options.strokeWidth;
    }

    private applyHandleOptions(target: RangeHandle, options: any) {
        this.applyShapeOptions(target, options);
        if (options.width != null) target.width = options.width;
        if (options.height != null) target.height = options.height;
        if (options.cornerRadius != null) target.cornerRadius = options.cornerRadius;
        if (options.grip != null) target.grip = options.grip;
    }

    public updateBackground(oldGroup?: _ModuleSupport.Group, newGroup?: _ModuleSupport.Group) {
        this.rangeSelector?.updateBackground(oldGroup, newGroup);
    }

    private updateGroupVisibility() {
        const { enabled } = this;

        if (this.rangeSelector == null || enabled === this.rangeSelector.visible) return;
        this.rangeSelector.visible = enabled;
        this.domProxy.updateVisibility(enabled);

        if (enabled) {
            this.updateZoom();
        }
    }

    protected onLayoutStart({ layoutBox }: _ModuleSupport.LayoutContext) {
        const opts = this.opts;
        const { enabled, height, spacing } = opts;

        if (enabled) {
            layoutBox.shrink(height + spacing, 'bottom');
            this.y = layoutBox.y + layoutBox.height + spacing;
        } else {
            this.y = 0;
        }

        if (enabled && this.miniChart) {
            const { top, bottom } = this.miniChart.computeAxisPadding();
            layoutBox.shrink(top + bottom, 'bottom');
            this.y -= bottom;

            this.miniChart.inset = this.mask.strokeWidth / 2;
            this.miniChart.cornerRadius = this.mask.cornerRadius;
        }
    }

    onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        const { x, width } = event.series.rect;
        const { y } = this;
        const { enabled, height } = this.opts;

        this.domProxy.updateVisibility(enabled);
        if (enabled) {
            const { _min: min, _max: max } = this.domProxy;
            this.layoutNodes(x, y, width, height, min, max);
            this.domProxy.updateBounds({ x, y, width, height });
        }

        this.x = x;
        this.width = width;

        this.miniChart?.layout(width, height).catch((e) => this.ctx.logger.error(e));
    }

    private canDrag() {
        return this.enabled && this.ctx.interactionManager.isState(_ModuleSupport.InteractionState.ZoomDraggable);
    }

    onDragStart(dragging: NavigatorButtonType, { offsetX }: { offsetX: number }) {
        if (!this.canDrag()) return;

        if (dragging === 'pan') {
            this.panStart = (offsetX - this.x) / this.width - this.domProxy._min;
        }

        this.ctx.zoomManager?.fireZoomPanStartEvent('navigator');
    }

    onDrag(dragging: NavigatorButtonType, { offsetX }: { offsetX: number }) {
        if (!this.canDrag()) return;

        const { panStart, x, width } = this;
        const { minRange } = this.domProxy;

        // Retrieve the zoom from the chart state directly to ensure we are always using the latest value.
        const zoom = this.ctx.chartState.getValue('zoom');
        if (!zoom?.x) return;
        let { min, max } = zoom.x;

        const ratio = (offsetX - x) / width;

        if (dragging === 'min') {
            min = clamp(0, ratio, max - minRange);
        } else if (dragging === 'max') {
            max = clamp(min + minRange, ratio, 1);
        } else if (dragging === 'pan' && panStart != null) {
            const span = max - min;
            min = clamp(0, ratio - panStart, 1 - span);
            max = min + span;
        }

        this.domProxy._min = min;
        this.domProxy._max = max;

        this.updateZoom();
    }

    private onZoomChange(event: _ModuleSupport.ZoomChangeCompleteEvent) {
        const { x: xZoom } = event;
        if (!xZoom) return;

        const { x, y, width } = this;
        const { height } = this.opts;
        const { min, max } = xZoom;

        this.domProxy.updateMinMax(min, max);
        this.layoutNodes(x, y, width, height, min, max);
    }

    private layoutNodes(x: number, y: number, width: number, height: number, min: number, max: number) {
        const { rangeSelector, mask, minHandle, maxHandle } = this;

        mask.layout(x, y, width, height, min, max);
        rangeSelector.layout(x, y, width, height, minHandle.width / 2, maxHandle.width / 2);

        RangeHandle.align(minHandle, maxHandle, x, y, width, height, min, max, mask.strokeWidth / 2);

        if (min + (max - min) / 2 < 0.5) {
            minHandle.zIndex = 3;
            maxHandle.zIndex = 4;
        } else {
            minHandle.zIndex = 4;
            maxHandle.zIndex = 3;
        }

        for (const [index, node] of [minHandle, this.maskVisibleRange, maxHandle].entries()) {
            const bbox = node.getBBox();
            const tbox = { x: bbox.x - x, y: bbox.y - y, height: bbox.height, width: bbox.width };
            this.domProxy.updateSliderBounds(index, tbox);
        }
    }

    private updateZoom() {
        if (!this.enabled) return;
        this.domProxy.updateZoom();
    }

    async processData(dataController: _ModuleSupport.DataController) {
        return this.miniChart?.processData(dataController);
    }
}
