import type { ModuleContext } from '../../module/moduleContext';
import { BBox } from '../../scene/bbox';
import type { BBoxValues } from '../../util/bboxinterface';
import { createElement, getIconClassNames } from '../../util/dom';
import { clamp } from '../../util/number';
import type { Vec2 } from '../../util/vector';
import { NativeWidget } from '../../widget/nativeWidget';
import type { MouseWidgetEvent } from '../../widget/widgetEvents';
import { DraggablePopover } from '../popover/draggablePopover';
import type { PopoverOptions } from '../popover/popover';
import { BaseToolbar, type ToolbarButtonOptions } from './toolbar';
import type { ToolbarButtonWidget } from './toolbarButtonWidget';

export interface FloatingToolbarAnchor {
    x: number;
    y: number;
    position?: 'above' | 'above-left' | 'right' | 'below';
}

class FloatingToolbarPopover extends DraggablePopover<PopoverOptions> {
    override dragHandleDraggingClass = 'ag-charts-floating-toolbar__drag-handle--dragging';

    constructor(
        ctx: ModuleContext,
        id: string,
        private readonly onPopoverMoved: () => void
    ) {
        super(ctx, id);
    }

    public show(children: HTMLElement[], options: PopoverOptions) {
        this.showWithChildren(children, {
            ...options,
            class: 'ag-charts-floating-toolbar',
        });
    }

    public override hide() {
        this.dragged = false;
        super.hide();
    }

    public getBounds() {
        const element = this.getPopoverElement();
        return {
            x: element?.offsetLeft ?? 0,
            y: element?.offsetTop ?? 0,
            width: element?.offsetWidth ?? 0,
            height: element?.offsetHeight ?? 0,
        };
    }

    public hasBeenDragged() {
        return this.dragged;
    }

    public setAnchor(anchor: FloatingToolbarAnchor, horizontalSpacing: number, verticalSpacing: number) {
        const element = this.getPopoverElement();
        if (!element) return;

        const position = anchor.position ?? 'above';
        const { offsetWidth: width, offsetHeight: height } = element;

        let top = anchor.y - height - verticalSpacing;
        let left = anchor.x - width / 2;

        if (position === 'below') {
            top = anchor.y + verticalSpacing;
        } else if (position === 'right') {
            top = anchor.y - height / 2;
            left = anchor.x + horizontalSpacing;
        } else if (position === 'above-left') {
            left = anchor.x;
        }

        this.updatePosition({ x: left, y: top });
    }

    public startDragging(event: MouseEvent, dragHandle?: HTMLElement) {
        this.onDragStart(event, dragHandle);
    }

    public ignorePointerEvents() {
        const element = this.getPopoverElement();
        if (element) element.style.pointerEvents = 'none';
    }

    public capturePointerEvents() {
        const element = this.getPopoverElement();
        if (element) element.style.pointerEvents = 'unset';
    }

    protected override updatePosition(position: Vec2) {
        const bounds = this.getBounds();

        const canvasRect = this.ctx.domManager.getBoundingClientRect();
        position.x = Math.floor(clamp(0, position.x, canvasRect.width - bounds.width));
        position.y = Math.floor(clamp(0, position.y, canvasRect.height - bounds.height));

        super.updatePosition(position);
        this.onPopoverMoved();
    }
}

export abstract class FloatingToolbar<
    ButtonOptions extends ToolbarButtonOptions,
    ButtonWidget extends ToolbarButtonWidget,
> extends BaseToolbar<ButtonOptions, ButtonWidget> {
    protected override hasPrefix = true;

    private readonly popover: FloatingToolbarPopover;

    constructor(
        ctx: ModuleContext,
        id: string,
        onButtonPress: (event: MouseWidgetEvent<'click'>, button: ButtonOptions & { index: number }) => void,
        private readonly onToolbarMoved: (event: { buttonBounds: Array<BBoxValues>; popoverBounds: BBoxValues }) => void
    ) {
        super(ctx, onButtonPress);
        this.popover = new FloatingToolbarPopover(ctx, id, this.onPopoverMoved.bind(this));
        this.createDragHandle();
    }

    public show(options: PopoverOptions) {
        this.popover.show([this.getElement()], options);
    }

    public hide() {
        this.popover.hide();
    }

    public setAnchor(anchor: FloatingToolbarAnchor) {
        this.popover.setAnchor(anchor, this.horizontalSpacing, this.verticalSpacing);
    }

    public hasBeenDragged() {
        return this.popover.hasBeenDragged();
    }

    public ignorePointerEvents() {
        this.popover.ignorePointerEvents();
    }

    public capturePointerEvents() {
        this.popover.capturePointerEvents();
    }

    private onPopoverMoved() {
        const popoverBounds = this.popover.getBounds();
        const buttonBounds = this.getButtonBounds().map(
            (bounds) => new BBox(bounds.x + popoverBounds.x, bounds.y + popoverBounds.y, bounds.width, bounds.height)
        );
        this.onToolbarMoved({ popoverBounds, buttonBounds });
    }

    private createDragHandle() {
        const { popover } = this;

        const dragHandle = new NativeWidget<HTMLElement>(
            createElement('div', 'ag-charts-floating-toolbar__drag-handle')
        );
        dragHandle.getElement().innerHTML = `<span class="${getIconClassNames('drag-handle')} ag-charts-toolbar__icon"></span>`;
        dragHandle.getElement().addEventListener('mousedown', (event) => {
            popover.startDragging(event, dragHandle.getElement());
        });
        dragHandle.getElement().title = this.ctx.localeManager.t('toolbarAnnotationsDragHandle');

        this.appendChild(dragHandle);
    }
}
