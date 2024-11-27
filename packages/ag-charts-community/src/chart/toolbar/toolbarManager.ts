import type { ToolbarButtonOptions } from '../../components/toolbar/toolbar';
import type { ModuleContext } from '../../module/moduleContext';
import { SharedToolbar } from './sharedToolbar';

export class ToolbarManager {
    private sharedToolbar?: SharedToolbar<ToolbarButtonOptions>;

    public getSharedToolbar<ButtonOptions extends ToolbarButtonOptions>(ctx: ModuleContext) {
        if (!this.sharedToolbar) {
            this.sharedToolbar = new SharedToolbar(ctx);
            ctx.domManager.addChild('canvas-overlay', 'shared-toolbar', this.sharedToolbar.getElement());
        }

        return this.sharedToolbar as SharedToolbar<ButtonOptions>;
    }
}
