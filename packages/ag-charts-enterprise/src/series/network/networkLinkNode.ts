import { _ModuleSupport } from 'ag-charts-community';

import { applyStrokeStyles } from '../organization/organizationUtils';

export class NetworkLinkNode<TDatum> extends _ModuleSupport.TranslatableGroup<TDatum> {
    private pathNode?: _ModuleSupport.Path;

    update(styles: any) {
        this.pathNode ??= this.appendChild(new _ModuleSupport.Path());

        this.pathNode.visible = false;
        this.pathNode.fill = 'transparent';

        applyStrokeStyles(this.pathNode, styles);
    }

    getPath() {
        return this.pathNode;
    }
}
