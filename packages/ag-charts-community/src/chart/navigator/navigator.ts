import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import type { BBox } from '../../scene/bbox';
import type { Group } from '../../scene/group';
import { setElementBBox } from '../../util/dom';
import { Logger } from '../../util/logger';
import { clamp } from '../../util/number';
import { ActionOnSet, ObserveChanges } from '../../util/proxy';
import { AND, BOOLEAN, GREATER_THAN, LESS_THAN, OBJECT, POSITIVE_NUMBER, RATIO, Validate } from '../../util/validation';
import type { ConsumableEvent } from '../interaction/consumableEvent';
import { InteractionState, type PointerInteractionEvent } from '../interaction/interactionManager';
import type { KeyNavEvent } from '../interaction/keyNavManager';
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

    // We need both `hasFocus` and `focus`, because if we change browser window then we need to make
    // sure that we can restore the focus on the same button as before.
    private hasFocus = false;
    private focus?: NavigatorButtonType;

    private dragging?: NavigatorButtonType;
    private panStart?: number;
    private _min = 0;
    private _max = 1;

    private readonly minRange = 0.001;

    private readonly proxyNavigatorToolbar: HTMLElement;
    private readonly proxyNavigatorElements: [HTMLDivElement, HTMLDivElement, HTMLDivElement];

    constructor(private readonly ctx: ModuleContext) {
        super();

        const region = ctx.regionManager.addRegionFromProperties({
            name: 'navigator',
            bboxproviders: [this.rangeSelector],
            canInteraction: () => this.enabled && this.rangeSelector.visible,
        });
        const dragStates = InteractionState.Default | InteractionState.Animation | InteractionState.ZoomDrag;
        this.destroyFns.push(
            ctx.scene.attachNode(this.rangeSelector),
            region.addListener('hover', (event) => this.onHover(event), dragStates),
            region.addListener('drag-start', (event) => this.onDragStart(event), dragStates),
            region.addListener('drag', (event) => this.onDrag(event), dragStates),
            region.addListener('drag-end', () => this.onDragEnd(), dragStates),
            region.addListener('leave', (event) => this.onLeave(event), dragStates),
            region.addListener('tab', (event) => this.onTab(event), dragStates),
            region.addListener('tab-start', (event) => this.onTab(event), dragStates),
            region.addListener('nav-hori', (event) => this.onNavHori(event), dragStates),
            region.addListener('blur', (event) => this.onBlur(event), dragStates),
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
                type: 'div-scrollbar',
                id: 'ag-charts-navigator-pan',
                textContent: 'Panning',
                parent: this.proxyNavigatorToolbar,
                focusable: this.mask,
            }),
            this.ctx.proxyInteractionService.createProxyElement({
                type: 'div-slider',
                id: 'ag-charts-navigator-min',
                textContent: 'Minimum',
                parent: this.proxyNavigatorToolbar,
                focusable: this.minHandle,
            }),
            this.ctx.proxyInteractionService.createProxyElement({
                type: 'div-slider',
                id: 'ag-charts-navigator-max',
                textContent: 'Maximum',
                parent: this.proxyNavigatorToolbar,
                focusable: this.maxHandle,
            }),
        ];
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

    private onTab(event: KeyNavEvent<'tab' | 'tab-start'>) {
        // Update focused button
        if (this.focus !== undefined) {
            const indices = { min: 0, pan: 1, max: 2 } as const;
            const reverse = ['min', 'pan', 'max'] as const;
            const targetIndex = indices[this.focus] + event.delta;
            this.focus = reverse[targetIndex];
        }
        // Handle tabbing into the navigator
        else if (!this.hasFocus) {
            if (event.delta > 0) {
                this.focus = 'min';
            } else if (event.delta < 0) {
                this.focus = 'max';
            } else {
                Logger.error('expected state: this.focus is undefined and tab event delta is 0');
            }
        }

        this.hasFocus = this.focus !== undefined;
        this.updateFocus(event);
    }

    private onNavHori(event: KeyNavEvent<'nav-hori'>) {
        if (!this.enabled || this.focus == null) return;

        const { focus, minRange } = this;
        let { _min: min, _max: max } = this;
        const deltaRatio = event.delta * 0.05;

        if (focus === 'min') {
            min = clamp(0, min + deltaRatio, max - minRange);
        } else if (focus === 'max') {
            max = clamp(min + minRange, max + deltaRatio, 1);
        } else if (focus === 'pan') {
            const span = max - min;
            min = clamp(0, min + deltaRatio, 1 - span);
            max = min + span;
        }

        this._min = min;
        this._max = max;

        this.updateZoom();
        this.updateFocus(event);
    }

    private onBlur(_event: KeyNavEvent<'blur'>) {
        this.hasFocus = false;
    }

    private updateFocus(event: ConsumableEvent | undefined) {
        const { minHandle: min, maxHandle: max, mask: pan, focus, hasFocus, ctx } = this;
        if (focus && hasFocus) {
            const node = { min, max, pan }[focus];
            ctx.regionManager.updateFocusIndicatorRect(node.computeVisibleRangeBBox());
            event?.consume();
        }
    }

    private onZoomChange(event: ZoomChangeEvent) {
        const { x } = event;
        if (!x) return;

        this._min = x.min;
        this._max = x.max;
        this.updateNodes(x.min, x.max);
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
        this.updateFocus(undefined);

        [mask, minHandle, maxHandle].forEach((node: { computeBBox(): BBox }, index) => {
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

        return this.ctx.zoomManager.updateZoom('navigator', { x: { min, max }, y: zoom?.y }, false, warnOnConflict);
    }
}
