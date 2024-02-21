import { StateTracker } from '../../util/stateTracker';

/**
 * Manages the cursor styling for an element. Tracks the requested styling from distinct
 * dependents and handles conflicting styling requests.
 */
export class CursorManager {
    private readonly stateTracker = new StateTracker('default');

    constructor(private readonly element: HTMLElement) {}

    public updateCursor(callerId: string, style?: string) {
        this.stateTracker.set(callerId, style);
        this.element.style.cursor = this.stateTracker.stateValue()!;
    }

    public getCursor(): string {
        return this.element.style.cursor;
    }
}
