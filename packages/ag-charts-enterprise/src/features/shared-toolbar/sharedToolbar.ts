import { _ModuleSupport } from 'ag-charts-community';

import { SharedToolbarWidget } from './sharedToolbarWidget';

export class SharedToolbar extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    private sharedToolbar?: SharedToolbarWidget<_ModuleSupport.ToolbarButtonOptions>;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();
    }

    public getSharedToolbar<ButtonOptions extends _ModuleSupport.ToolbarButtonOptions>() {
        if (!this.sharedToolbar) {
            this.sharedToolbar = new SharedToolbarWidget(this.ctx.localeManager);
            this.ctx.domManager.addChild('canvas-overlay', 'shared-toolbar', this.sharedToolbar.getElement());
        }

        return this.sharedToolbar as SharedToolbarWidget<ButtonOptions>;
    }
}
