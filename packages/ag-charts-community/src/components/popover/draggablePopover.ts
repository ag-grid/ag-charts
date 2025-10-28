import type { Point } from 'ag-charts-core';
import { Vec2 } from 'ag-charts-core';

import type { NativeWidget } from '../../widget/nativeWidget';
import type { DragWidgetEvent } from '../../widget/widgetEvents';
import { Popover, type PopoverOptions } from './popover';

export abstract class DraggablePopover<Options extends PopoverOptions = PopoverOptions> extends Popover<Options> {
    abstract readonly dragHandleDraggingClass: string;

    protected dragged = false;

    private dragStartState?: { client: Point; position: Point };

    public setDragHandle(dragHandle: NativeWidget) {
        dragHandle.addListener('drag-start', (event) => {
            dragHandle.addClass(this.dragHandleDraggingClass);
            this.onDragStart(event);
        });
        dragHandle.addListener('drag-move', this.onDragMove.bind(this));
        dragHandle.addListener('drag-end', () => {
            dragHandle.removeClass(this.dragHandleDraggingClass);
            this.onDragEnd.bind(this);
        });
    }

    protected onDragStart(event: DragWidgetEvent<'drag-start'>) {
        const popover = this.getPopoverElement();
        if (!popover) return;

        // Prevent text selection while dragging
        event.sourceEvent.preventDefault();

        this.dragged = true;

        this.dragStartState = {
            client: Vec2.from(event.clientX, event.clientY),
            position: Vec2.from(
                Number(popover.style.getPropertyValue('left').replace('px', '')),
                Number(popover.style.getPropertyValue('top').replace('px', ''))
            ),
        };
    }

    protected onDragMove(event: DragWidgetEvent<'drag-move'>) {
        const { dragStartState } = this;
        const popover = this.getPopoverElement();

        if (!dragStartState || !popover) return;

        const offset = Vec2.sub(Vec2.from(event.clientX, event.clientY), dragStartState.client);
        const position = Vec2.add(dragStartState.position, offset);

        const bounds = this.ctx.domManager.getBoundingClientRect();

        const partialPosition: Partial<Point> = {};

        if (position.x >= 0 && position.x + popover.offsetWidth <= bounds.width) {
            partialPosition.x = position.x;
        }

        if (position.y >= 0 && position.y + popover.offsetHeight <= bounds.height) {
            partialPosition.y = position.y;
        }

        this.updatePosition(partialPosition);
    }

    protected onDragEnd() {
        this.dragStartState = undefined;
    }
}
