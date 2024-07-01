import type { DOMManager } from '../dom/domManager';
export declare enum Cursor {
    Auto = "auto",
    Default = "default",
    Grab = "grab",
    Grabbing = "grabbing",
    Move = "move",
    NotAllowed = "not-allowed",
    Pointer = "pointer",
    EWResize = "ew-resize",
    NSResize = "ns-resize",
    ZoomIn = "zoom-in",
    ZoomOut = "zoom-out"
}
/**
 * Manages the cursor styling for an element. Tracks the requested styling from distinct
 * dependents and handles conflicting styling requests.
 */
export declare class CursorManager {
    private readonly domManager;
    private readonly stateTracker;
    constructor(domManager: DOMManager);
    updateCursor(callerId: string, style?: string): void;
    getCursor(): string;
}
