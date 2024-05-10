import type { DOMManager } from './domManager';
import type { FocusIndicator } from './focusIndicator';

// TODO: stub interface
export class ProxyInteractionService {
    constructor(
        private readonly domManager: DOMManager,
        private readonly focusIndicator: FocusIndicator
    ) {}

    public destroy() {
        this.domManager;
        this.focusIndicator;
    }
}
