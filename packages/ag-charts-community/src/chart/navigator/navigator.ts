import type { LayoutContext, ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import type { BBox } from '../../scene/bbox';
import type { Group } from '../../scene/group';
import { setAttribute } from '../../util/attributeUtil';
import type { BBoxProvider } from '../../util/bboxinterface';
import { setElementBBox } from '../../util/dom';
import { formatPercent } from '../../util/format.util';
import { initToolbarKeyNav } from '../../util/keynavUtil';
import { Logger } from '../../util/logger';
import { clamp } from '../../util/number';
import { ActionOnSet, ObserveChanges } from '../../util/proxy';
import { AND, BOOLEAN, GREATER_THAN, LESS_THAN, OBJECT, POSITIVE_NUMBER, RATIO, Validate } from '../../util/validation';
import { InteractionState, type PointerInteractionEvent } from '../interaction/interactionManager';
import type { RegionEvent } from '../interaction/regionManager';
import type { ZoomChangeEvent } from '../interaction/zoomManager';
import { type LayoutCompleteEvent, LayoutElement } from '../layout/layoutManager';
import { RangeHandle } from './shapes/rangeHandle';
import { RangeMask } from './shapes/rangeMask';
import { RangeSelector } from './shapes/rangeSelector';

type NavigatorButtonType = 'min' | 'max' | 'pan';

export class Navigator extends BaseModuleInstance implements ModuleInstance {
    @Validate(OBJECT, { optional: true })
    public miniChart: unknown = undefined;

    @Validate(BOOLEAN)
    @ObserveChanges<Navigator>((target) => target.updateGroupVisibility())
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

    @ActionOnSet<Navigator>({
        newValue(min) {
            this._min = min;
            this.updateZoom();
        },
    })
    @Validate(AND(RATIO, LESS_THAN('max')), { optional: true })
    public min?: number;

    @ActionOnSet<Navigator>({
        newValue(max) {
            this._max = max;
            this.updateZoom();
        },
    })
    @Validate(AND(RATIO, GREATER_THAN('min')), { optional: true })
    public max?: number;

    protected x = 0;
    protected y = 0;
    protected width = 0;

    private readonly rangeSelector = new RangeSelector([this.mask, this.minHandle, this.maxHandle]);

    private dragging?: NavigatorButtonType;
    private panStart?: number;
    private _min = 0;
    private _max = 1;

    private readonly minRange = 0.001;

    private readonly proxyNavigatorToolbar: HTMLElement;
    private readonly proxyNavigatorElements: [HTMLInputElement, HTMLInputElement, HTMLInputElement];

    constructor(private readonly ctx: ModuleContext) {
        super();

        const region = ctx.regionManager.addRegion('navigator', this.rangeSelector);
        const dragStates = InteractionState.Default | InteractionState.Animation | InteractionState.ZoomDrag;
        this.destroyFns.push(
            ctx.scene.attachNode(this.rangeSelector),
            region.addListener('hover', (event) => this.onHover(event), dragStates),
            region.addListener('drag-start', (event) => this.onDragStart(event), dragStates),
            region.addListener('drag', (event) => this.onDrag(event), dragStates),
            region.addListener('drag-end', (event) => this.onDragEnd(event), dragStates),
            region.addListener('leave', (event) => this.onLeave(event), dragStates),
            this.ctx.localeManager.addListener('locale-changed', () => this.updateZoom()),
            this.ctx.layoutManager.registerElement(LayoutElement.Navigator, (e) => this.onLayoutStart(e)),
            this.ctx.layoutManager.addListener('layout:complete', (e) => this.onLayoutComplete(e)),
            ctx.zoomManager.addListener('zoom-change', (event) => this.onZoomChange(event))
        );

        this.proxyNavigatorToolbar = this.ctx.proxyInteractionService.createProxyContainer({
            type: 'toolbar',
            id: `navigator-toolbar`,
            classList: ['ag-charts-proxy-navigator-toolbar'],
            ariaOrientation: 'vertical',
            ariaLabel: { id: 'ariaLabelNavigator' },
        });
        this.updateGroupVisibility();

        this.proxyNavigatorElements = [
            this.ctx.proxyInteractionService.createProxyElement({
                type: 'slider',
                id: 'ag-charts-navigator-min',
                ariaLabel: { id: 'ariaLabelNavigatorMinimum' },
                ariaOrientation: 'horizontal',
                parent: this.proxyNavigatorToolbar,
                onchange: (ev) => this.onMinSliderChange(ev),
            }),
            this.ctx.proxyInteractionService.createProxyElement({
                type: 'slider',
                id: 'ag-charts-navigator-pan',
                ariaLabel: { id: 'ariaLabelNavigatorRange' },
                ariaOrientation: 'horizontal',
                parent: this.proxyNavigatorToolbar,
                onchange: (ev) => this.onPanSliderChange(ev),
            }),
            this.ctx.proxyInteractionService.createProxyElement({
                type: 'slider',
                id: 'ag-charts-navigator-max',
                ariaLabel: { id: 'ariaLabelNavigatorMaximum' },
                ariaOrientation: 'horizontal',
                parent: this.proxyNavigatorToolbar,
                onchange: (ev) => this.onMaxSliderChange(ev),
            }),
        ];
        this.proxyNavigatorElements.forEach((slider) => setAttribute(slider, 'data-preventdefault', false));
        this.setSliderRatio(this.proxyNavigatorElements[0], this._min);
        this.setSliderRatio(this.proxyNavigatorElements[2], this._max);
        this.setPanSliderValue(this._min, this._max);
        initToolbarKeyNav({
            orientation: 'vertical',
            toolbar: this.proxyNavigatorToolbar,
            buttons: this.proxyNavigatorElements,
        });
        this.destroyFns.push(() => {
            this.proxyNavigatorElements.forEach((e) => e.remove());
            this.proxyNavigatorToolbar.remove();
        });
    }

    public updateBackground(oldGroup?: Group, newGroup?: Group) {
        this.rangeSelector?.updateBackground(oldGroup, newGroup);
    }

    private updateGroupVisibility() {
        const { enabled } = this;

        if (this.rangeSelector == null || enabled === this.rangeSelector.visible) return;
        this.rangeSelector.visible = enabled;
        this.proxyNavigatorToolbar.ariaHidden = (!enabled).toString();

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

    onLayoutComplete(opts: LayoutCompleteEvent) {
        const { x, width } = opts.series.rect;

        if (this.enabled) {
            const { y, height } = this;
            this.layoutNodes(x, y, width, height);
            setElementBBox(this.proxyNavigatorToolbar, { x, y, width, height });
            this.proxyNavigatorToolbar.style.removeProperty('display');
        } else {
            this.proxyNavigatorToolbar.style.display = 'none';
        }

        this.x = x;
        this.width = width;
    }

    private onHover(event: RegionEvent<'hover'>) {
        if (!this.enabled) return;
        this.updateCursor(event);
    }

    private updateCursor(event: RegionEvent) {
        if (!this.enabled) return;

        const { mask, minHandle, maxHandle } = this;
        const { regionOffsetX, regionOffsetY } = event;

        if (
            minHandle.containsPoint(regionOffsetX, regionOffsetY) ||
            maxHandle.containsPoint(regionOffsetX, regionOffsetY)
        ) {
            this.ctx.cursorManager.updateCursor('navigator', 'ew-resize');
        } else if (mask.computeVisibleRangeBBox().containsPoint(regionOffsetX, regionOffsetY)) {
            this.ctx.cursorManager.updateCursor('navigator', 'grab');
        } else {
            this.ctx.cursorManager.updateCursor('navigator');
        }
    }

    private onDragStart(event: RegionEvent<'drag-start'>) {
        if (!this.enabled) return;
        this.updateCursor(event);

        const { mask, minHandle, maxHandle, x, width, _min: min } = this;
        const { regionOffsetX, regionOffsetY } = event;

        if (minHandle.zIndex < maxHandle.zIndex) {
            if (maxHandle.containsPoint(regionOffsetX, regionOffsetY)) {
                this.dragging = 'max';
            } else if (minHandle.containsPoint(regionOffsetX, regionOffsetY)) {
                this.dragging = 'min';
            }
        } else if (minHandle.containsPoint(regionOffsetX, regionOffsetY)) {
            this.dragging = 'min';
        } else if (maxHandle.containsPoint(regionOffsetX, regionOffsetY)) {
            this.dragging = 'max';
        }

        if (this.dragging == null && mask.computeVisibleRangeBBox().containsPoint(regionOffsetX, regionOffsetY)) {
            this.dragging = 'pan';
            this.panStart = (regionOffsetX - x) / width - min;
        }

        if (this.dragging != null) {
            this.ctx.zoomManager.fireZoomPanStartEvent('navigator');
        }
    }

    private onDrag(event: RegionEvent<'drag'>) {
        if (!this.enabled || this.dragging == null) return;

        const { dragging, minRange, panStart, x, width } = this;
        let { _min: min, _max: max } = this;
        const { regionOffsetX } = event;

        const ratio = (regionOffsetX - x) / width;

        if (dragging === 'min') {
            min = clamp(0, ratio, max - minRange);
        } else if (dragging === 'max') {
            max = clamp(min + minRange, ratio, 1);
        } else if (dragging === 'pan' && panStart != null) {
            const span = max - min;
            min = clamp(0, ratio - panStart, 1 - span);
            max = min + span;
        }

        this._min = min;
        this._max = max;

        this.updateZoom();
    }

    private onDragEnd(event: RegionEvent<'drag-end'>) {
        this.dragging = undefined;
        this.updateCursor(event);
    }

    private onLeave(_event: PointerInteractionEvent<'leave'>) {
        this.ctx.cursorManager.updateCursor('navigator');
    }

    private onZoomChange(event: ZoomChangeEvent) {
        const { x } = event;
        if (!x) return;

        this._min = x.min;
        this._max = x.max;
        this.updateNodes(x.min, x.max);
        this.setPanSliderValue(x.min, x.max);
        this.setSliderRatio(this.proxyNavigatorElements[0], x.min);
        this.setSliderRatio(this.proxyNavigatorElements[2], x.max);
    }

    private onPanSliderChange(_event: Event) {
        const ratio = this.getSliderRatio(this.proxyNavigatorElements[1]);
        const span = this._max - this._min;
        this._min = clamp(0, ratio, 1 - span);
        this._max = this._min + span;
        this.updateZoom();
    }

    private onMinSliderChange(_event: Event) {
        const slider = this.proxyNavigatorElements[0];
        this._min = this.setSliderRatioClamped(slider, 0, this._max - this.minRange);
        this.updateZoom();
    }

    private onMaxSliderChange(_event: Event) {
        const slider = this.proxyNavigatorElements[2];
        this._max = this.setSliderRatioClamped(slider, this._min + this.minRange, 1);
        this.updateZoom();
    }

    private setPanSliderValue(min: number, max: number) {
        this.proxyNavigatorElements[1].value = `${Math.round(min * 100)}`;
        this.proxyNavigatorElements[1].ariaValueText = this.ctx.localeManager.t('ariaValuePanRange', { min, max });
    }

    private setSliderRatioClamped(slider: HTMLInputElement, clampMin: number, clampMax: number) {
        const ratio = this.getSliderRatio(slider);
        const clampedRatio = clamp(clampMin, ratio, clampMax);
        if (clampedRatio !== ratio) {
            this.setSliderRatio(slider, clampedRatio);
        }
        return clampedRatio;
    }

    private setSliderRatio(slider: HTMLInputElement, ratio: number) {
        const value = Math.round(ratio * 100);
        slider.value = `${value}`;
        slider.ariaValueText = formatPercent(value / 100);
    }

    private getSliderRatio(slider: HTMLInputElement) {
        return parseFloat(slider.value) / 100;
    }

    private layoutNodes(x: number, y: number, width: number, height: number) {
        const { rangeSelector, mask, minHandle, maxHandle, _min: min, _max: max } = this;

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
            setElementBBox(this.proxyNavigatorElements[index], tbox);
        });
    }

    private updateNodes(min: number, max: number) {
        this.mask.update(min, max);
    }

    private updateZoom() {
        if (!this.enabled) return;

        const { _min: min, _max: max } = this;
        if (min == null || max == null) return;

        const warnOnConflict = (stateId: string) => {
            if (this.min == null && this.max == null) return;
            Logger.warnOnce(
                `Could not apply [navigator.min] or [navigator.max] as [${stateId}] has modified the initial zoom state.`
            );
        };

        return this.ctx.zoomManager.updateZoom('navigator', { x: { min, max } }, false, warnOnConflict);
    }
}
