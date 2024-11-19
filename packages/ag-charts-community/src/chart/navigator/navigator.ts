import type { LayoutContext, ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import type { BBox } from '../../scene/bbox';
import type { Group } from '../../scene/group';
import { Transformable } from '../../scene/transformable';
import type { BBoxProvider } from '../../util/bboxinterface';
import { clamp } from '../../util/number';
import { ObserveChanges } from '../../util/proxy';
import { BOOLEAN, OBJECT, POSITIVE_NUMBER, Validate } from '../../util/validation';
import { InteractionState } from '../interaction/interactionManager';
import type { ZoomChangeEvent } from '../interaction/zoomManager';
import { type LayoutCompleteEvent, LayoutElement } from '../layout/layoutManager';
import { type NavigatorButtonType, NavigatorDOMProxy } from './navigatorDOMProxy';
import { RangeHandle } from './shapes/rangeHandle';
import { RangeMask } from './shapes/rangeMask';
import { RangeSelector } from './shapes/rangeSelector';

export class Navigator extends BaseModuleInstance implements ModuleInstance {
    @Validate(OBJECT, { optional: true })
    public miniChart: unknown = undefined;

    @Validate(BOOLEAN)
    @ObserveChanges<Navigator>((target, value) => {
        target.ctx.zoomManager.setNavigatorEnabled(Boolean(value));
        target.updateGroupVisibility();
    })
    public enabled: boolean = false;

    public mask = new RangeMask();
    public minHandle = new RangeHandle();
    public maxHandle = new RangeHandle();
    private readonly maskVisibleRange = {
        id: 'navigator-mask-visible-range',
        getBBox: (): BBox => this.mask.computeVisibleRangeBBox(),
        toCanvasBBox: (): BBox => this.mask.computeVisibleRangeBBox(),
        fromCanvasPoint: (x: number, y: number) => ({ x, y }),
    } satisfies BBoxProvider & { getBBox(): BBox };

    @Validate(POSITIVE_NUMBER)
    public height: number = 30;

    @Validate(POSITIVE_NUMBER)
    public spacing: number = 10;

    protected x = 0;
    protected y = 0;
    protected width = 0;

    private readonly rangeSelector = new RangeSelector([this.mask, this.minHandle, this.maxHandle]);

    private panStart?: number;
    private readonly domProxy: NavigatorDOMProxy;

    constructor(private readonly ctx: ModuleContext) {
        super();

        this.destroyFns.push(
            ctx.scene.attachNode(this.rangeSelector),
            this.ctx.localeManager.addListener('locale-changed', () => this.updateZoom()),
            this.ctx.layoutManager.registerElement(LayoutElement.Navigator, (e) => this.onLayoutStart(e)),
            this.ctx.layoutManager.addListener('layout:complete', (e) => this.onLayoutComplete(e)),
            ctx.zoomManager.addListener('zoom-change', (event) => this.onZoomChange(event))
        );

        this.domProxy = new NavigatorDOMProxy(ctx, this);
        this.updateGroupVisibility();
    }

    public updateBackground(oldGroup?: Group, newGroup?: Group) {
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

    protected onLayoutStart(ctx: LayoutContext) {
        if (this.enabled) {
            const { layoutBox } = ctx;
            const navigatorTotalHeight = this.height + this.spacing;
            layoutBox.shrink(navigatorTotalHeight, 'bottom');
            this.y = layoutBox.y + layoutBox.height + this.spacing;
        } else {
            this.y = 0;
        }
    }

    onLayoutComplete(opts: LayoutCompleteEvent): Promise<void> | void {
        const { x, width } = opts.series.rect;
        const { y, height } = this;

        this.domProxy.updateVisibility(this.enabled);
        if (this.enabled) {
            this.layoutNodes(x, y, width, height);
            this.domProxy.updateBounds({ x, y, width, height });
        }

        this.x = x;
        this.width = width;
    }

    private canDrag() {
        const dragStates = InteractionState.Default | InteractionState.Animation | InteractionState.ZoomDrag;
        return this.enabled && this.ctx.interactionManager.getState() & dragStates;
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

    private onZoomChange(event: ZoomChangeEvent) {
        const { x } = event;
        if (!x) return;

        this.domProxy.updateMinMax(x.min, x.max);
        this.updateNodes(x.min, x.max);
    }

    private layoutNodes(x: number, y: number, width: number, height: number) {
        const { rangeSelector, mask, minHandle, maxHandle } = this;
        const { _min: min, _max: max } = this.domProxy;

        rangeSelector.layout(x, y, width, height, minHandle.width / 2, maxHandle.width / 2);
        mask.layout(x, y, width, height);

        RangeHandle.align(minHandle, maxHandle, x, y, width, height, min, max);

        if (min + (max - min) / 2 < 0.5) {
            minHandle.zIndex = 3;
            maxHandle.zIndex = 4;
        } else {
            minHandle.zIndex = 4;
            maxHandle.zIndex = 3;
        }

        [minHandle, this.maskVisibleRange, maxHandle].forEach((node, index) => {
            const bbox = node.getBBox();
            const tbox = { x: bbox.x - x, y: bbox.y - y, height: bbox.height, width: bbox.width };
            this.domProxy.updateSliderBounds(index, tbox);
        });
    }

    private updateNodes(min: number, max: number) {
        this.mask.update(min, max);
    }

    private updateZoom() {
        if (!this.enabled) return;
        this.domProxy.updateZoom();
    }

    testFindTarget(canvasX: number, canvasY: number): { target: HTMLElement; x: number; y: number } | undefined {
        if (!this.enabled) return undefined;

        if (Transformable.toCanvas(this.minHandle).containsPoint(canvasX, canvasY)) {
            return this.domProxy.testFindTarget('min', canvasX, canvasY);
        } else if (Transformable.toCanvas(this.maxHandle).containsPoint(canvasX, canvasY)) {
            return this.domProxy.testFindTarget('max', canvasX, canvasY);
        } else if (Transformable.toCanvas(this.mask).containsPoint(canvasX, canvasY)) {
            return this.domProxy.testFindTarget('pan', canvasX, canvasY);
        }
        return undefined;
    }
}
