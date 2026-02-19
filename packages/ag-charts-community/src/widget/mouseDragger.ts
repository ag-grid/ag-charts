import { CleanupRegistry, attachListener } from 'ag-charts-core';

export type MouseDragCallbacks = {
    mousedown: (event: MouseEvent) => void;
    mousemove: (event: MouseEvent) => void;
    mouseup: (event: MouseEvent) => void;
};

export class MouseDragger {
    private readonly cleanup = new CleanupRegistry();

    constructor(
        private readonly glob: { globalMouseDragCallbacks?: MouseDragCallbacks },
        private readonly self: { mouseDragger?: MouseDragger },
        myCallbacks: MouseDragCallbacks,
        downEvent: MouseEvent
    ) {
        const { mousegeneral, mousemove, mouseup } = this;
        const eventView = downEvent.view!;
        this.cleanup.register(
            attachListener(eventView, 'mousedown', mousegeneral, { capture: true }),
            attachListener(eventView, 'mouseenter', mousegeneral, { capture: true }),
            attachListener(eventView, 'mouseleave', mousegeneral, { capture: true }),
            attachListener(eventView, 'mouseout', mousegeneral, { capture: true }),
            attachListener(eventView, 'mouseover', mousegeneral, { capture: true }),
            attachListener(eventView, 'mousemove', mousemove, { capture: true }),
            attachListener(eventView, 'mouseup', mouseup, { capture: true })
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
    if (glob.globalMouseDragCallbacks != null) return;
    return new MouseDragger(glob, self, myCallbacks, downEvent);
}
