import type { Destroyable } from '../../util/destroy';
import { StateTracker } from '../../util/stateTracker';
import type { DOMManager } from '../dom/domManager';

export enum Cursor {
    Auto = 'auto',
    Default = 'default',
    Grab = 'grab',
    Grabbing = 'grabbing',
    Move = 'move',
    NotAllowed = 'not-allowed',
    Pointer = 'pointer',
    EWResize = 'ew-resize',
    NSResize = 'ns-resize',
    ZoomIn = 'zoom-in',
    ZoomOut = 'zoom-out',
}

/**
 * Manages the cursor styling for an element. Tracks the requested styling from distinct
 * dependents and handles conflicting styling requests.
 */
export class CursorManager implements Destroyable {
    private readonly stateTracker = new StateTracker('default');

    constructor(private readonly domManager: DOMManager) {}

    destroy() {}

    public updateCursor(callerId: string, style?: string) {
        this.stateTracker.set(callerId, style);
        this.domManager.updateCursor(this.stateTracker.stateValue()!);
    }

    public getCursor(): string {
        return this.domManager.getCursor();
    }
}
