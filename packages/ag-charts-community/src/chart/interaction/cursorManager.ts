import { StateTracker } from '../../util/stateTracker';
import type { DOMManager } from '../dom/domManager';

/**
 * Manages the cursor styling for an element. Tracks the requested styling from distinct
 * dependents and handles conflicting styling requests.
 */
export class CursorManager {
    private readonly stateTracker = new StateTracker('default');

    constructor(private readonly domManager: DOMManager) {}

    public updateCursor(callerId: string, style?: string) {
        this.stateTracker.set(callerId, style);
        this.domManager.updateCursor(this.stateTracker.stateValue()!);
    }

    public getCursor(): string {
        return this.domManager.getCursor();
    }
}
