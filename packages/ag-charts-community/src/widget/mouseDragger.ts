import { CleanupRegistry, attachListener, isHTMLElement } from 'ag-charts-core';

export type MouseDragCallbacks = {
    mousedown: (event: MouseEvent) => void;
    mousemove: (event: MouseEvent) => void;
    mouseup: (event: MouseEvent) => void;
};

export class MouseDragger {
    private readonly targetWindow: Window;
    private readonly cleanup = new CleanupRegistry();

    constructor(
        private readonly glob: { globalMouseDragCallbacks?: MouseDragCallbacks },
        private readonly self: { mouseDragger?: MouseDragger },
        myCallbacks: MouseDragCallbacks,
        downEvent: MouseEvent
    ) {
        const resolvedWindow =
            downEvent.view ??
            (isHTMLElement(downEvent.target) ? downEvent.target.ownerDocument.defaultView : undefined);
        if (!resolvedWindow) {
            throw new Error('AG Charts - unable to resolve window');
        }
        this.targetWindow = resolvedWindow;
        const { targetWindow, mousegeneral, mousemove, mouseup } = this;
        this.cleanup.register(
            attachListener(targetWindow, 'mousedown', mousegeneral, { capture: true }),
            attachListener(targetWindow, 'mouseenter', mousegeneral, { capture: true }),
            attachListener(targetWindow, 'mouseleave', mousegeneral, { capture: true }),
            attachListener(targetWindow, 'mouseout', mousegeneral, { capture: true }),
            attachListener(targetWindow, 'mouseover', mousegeneral, { capture: true }),
            attachListener(targetWindow, 'mousemove', mousemove, { capture: true }),
            attachListener(targetWindow, 'mouseup', mouseup, { capture: true })
        );
        self.mouseDragger = this;
        glob.globalMouseDragCallbacks = myCallbacks;
        glob.globalMouseDragCallbacks.mousedown(downEvent);
        downEvent.stopPropagation();
        downEvent.stopImmediatePropagation();
    }

    destroy(): void {
        this.cleanup.flush();
        this.glob.globalMouseDragCallbacks = undefined;
        this.self.mouseDragger = undefined;
    }

    private readonly mousegeneral = (generalEvent: MouseEvent) => {
        generalEvent.stopPropagation();
        generalEvent.stopImmediatePropagation();
    };

    private readonly mousemove = (moveEvent: MouseEvent) => {
        moveEvent.stopPropagation();
        moveEvent.stopImmediatePropagation();
        this.glob.globalMouseDragCallbacks?.mousemove(moveEvent);
    };

    private readonly mouseup = (upEvent: MouseEvent) => {
        if (upEvent.button === 0) {
            upEvent.stopPropagation();
            upEvent.stopImmediatePropagation();
            this.glob.globalMouseDragCallbacks?.mouseup(upEvent);
            this.destroy();
        }
    };
}

type Arg = ConstructorParameters<typeof MouseDragger>;
export function startMouseDrag(glob: Arg[0], self: Arg[1], myCallbacks: Arg[2], downEvent: Arg[3]) {
    if (glob.globalMouseDragCallbacks != null) return undefined;
    return new MouseDragger(glob, self, myCallbacks, downEvent);
}
