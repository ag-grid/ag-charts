import { _ModuleSupport } from 'ag-charts-community';
import { ColorPicker } from 'ag-charts-community/src/components/color-picker/colorPicker';

const { MenuPopover, ToolbarPopover } = _ModuleSupport;

/**
 * A draggable popover containing a toolbar of buttons and controls for editing an annotation.
 */
export class AnnotationOptionsToolbar extends ToolbarPopover implements HierarchyProvider {
    constructor(ctx: _ModuleSupport.ModuleContext) {
        super(ctx, 'annotation-options');
    }

    show() {
        this.colorPicker = new ColorPicker(this.ctx);
        this.fontSizeMenu = new MenuPopover(this.ctx, 'text-menu');

        this.showWithChildren();

        this.ctx.domHierarchyManager.attach(this);
        this.hideFns.push(() => this.ctx.domHierarchyManager.remove(this));
    }

    getHierarchyChildren() {
        return [this.colorPicker, this.fontSizeMenu];
    }
}
