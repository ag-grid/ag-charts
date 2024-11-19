import { Vec2 } from '../../util/vector';
import { Popover, type PopoverOptions } from './popover';

export abstract class DraggablePopover<Options extends PopoverOptions = PopoverOptions> extends Popover<Options> {
    abstract readonly dragHandleDraggingClass: string;

    protected dragged = false;

    private dragStartState?: { client: Vec2; position: Vec2 };

    protected onDragStart(event: MouseEvent, dragHandle?: HTMLElement) {
        const popover = this.getPopoverElement();
        if (!popover) return;

        const {
            ctx: { domManager },
        } = this;

        // Prevent text selection while dragging
        event.preventDefault();

        this.dragged = true;

        this.dragStartState = {
            client: Vec2.from(event.clientX, event.clientY),
            position: Vec2.from(
                Number(popover.style.getPropertyValue('left').replace('px', '')),
                Number(popover.style.getPropertyValue('top').replace('px', ''))
            ),
        };
        dragHandle?.classList.add(this.dragHandleDraggingClass);

        const onDrag = this.onDrag.bind(this);
        const onDragEnd = () => {
            domManager.removeEventListener('mousemove', onDrag);
            dragHandle?.classList.remove(this.dragHandleDraggingClass);
        };

        domManager.addEventListener('mousemove', onDrag);
        domManager.addEventListener('mouseup', onDragEnd, { once: true });

        // Catch `mouseup` events that do not propagate beyond the overlay
        popover.addEventListener('mouseup', () => onDragEnd, { once: true });
    }

    private onDrag(event: MouseEvent) {
        const { dragStartState } = this;
        const popover = this.getPopoverElement();

        if (!dragStartState || !popover) return;

        const offset = Vec2.sub(Vec2.from(event.clientX, event.clientY), dragStartState.client);
        const position = Vec2.add(dragStartState.position, offset);

        const bounds = this.ctx.domManager.getBoundingClientRect();

        const partialPosition: Partial<Vec2> = {};

        if (position.x >= bounds.x && position.x + popover.offsetWidth <= bounds.width) {
            partialPosition.x = position.x;
        }

        if (position.y >= bounds.y && position.y + popover.offsetHeight <= bounds.height) {
            partialPosition.y = position.y;
        }

        this.updatePosition(partialPosition);
    }
}
