import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import type { BBox } from '../../scene/bbox';
import type { Group } from '../../scene/group';
import { setElementBBox } from '../../util/dom';
import { Logger } from '../../util/logger';
import { clamp, formatPercentage } from '../../util/number';
import { ActionOnSet, ObserveChanges } from '../../util/proxy';
import { AND, BOOLEAN, GREATER_THAN, LESS_THAN, OBJECT, POSITIVE_NUMBER, RATIO, Validate } from '../../util/validation';
import { InteractionState, type PointerInteractionEvent } from '../interaction/interactionManager';
import type { ZoomChangeEvent } from '../interaction/zoomManager';
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
        computeBBox: (): BBox => {
            return this.mask.computeVisibleRangeBBox();
        },
        getCachedBBox: (): BBox => {
            return this.mask.computeVisibleRangeBBox();
        },
    };

    @Validate(POSITIVE_NUMBER)
    public height: number = 30;

    @Validate(POSITIVE_NUMBER)
    public margin: number = 10;

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
            region.addListener('drag-end', () => this.onDragEnd(), dragStates),
            region.addListener('leave', (event) => this.onLeave(event), dragStates),
            ctx.zoomManager.addListener('zoom-change', (event) => this.onZoomChange(event))
        );

        this.proxyNavigatorToolbar = this.ctx.domManager.addChild('canvas-overlay', `navigator-toolbar`);
        this.proxyNavigatorToolbar.classList.add('ag-charts-proxy-navigator-toolbar');
        this.proxyNavigatorToolbar.role = 'toolbar';
        this.proxyNavigatorToolbar.ariaLabel = 'Navigator';
        this.proxyNavigatorToolbar.style.pointerEvents = 'none';
        this.updateGroupVisibility();

        this.proxyNavigatorElements = [
            this.ctx.proxyInteractionService.createProxyElement({
                type: 'slider',
                id: 'ag-charts-navigator-pan',
                textContent: 'Panning',
                parent: this.proxyNavigatorToolbar,
                focusable: this.maskVisibleRange,
                onchange: (ev) => this.onPanSliderChange(ev),
            }),
            this.ctx.proxyInteractionService.createProxyElement({
                type: 'slider',
                id: 'ag-charts-navigator-min',
                textContent: 'Minimum',
                parent: this.proxyNavigatorToolbar,
                focusable: this.minHandle,
                onchange: (ev) => this.onSliderChange(ev, 1),
            }),
            this.ctx.proxyInteractionService.createProxyElement({
                type: 'slider',
                id: 'ag-charts-navigator-max',
                textContent: 'Maximum',
                parent: this.proxyNavigatorToolbar,
                focusable: this.maxHandle,
                onchange: (ev) => this.onSliderChange(ev, 2),
            }),
        ];
        this.onSliderChange;
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

        if (enabled) {
            this.updateZoom();
        } else {
            this.ctx.zoomManager.updateZoom('navigator');
        }
    }

    async performLayout({ shrinkRect }: { shrinkRect: BBox }): Promise<{ shrinkRect: BBox }> {
        if (this.enabled) {
            const navigatorTotalHeight = this.height + this.margin;
            shrinkRect.shrink(navigatorTotalHeight, 'bottom');
            this.y = shrinkRect.y + shrinkRect.height + this.margin;
        } else {
            this.y = 0;
        }

        return { shrinkRect };
    }

    async performCartesianLayout(opts: { seriesRect: BBox }): Promise<void> {
        const { x, width } = opts.seriesRect;

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

    private onHover(event: PointerInteractionEvent<'hover'>) {
        if (!this.enabled) return;

        const { mask, minHandle, maxHandle } = this;
        const { offsetX, offsetY } = event;

        if (minHandle.containsPoint(offsetX, offsetY) || maxHandle.containsPoint(offsetX, offsetY)) {
            this.ctx.cursorManager.updateCursor('navigator', 'ew-resize');
        } else if (mask.computeVisibleRangeBBox().containsPoint(offsetX, offsetY)) {
            this.ctx.cursorManager.updateCursor('navigator', 'grab');
        } else {
            this.ctx.cursorManager.updateCursor('navigator');
        }
    }

    private onDragStart(event: PointerInteractionEvent<'drag-start'>) {
        if (!this.enabled) return;

        const { mask, minHandle, maxHandle, x, width, _min: min } = this;
        const { offsetX, offsetY } = event;

        if (minHandle.zIndex < maxHandle.zIndex) {
            if (maxHandle.containsPoint(offsetX, offsetY)) {
                this.dragging = 'max';
            } else if (minHandle.containsPoint(offsetX, offsetY)) {
                this.dragging = 'min';
            }
        } else if (minHandle.containsPoint(offsetX, offsetY)) {
            this.dragging = 'min';
        } else if (maxHandle.containsPoint(offsetX, offsetY)) {
            this.dragging = 'max';
        }

        if (this.dragging == null && mask.computeVisibleRangeBBox().containsPoint(offsetX, offsetY)) {
            this.dragging = 'pan';
            this.panStart = (offsetX - x) / width - min;
        }

        if (this.dragging != null) {
            this.ctx.zoomManager.fireZoomPanStartEvent('navigator');
        }
    }

    private onDrag(event: PointerInteractionEvent<'drag'>) {
        if (!this.enabled || this.dragging == null) return;

        const { dragging, minRange, panStart, x, width } = this;
        let { _min: min, _max: max } = this;
        const { offsetX } = event;

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

        this._min = min;
        this._max = max;

        this.updateZoom();
    }

    private onDragEnd() {
        this.dragging = undefined;
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
    }

    private onPanSliderChange(_event: Event) {
        const ratio = this.getSliderRatio(this.proxyNavigatorElements[0]);
        const span = this._max - this._min;
        this._min = clamp(0, ratio, 1 - span);
        this._max = this._min + span;
        this.updateZoom();
    }

    private onSliderChange(_event: Event, proxyIndex: 1 | 2) {
        const { minRange, _min: min, _max: max } = this;
        const slider = this.proxyNavigatorElements[proxyIndex];
        const newRatio = this.getSliderRatio(slider);
        const meta = (
            [
                { key: '_min', clampMin: 0, clampMax: max - minRange },
                { key: '_max', clampMin: min + minRange, clampMax: 1 },
            ] as const
        )[proxyIndex - 1];

        // Clamp the user input:
        const clampedRatio = clamp(meta.clampMin, newRatio, meta.clampMax);
        if (clampedRatio !== newRatio) {
            this.setSliderRatio(slider, clampedRatio);
        }

        // Update the zoom
        this[meta.key] = clampedRatio;
        this.updateZoom();
    }

    private setPanSliderValue(min: number, max: number) {
        const minPercent = Math.round(min * 100);
        const maxPercent = Math.round(max * 100);
        const minFormat = formatPercentage(minPercent);
        const maxFormat = formatPercentage(maxPercent);
        this.proxyNavigatorElements[0].value = `${minPercent}`;
        this.proxyNavigatorElements[0].ariaValueText = `${minFormat} - ${maxFormat}`;
    }

    private setSliderRatio(slider: HTMLInputElement, ratio: number) {
        const value = Math.round(ratio * 100);
        slider.value = `${value}`;
        slider.ariaValueText = formatPercentage(value);
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

        [this.maskVisibleRange, minHandle, maxHandle].forEach((node, index) => {
            const bbox = node.computeBBox();
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
        const zoom = this.ctx.zoomManager.getZoom();
        if (min == null || max == null) return;

        const warnOnConflict = (stateId: string) => {
            if (this.min == null && this.max == null) return;
            Logger.warnOnce(
                `Could not apply [navigator.min] or [navigator.max] as [${stateId}] has modified the initial zoom state.`
            );
        };

        this.setPanSliderValue(min, max);
        this.setSliderRatio(this.proxyNavigatorElements[1], min);
        this.setSliderRatio(this.proxyNavigatorElements[2], max);
        return this.ctx.zoomManager.updateZoom('navigator', { x: { min, max }, y: zoom?.y }, false, warnOnConflict);
    }
}
