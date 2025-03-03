import { getWindow } from 'ag-charts-core';

export type MouseDragCallbacks = {
    mousedown: (event: MouseEvent) => void;
    mousemove: (event: MouseEvent) => void;
    mouseup: (event: MouseEvent) => void;
};

export class MouseDragger {
    private readonly window = getWindow();

    constructor(
        private readonly glob: { globalMouseDragCallbacks?: MouseDragCallbacks },
        private readonly self: { mouseDragger?: MouseDragger },
        myCallbacks: MouseDragCallbacks,
        downEvent: MouseEvent
    ) {
        const { window, mousegeneral, mousemove, mouseup } = this;
        window.addEventListener('mousedown', mousegeneral, { capture: true });
        window.addEventListener('mouseenter', mousegeneral, { capture: true });
        window.addEventListener('mouseleave', mousegeneral, { capture: true });
        window.addEventListener('mouseout', mousegeneral, { capture: true });
        window.addEventListener('mouseover', mousegeneral, { capture: true });
        window.addEventListener('mousemove', mousemove, { capture: true });
        window.addEventListener('mouseup', mouseup, { capture: true });
        self.mouseDragger = this;
        glob.globalMouseDragCallbacks = myCallbacks;
        glob.globalMouseDragCallbacks.mousedown(downEvent);
    }

    destroy(): void {
        const { window, mousegeneral, mousemove, mouseup } = this;
        window.removeEventListener('mousedown', mousegeneral, { capture: true });
        window.removeEventListener('mouseenter', mousegeneral, { capture: true });
        window.removeEventListener('mouseleave', mousegeneral, { capture: true });
        window.removeEventListener('mouseout', mousegeneral, { capture: true });
        window.removeEventListener('mouseover', mousegeneral, { capture: true });
        window.removeEventListener('mousemove', mousemove, { capture: true });
        window.removeEventListener('mouseup', mouseup, { capture: true });
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
