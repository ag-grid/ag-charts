/**
 * Manages the cursor styling for an element. Tracks the requested styling from distinct
 * dependents and handles conflicting styling requests.
 */
export declare class CursorManager {
    private readonly element;
    private readonly stateTracker;
    constructor(element: HTMLElement);
    updateCursor(callerId: string, style?: string): void;
    getCursor(): string;
}
