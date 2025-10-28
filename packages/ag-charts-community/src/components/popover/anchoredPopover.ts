import { type Point, clamp, getWindow } from 'ag-charts-core';

import type { ExpandableWidget, ExpansionControllerWidget } from '../../widget/expandableWidget';
import { Popover, type PopoverOptions } from './popover';

export interface AnchoredPopoverOptions extends PopoverOptions {
    anchor?: Point;
    fallbackAnchor?: Point;
}

/**
 * A popover that opens at a given anchor point, keeps itself within the bounds of the chart, and can not be directly
 * moved by the user.
 */
export abstract class AnchoredPopover<
    Options extends AnchoredPopoverOptions = AnchoredPopoverOptions,
> extends Popover<Options> {
    private anchor?: Point;
    private fallbackAnchor?: Partial<Point>;

    public setAnchor(anchor: Point, fallbackAnchor?: Partial<Point>) {
        this.anchor = anchor;
        this.fallbackAnchor = fallbackAnchor;

        this.updatePosition(anchor);
        this.repositionWithinBounds();
    }

    private updateAnchor(options: Options) {
        const anchor = options.anchor ?? this.anchor;
        const fallbackAnchor = options.fallbackAnchor ?? this.fallbackAnchor;

        // If an anchor has already been provided, apply it to prevent a flash of the picker in the wrong location
        if (anchor) {
            this.setAnchor(anchor, fallbackAnchor);
        }
    }

    protected override showWidget(controller: ExpansionControllerWidget, owns: ExpandableWidget, options: Options) {
        super.showWidget(controller, owns, options);
        this.updateAnchor(options);
    }

    protected override showWithChildren(children: Array<HTMLElement>, options: Options) {
        const popover = super.showWithChildren(children, options);
        this.updateAnchor(options);

        // Wait for the DOM to be ready to reposition the element, so it is able to calculate if it will overflow the
        // bounding box
        getWindow().requestAnimationFrame(() => {
            this.repositionWithinBounds();
        });

        return popover;
    }

    protected repositionWithinBounds() {
        const { anchor, ctx, fallbackAnchor } = this;
        const popover = this.getPopoverElement();

        if (!anchor || !popover) return;

        const canvasRect = ctx.domManager.getBoundingClientRect();
        const { offsetWidth: width, offsetHeight: height } = popover;

        let x = clamp(0, anchor.x, canvasRect.width - width);
        let y = clamp(0, anchor.y, canvasRect.height - height);

        if (x !== anchor.x && fallbackAnchor?.x != null) {
            x = clamp(0, fallbackAnchor.x - width, canvasRect.width - width);
        }

        if (y !== anchor.y && fallbackAnchor?.y != null) {
            y = clamp(0, fallbackAnchor.y - height, canvasRect.height - height);
        }

        this.updatePosition({ x, y });
    }
}
