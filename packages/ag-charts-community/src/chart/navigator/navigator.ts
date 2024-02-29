import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import { BBox } from '../../scene/bbox';
import { debounce } from '../../util/function';
import { clamp } from '../../util/number';
import { ObserveChanges, ProxyProperty } from '../../util/proxy';
import { BOOLEAN, OBJECT, POSITIVE_NUMBER, Validate } from '../../util/validation';
import { InteractionState } from '../interaction/interactionManager';
import { RangeHandle } from './shapes/rangeHandle';
import { RangeMask } from './shapes/rangeMask';
import { RangeSelector } from './shapes/rangeSelector';

interface Offset {
    offsetX: number;
    offsetY: number;
}

export class Navigator extends BaseModuleInstance implements ModuleInstance {
    protected readonly rs = new RangeSelector();

    @Validate(OBJECT, { optional: true })
    miniChart: unknown = undefined;

    private minHandleDragging = false;
    private maxHandleDragging = false;
    private panHandleOffset = NaN;

    @Validate(BOOLEAN)
    @ObserveChanges<Navigator>((target) => target.updateGroupVisibility())
    enabled: boolean = false;

    @ProxyProperty('rs.mask')
    mask!: RangeMask;

    @ProxyProperty('rs.minHandle')
    minHandle!: RangeHandle;

    @ProxyProperty('rs.maxHandle')
    maxHandle!: RangeHandle;

    height: number = 30;

    @ProxyProperty('rs.min')
    min!: number;

    @ProxyProperty('rs.max')
    max!: number;

    @Validate(POSITIVE_NUMBER)
    margin: number = 10;

    @Validate(BOOLEAN)
    @ObserveChanges<Navigator>((target) => target.updateGroupVisibility())
    visible: boolean = true;

    private updateGroupVisibility() {
        const visible = Boolean(this.enabled && this.visible);
        if (visible === this.rs.visible) return;
        this.rs.visible = visible;

        if (visible) {
            this.onRangeChange();
        }
    }

    constructor(private readonly ctx: ModuleContext) {
        super();

        this.rs.onRangeChange = debounce(() => this.onRangeChange());

        const region = ctx.regionManager.addRegion('navigator', this.rs);
        const dragStates = InteractionState.Default | InteractionState.Animation | InteractionState.ZoomDrag;
        this.destroyFns.push(
            ctx.scene.attachNode(this.rs),
            region.addListener('drag-start', (event) => this.onDragStart(event), dragStates),
            region.addListener('drag', (event) => this.onDrag(event), dragStates),
            region.addListener('hover', (event) => this.onDrag(event), dragStates),
            region.addListener('leave', (event) => this.onDrag(event), dragStates),
            region.addListener('drag-end', () => this.onDragStop(), dragStates),
            ctx.zoomManager.addListener('zoom-change', () => this.onZoomChange()),
            () => delete this.rs.onRangeChange
        );

        this.updateGroupVisibility();
    }

    protected x = 0;
    protected y = 0;
    protected width = 0;

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
        const visible = true;
        if (this.enabled && visible) {
            const { y, height } = this;
            this.rs.layout(x, y, width, height);
        }

        this.visible = visible;

        this.x = x;
        this.width = width;
    }

    private onRangeChange() {
        if (!this.enabled) return;
        const { min, max } = this.rs;
        const zoom = this.ctx.zoomManager.getZoom();
        if (zoom?.x?.min !== min || zoom?.x?.max !== max) {
            this.ctx.zoomManager.updateZoom('navigator', { x: { min, max }, y: zoom?.y }, false);
        }
    }

    private onZoomChange() {
        if (!this.enabled) return;
        const currentZoom = this.ctx.zoomManager.getZoom();
        if (currentZoom?.x) {
            this.rs.mask.setMin(currentZoom.x.min);
            this.rs.mask.setMax(currentZoom.x.max);
        }
    }

    private onDragStart(offset: Offset) {
        if (!this.enabled) {
            return;
        }

        const { offsetX, offsetY } = offset;
        const { rs } = this;
        const { minHandle, maxHandle, min } = rs;
        const { x, width } = this;
        const visibleRange = rs.computeVisibleRangeBBox();

        if (this.minHandleDragging || this.maxHandleDragging) return;

        if (minHandle.zIndex < maxHandle.zIndex) {
            if (maxHandle.containsPoint(offsetX, offsetY)) {
                this.maxHandleDragging = true;
            } else if (minHandle.containsPoint(offsetX, offsetY)) {
                this.minHandleDragging = true;
            }
        } else if (minHandle.containsPoint(offsetX, offsetY)) {
            this.minHandleDragging = true;
        } else if (maxHandle.containsPoint(offsetX, offsetY)) {
            this.maxHandleDragging = true;
        }

        if (!this.minHandleDragging && !this.maxHandleDragging && visibleRange.containsPoint(offsetX, offsetY)) {
            this.panHandleOffset = (offsetX - x) / width - min;
        }
    }

    private onDrag(offset: Offset & { type: 'drag' | 'leave' | 'hover' }) {
        if (!this.enabled) {
            return;
        }

        const { rs, panHandleOffset } = this;
        const { minHandle, maxHandle } = rs;
        const { x, y, width, height } = this;
        const { offsetX, offsetY } = offset;
        const minX = x + width * rs.min;
        const maxX = x + width * rs.max;
        const visibleRange = new BBox(minX, y, maxX - minX, height);

        const getRatio = () => clamp(0, (offsetX - x) / width, 1);

        if (offset.type !== 'drag') {
            if (minHandle.containsPoint(offsetX, offsetY) || maxHandle.containsPoint(offsetX, offsetY)) {
                this.ctx.cursorManager.updateCursor('navigator', 'ew-resize');
            } else if (visibleRange.containsPoint(offsetX, offsetY)) {
                this.ctx.cursorManager.updateCursor('navigator', 'grab');
            } else {
                this.ctx.cursorManager.updateCursor('navigator');
            }
        }

        if (this.minHandleDragging) {
            rs.min = getRatio();
        } else if (this.maxHandleDragging) {
            rs.max = getRatio();
        } else if (!isNaN(panHandleOffset)) {
            const span = rs.max - rs.min;
            const min = Math.min(getRatio() - panHandleOffset, 1 - span);
            if (min <= rs.min) {
                // pan left
                rs.min = min;
                rs.max = rs.min + span;
            } else {
                // pan right
                rs.max = min + span;
                rs.min = rs.max - span;
            }
        }
    }

    private onDragStop() {
        this.stopHandleDragging();
    }

    private stopHandleDragging() {
        this.minHandleDragging = this.maxHandleDragging = false;
        this.panHandleOffset = NaN;
    }
}
