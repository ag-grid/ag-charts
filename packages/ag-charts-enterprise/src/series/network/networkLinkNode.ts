import { Path, TranslatableGroup } from 'ag-charts-core';

import { applyStrokeStyles } from '../organization/organizationUtils';

export class NetworkLinkNode<TDatum> extends TranslatableGroup<TDatum> {
    private pathNode?: Path;

    update(styles: any) {
        this.pathNode ??= this.appendChild(new Path());

        this.pathNode.visible = false;
        this.pathNode.fill = 'transparent';

        applyStrokeStyles(this.pathNode, styles);
    }

    getPath() {
        return this.pathNode;
    }
}
