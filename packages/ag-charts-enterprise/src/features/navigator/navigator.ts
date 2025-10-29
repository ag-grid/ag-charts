import { _ModuleSupport } from 'ag-charts-community';
import { AbstractModuleInstance, type BoxBounds, Logger, clamp } from 'ag-charts-core';

import { MiniChart } from './miniChart';
import { type NavigatorButtonType, NavigatorDOMProxy } from './navigatorDOMProxy';
import { RangeHandle } from './shapes/rangeHandle';
import { RangeMask } from './shapes/rangeMask';
import { RangeSelector } from './shapes/rangeSelector';

const { ObserveChanges, Property } = _ModuleSupport;

interface BBoxProvider {
    id: string;
    visible?: boolean;
    toCanvasBBox(): BoxBounds;
    fromCanvasPoint(x: number, y: number): { x: number; y: number };
    getBBox(): _ModuleSupport.BBox;
}

export class Navigator extends AbstractModuleInstance {
    // @TempValidate
    @ObserveChanges<Navigator, MiniChart>((target, value, oldValue) => {
        target.updateBackground(oldValue?.root, value?.root);
    })
    public miniChart?: MiniChart;

    @Property
    @ObserveChanges<Navigator>((target, value) => {
        target.ctx.zoomManager.setNavigatorEnabled(Boolean(value));
        target.updateGroupVisibility();
    })
    public enabled: boolean = false;

    public mask = new RangeMask();
    public minHandle = new RangeHandle();
    public maxHandle = new RangeHandle();
    private readonly maskVisibleRange: BBoxProvider = {
        id: 'navigator-mask-visible-range',
        getBBox: (): _ModuleSupport.BBox => this.mask.computeVisibleRangeBBox(),
        toCanvasBBox: (): _ModuleSupport.BBox => this.mask.computeVisibleRangeBBox(),
        fromCanvasPoint: (x: number, y: number) => ({ x, y }),
    };

    @Property
    public height: number = 30;

    @Property
    @ObserveChanges<Navigator>((target, value) => {
        target.mask.cornerRadius = value;
    })
    public cornerRadius: number = 0;

    @Property
    public spacing: number = 10;

    protected x = 0;
    protected y = 0;
    protected width = 0;

    private readonly rangeSelector = new RangeSelector([this.mask, this.minHandle, this.maxHandle]);

    private panStart?: number;
    private readonly domProxy: NavigatorDOMProxy;

    public constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.cleanup.register(
            ctx.scene.attachNode(this.rangeSelector),
            ctx.eventsHub.on('locale:change', () => this.updateZoom()),
            ctx.layoutManager.registerElement(_ModuleSupport.LayoutElement.Navigator, (e) => this.onLayoutStart(e)),
            ctx.eventsHub.on('layout:complete', (e) => this.onLayoutComplete(e)),
            ctx.eventsHub.on('zoom:change-requested', (event) => this.onZoomChange(event))
        );

        this.domProxy = new NavigatorDOMProxy(ctx, this);
        this.updateGroupVisibility();

        this.miniChart = new MiniChart(ctx);
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
        } else {
            this.ctx.zoomManager.updateZoom('navigator');
        }
    }

    protected onLayoutStart({ layoutBox }: _ModuleSupport.LayoutContext) {
        if (this.enabled) {
            const navigatorTotalHeight = this.height + this.spacing;
            layoutBox.shrink(navigatorTotalHeight, 'bottom');
            this.y = layoutBox.y + layoutBox.height + this.spacing;
        } else {
            this.y = 0;
        }

        if (this.enabled && this.miniChart) {
            const { top, bottom } = this.miniChart.computeAxisPadding();
            layoutBox.shrink(top + bottom, 'bottom');
            this.y -= bottom;

            this.miniChart.inset = this.mask.strokeWidth / 2;
            this.miniChart.cornerRadius = this.mask.cornerRadius;
        }
    }

    onLayoutComplete(opts: _ModuleSupport.LayoutCompleteEvent) {
        const { x, width } = opts.series.rect;
        const { y, height } = this;

        this.domProxy.updateVisibility(this.enabled);
        if (this.enabled) {
            const { _min: min, _max: max } = this.domProxy;
            this.layoutNodes(x, y, width, height, min, max);
            this.domProxy.updateBounds({ x, y, width, height });
        }

        this.x = x;
        this.width = width;

        this.miniChart?.layout(width, height).catch((e) => Logger.error(e));
    }

    private canDrag() {
        return this.enabled && this.ctx.interactionManager.isState(_ModuleSupport.InteractionState.ZoomDraggable);
    }

    onDragStart(dragging: NavigatorButtonType, { offsetX }: { offsetX: number }) {
        if (!this.canDrag()) return;

        if (dragging === 'pan') {
            this.panStart = (offsetX - this.x) / this.width - this.domProxy._min;
        }

        this.ctx.zoomManager.fireZoomPanStartEvent('navigator');
    }

    onDrag(dragging: NavigatorButtonType, { offsetX }: { offsetX: number }) {
        if (!this.canDrag()) return;

        const { panStart, x, width } = this;
        const { minRange } = this.domProxy;
        let { _min: min, _max: max } = this.domProxy;

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

    private onZoomChange(event: _ModuleSupport.ZoomChangeRequestedEvent) {
        const { x: xZoom } = event;
        if (!xZoom) return;

        const { x, y, width, height } = this;
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
