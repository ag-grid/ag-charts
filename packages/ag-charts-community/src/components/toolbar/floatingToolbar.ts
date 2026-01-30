import {
    type AgDocumentLike,
    type BoxBounds,
    type Point,
    clamp,
    getIconClassNames,
    toAgDocument,
} from 'ag-charts-core';

import type { ModuleContext } from '../../module/moduleContext';
import { BBox } from '../../scene/bbox';
import { NativeWidget } from '../../widget/nativeWidget';
import { DraggablePopover } from '../popover/draggablePopover';
import type { PopoverOptions } from '../popover/popover';
import { BaseToolbar, type ToolbarButtonOptions, type ToolbarEventMap } from './toolbar';
import type { ToolbarButtonWidget } from './toolbarButtonWidget';

export interface FloatingToolbarAnchor {
    x: number;
    y: number;
    position?: 'above' | 'above-left' | 'right' | 'below';
}

interface FloatingToolbarEventMap<ButtonOptions extends ToolbarButtonOptions> extends ToolbarEventMap<ButtonOptions> {
    'toolbar-moved': {
        buttonBounds: Array<BoxBounds>;
        popoverBounds: BoxBounds;
    };
}

class FloatingToolbarPopover extends DraggablePopover {
    override dragHandleDraggingClass = 'ag-charts-floating-toolbar__drag-handle--dragging';

    constructor(
        ctx: ModuleContext,
        id: string,
        private readonly onPopoverMoved: () => void
    ) {
        super(ctx, id);
    }

    public show(children: HTMLElement[], options: PopoverOptions = {}) {
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
        return new BBox(
            element?.offsetLeft ?? 0,
            element?.offsetTop ?? 0,
            element?.offsetWidth ?? 0,
            element?.offsetHeight ?? 0
        );
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

    public ignorePointerEvents() {
        const element = this.getPopoverElement();
        if (element) element.style.pointerEvents = 'none';
    }

    public capturePointerEvents() {
        const element = this.getPopoverElement();
        if (element) element.style.pointerEvents = 'unset';
    }

    protected override updatePosition(position: Point) {
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
> extends BaseToolbar<ButtonOptions, ButtonWidget, FloatingToolbarEventMap<ButtonOptions>> {
    protected override hasPrefix = true;

    private readonly popover: FloatingToolbarPopover;
    private popoverBounds?: BBox;
    private readonly dragHandle: DragHandleWidget;

    constructor(ctx: ModuleContext, ariaLabelId: string, id: string) {
        super(ctx, ariaLabelId, 'horizontal');
        this.popover = new FloatingToolbarPopover(ctx, id, this.onPopoverMoved.bind(this));
        this.dragHandle = new DragHandleWidget(ctx.localeManager.t('toolbarAnnotationsDragHandle'), ctx.domManager.getDocument());
        this.popover.setDragHandle(this.dragHandle);
    }

    override destroy() {
        super.destroy();
        this.popover.destroy();
    }

    public show(options: PopoverOptions = {}) {
        this.popover.show([this.dragHandle.getElement(), this.getElement()], options);
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

        // Prevent triggering a 'toolbar-moved' event unless the position has actually changed
        if (this.popoverBounds?.equals(popoverBounds)) return;

        this.popoverBounds = popoverBounds.clone();
        const buttonBounds = this.getButtonBounds();

        this.events.dispatch('toolbar-moved', { popoverBounds, buttonBounds });
    }

    protected override getButtonWidgetBounds(buttonWidget: ButtonWidget) {
        const popoverBounds = this.popover.getBounds();
        const bounds = super.getButtonWidgetBounds(buttonWidget);
        const dragHandleBounds = this.dragHandle.getBounds();
        return new BBox(
            bounds.x + popoverBounds.x - dragHandleBounds.width,
            bounds.y + popoverBounds.y,
            bounds.width,
            bounds.height
        );
    }
}

class DragHandleWidget extends NativeWidget {
    constructor(title: string, document: AgDocumentLike) {
        const resolvedDocument = toAgDocument(document);
        if (!resolvedDocument) {
            throw new Error('AG Charts - unable to resolve global document');
        }
        super(resolvedDocument.createElement('div', 'ag-charts-floating-toolbar__drag-handle'));

        const icon = new NativeWidget<HTMLElement>(
            resolvedDocument.createElement('span', `${getIconClassNames('drag-handle')} ag-charts-toolbar__icon`)
        );
        icon.setAriaHidden(true);
        this.addChild(icon);

        this.elem.title = title;
    }
}
