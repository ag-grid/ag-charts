import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import { BBox } from '../../scene/bbox';
import { ActionOnSet } from '../../util/proxy';
import { BOOLEAN, POSITIVE_NUMBER, Validate } from '../../util/validation';
import type { LayoutCompleteEvent, LayoutContext } from '../layout/layoutService';
import { NavigatorHandle } from './navigatorHandle';
import { NavigatorMask } from './navigatorMask';
import { RangeSelector } from './shapes/rangeSelector';

interface Offset {
    offsetX: number;
    offsetY: number;
}

export class Navigator extends BaseModuleInstance implements ModuleInstance {
    private readonly rs = new RangeSelector();

    // Wrappers to allow option application to the scene graph nodes.
    readonly mask = new NavigatorMask(this.rs.mask);
    readonly minHandle = new NavigatorHandle(this.rs.minHandle);
    readonly maxHandle = new NavigatorHandle(this.rs.maxHandle);

    private minHandleDragging = false;
    private maxHandleDragging = false;
    private panHandleOffset = NaN;

    @ActionOnSet<Navigator>({
        changeValue(newValue) {
            if (newValue) {
                this.min = 0;
                this.max = 1;
            }
            this.updateGroupVisibility();
        },
    })
    @Validate(BOOLEAN)
    private enabled = false;

    set width(value: number) {
        this.rs.width = value;
    }
    get width(): number {
        return this.rs.width;
    }

    set height(value: number) {
        this.rs.height = value;
    }
    get height(): number {
        return this.rs.height;
    }

    @Validate(POSITIVE_NUMBER)
    margin = 10;

    set min(value: number) {
        this.rs.min = value;
    }
    get min(): number {
        return this.rs.min;
    }

    set max(value: number) {
        this.rs.max = value;
    }
    get max(): number {
        return this.rs.max;
    }

    private _visible: boolean = true;
    set visible(value: boolean) {
        this._visible = value;
        this.updateGroupVisibility();
    }
    get visible() {
        return this._visible;
    }

    private updateGroupVisibility() {
        const visible = this.enabled && this.visible;
        this.rs.visible = visible;

        if (visible) {
            this.ctx.zoomManager.updateZoom('navigator', {
                x: { min: this.rs.min, max: this.rs.max },
                y: { min: 0, max: 1 },
            });
        } else {
            this.ctx.zoomManager.updateZoom('navigator');
        }
    }

    constructor(private readonly ctx: ModuleContext) {
        super();

        this.rs.onRangeChange = () =>
            ctx.zoomManager.updateZoom('navigator', {
                x: { min: this.rs.min, max: this.rs.max },
                y: { min: 0, max: 1 },
            });

        ctx.scene.root?.appendChild(this.rs);

        const interactionOpts = { bypassPause: ['animation' as const] };
        this.destroyFns.push(
            ctx.interactionManager.addListener('drag-start', (event) => this.onDragStart(event), interactionOpts),
            ctx.interactionManager.addListener('drag', (event) => this.onDrag(event), interactionOpts),
            ctx.interactionManager.addListener('hover', (event) => this.onDrag(event), interactionOpts),
            ctx.interactionManager.addListener('drag-end', () => this.onDragStop(), interactionOpts),
            ctx.layoutService.addListener('before-series', (event) => this.layout(event)),
            ctx.layoutService.addListener('layout-complete', (event) => this.layoutComplete(event)),
            () => ctx.scene.root?.removeChild(this.rs),
            () => this.ctx.zoomManager.updateZoom('navigator')
        );

        this.updateGroupVisibility();
    }

    private layout({ shrinkRect }: LayoutContext) {
        if (this.enabled) {
            const navigatorTotalHeight = this.rs.height + this.margin;
            shrinkRect.shrink(navigatorTotalHeight, 'bottom');
            this.rs.y = shrinkRect.y + shrinkRect.height + this.margin;
        }

        return { shrinkRect };
    }

    private layoutComplete({ series: { rect, visible } }: LayoutCompleteEvent) {
        if (this.enabled && visible) {
            this.rs.x = rect.x;
            this.rs.width = rect.width;
        }
        this.visible = visible;
    }

    private onDragStart(offset: Offset) {
        if (!this.enabled) {
            return;
        }

        const { offsetX, offsetY } = offset;
        const { rs } = this;
        const { minHandle, maxHandle, x, width, min } = rs;
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
        const { x, y, width, height, minHandle, maxHandle } = rs;
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
