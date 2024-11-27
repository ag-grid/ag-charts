import type { ToolbarButtonOptions } from '../../components/toolbar/toolbar';
import type { DOMManager } from '../../dom/domManager';
import type { LocaleManager } from '../../locale/localeManager';
import { SharedToolbar } from './sharedToolbar';

export class ToolbarManager {
    private sharedToolbar?: SharedToolbar<ToolbarButtonOptions>;

    constructor(
        private readonly domManager: DOMManager,
        private readonly localeManager: LocaleManager
    ) {}

    public getSharedToolbar<ButtonOptions extends ToolbarButtonOptions>() {
        if (!this.sharedToolbar) {
            this.sharedToolbar = new SharedToolbar(this.localeManager);
            this.domManager.addChild('canvas-overlay', 'shared-toolbar', this.sharedToolbar.getElement());
        }

        return this.sharedToolbar as SharedToolbar<ButtonOptions>;
    }
}
