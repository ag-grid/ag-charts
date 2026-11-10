import { createElement } from '../dom/domElements';
import { DragInterpreter } from '../dom/dragInterpreter';
import type { Writeable } from '../types/global';
import { BoundedTextWidget } from './boundedTextWidget';
import { ListWidget } from './listWidget';
import { NativeWidget } from './nativeWidget';
import type { Widget } from './widget';

type AxisWidgetInteraction = {
    readonly tickButtons: ListWidget;
    readonly dragInterpreter: DragInterpreter;
};

export class AxisWidget extends NativeWidget {
    private title?: BoundedTextWidget;
    private interactions?: Writeable<AxisWidgetInteraction>;

    constructor() {
        super(createElement('div'));
    }

    protected override onChildRemoved(child: Widget): void {
        if (child === this.title) {
            this.title = undefined;
        }
        if (child === this.interactions?.tickButtons) {
            this.interactions.dragInterpreter.destroy();
            this.interactions = undefined;
        }
        this.checkOwnership();
    }

    private checkOwnership(): void {
        // AxisWidget owns two things:
        // 1)  non-interactive alt-text for the axis title.
        // 2)  pointer/keyboard interactions on this HTML element.
        // This instance can safely self-destruct when it no longer owns anything.
        if (this.title === undefined && this.interactions === undefined) {
            this.destroy();
        }
    }

    acquireTitle(): BoundedTextWidget {
        if (this.title === undefined) {
            this.title = new BoundedTextWidget();
            this.title.parent = this;
            this.elem.prepend(this.title.getElement());
        }
        return this.title;
    }

    acquireInteractions(): AxisWidgetInteraction {
        if (this.interactions === undefined) {
            this.interactions = {
                tickButtons: new ListWidget(),
                dragInterpreter: new DragInterpreter(this),
            };
        }
        return this.interactions;
    }

    releaseInteractions(): void {
        this.interactions?.tickButtons.destroy();
    }
}
