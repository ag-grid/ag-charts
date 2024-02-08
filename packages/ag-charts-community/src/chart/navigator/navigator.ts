import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import { BBox } from '../../scene/bbox';
import { debounce } from '../../util/function';
import { ActionOnSet, ObserveChanges, ProxyProperty } from '../../util/proxy';
import { BOOLEAN, POSITIVE_NUMBER, Validate } from '../../util/validation';
import type { DataController } from '../data/dataController';
import { InteractionState } from '../interaction/interactionManager';
import { MiniChart } from './miniChart';
import { RangeHandle } from './shapes/rangeHandle';
import { RangeMask } from './shapes/rangeMask';
import { RangeSelector } from './shapes/rangeSelector';

interface Offset {
    offsetX: number;
    offsetY: number;
}

export class Navigator extends BaseModuleInstance implements ModuleInstance {
    private readonly rs = new RangeSelector();

    private miniChartInstance: MiniChart | undefined = undefined;

    private minHandleDragging = false;
    private maxHandleDragging = false;
    private panHandleOffset = NaN;

    @Validate(BOOLEAN)
    @ActionOnSet<Navigator>({
        changeValue(newValue) {
            if (!newValue) {
                this.min = 0;
                this.max = 1;
            }
        },
    })
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

    @Validate(BOOLEAN)
    @ObserveChanges<Navigator, boolean>((target, value) => {
        if (target.miniChartInstance != null) {
            target.rs.background.removeChild(target.miniChartInstance.root);
        }

        if (value) {
            const miniChartInstance = new MiniChart(target.ctx);
            target.rs.background.appendChild(miniChartInstance.root);
            target.miniChartInstance = miniChartInstance;
        } else {
            target.miniChartInstance = undefined;
        }
    })
    miniChart: boolean = false;

    private updateGroupVisibility() {
        const visible = Boolean(this.enabled && this.visible);
        if (visible === this.rs.visible) return;
        this.rs.visible = visible;

        if (visible) {
            const zoom = this.ctx.zoomManager.getZoom();
            this.ctx.zoomManager.updateZoom({
                x: { min: this.rs.min, max: this.rs.max },
                y: zoom?.y,
            });
        } else {
            this.ctx.zoomManager.updateZoom();
        }
    }

    constructor(private readonly ctx: ModuleContext) {
        super();

        this.rs.onRangeChange = debounce(() => this.onRangeChange());

        ctx.scene.root?.appendChild(this.rs);

        const dragStates = InteractionState.Default | InteractionState.Animation | InteractionState.ZoomDrag;
        this.destroyFns.push(
            ctx.interactionManager.addListener('drag-start', (event) => this.onDragStart(event), dragStates),
            ctx.interactionManager.addListener('drag', (event) => this.onDrag(event), dragStates),
            ctx.interactionManager.addListener('hover', (event) => this.onDrag(event), dragStates),
            ctx.interactionManager.addListener('drag-end', () => this.onDragStop(), dragStates),
            ctx.zoomManager.addListener('zoom-change', () => this.onZoomChange()),
            () => ctx.scene.root?.removeChild(this.rs),
            () => delete this.rs.onRangeChange
        );

        this.updateGroupVisibility();
    }

    async updateData(opts: { data: any }): Promise<void> {
        await this.miniChartInstance?.updateData(opts);
    }

    async processData(opts: { dataController: DataController }): Promise<void> {
        await this.miniChartInstance?.processData(opts);
    }

    private x = 0;
    private y = 0;
    private width = 0;

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

            if (this.miniChartInstance != null) {
                this.miniChartInstance.width = width;
                this.miniChartInstance.height = height;

                await this.miniChartInstance.performCartesianLayout();
            }
        }

        this.visible = visible;

        this.x = x;
        this.width = width;
    }

    private onRangeChange() {
        const { min, max } = this.rs;
        const zoom = this.ctx.zoomManager.getZoom();
        if (zoom?.x?.min !== min || zoom?.x?.max !== max) {
            this.ctx.zoomManager.updateZoom({ x: { min, max }, y: zoom?.y });
        }
    }

    private onZoomChange() {
        const currentZoom = this.ctx.zoomManager.getZoom();
        if (currentZoom && currentZoom.x) {
            this.min = currentZoom.x.min;
            this.max = currentZoom.x.max;
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

        if (!(this.minHandleDragging || this.maxHandleDragging)) {
            if (minHandle.containsPoint(offsetX, offsetY)) {
                this.minHandleDragging = true;
            } else if (maxHandle.containsPoint(offsetX, offsetY)) {
                this.maxHandleDragging = true;
            } else if (visibleRange.containsPoint(offsetX, offsetY)) {
                this.panHandleOffset = (offsetX - x) / width - min;
            }
        }
    }

    private onDrag(offset: Offset) {
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

        const getRatio = () => Math.min(Math.max((offsetX - x) / width, 0), 1);

        if (minHandle.containsPoint(offsetX, offsetY) || maxHandle.containsPoint(offsetX, offsetY)) {
            this.ctx.cursorManager.updateCursor('navigator', 'ew-resize');
        } else if (visibleRange.containsPoint(offsetX, offsetY)) {
            this.ctx.cursorManager.updateCursor('navigator', 'grab');
        } else {
            this.ctx.cursorManager.updateCursor('navigator');
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
