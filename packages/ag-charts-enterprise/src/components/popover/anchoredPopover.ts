import { _Util } from 'ag-charts-community';

import { Popover, type PopoverOptions } from './popover';

const { clamp } = _Util;

export interface AnchoredPopoverOptions extends PopoverOptions {}

/**
 * A popover that opens at a given anchor point, keeps itself within the bounds of the chart, and can not be directly
 * moved by the user.
 */
export class AnchoredPopover<Options extends AnchoredPopoverOptions = AnchoredPopoverOptions> extends Popover<Options> {
    private anchor?: _Util.Vec2;
    private fallbackAnchor?: Partial<_Util.Vec2>;

    public setAnchor(anchor: _Util.Vec2, fallbackAnchor?: Partial<_Util.Vec2>) {
        this.anchor = anchor;
        this.fallbackAnchor = fallbackAnchor;

        this.updatePosition(anchor);
        this.repositionWithinBounds();
    }

    public override show(options: Options) {
        const { anchor, fallbackAnchor } = this;

        super.show(options);

        // If an anchor has already been provided, apply it to prevent a flash of the picker in the wrong location
        if (anchor) {
            this.setAnchor(anchor, fallbackAnchor);
        }

        this.repositionWithinBounds();
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
