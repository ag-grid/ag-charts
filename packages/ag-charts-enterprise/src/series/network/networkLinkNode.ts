import { Path, TranslatableGroup } from 'ag-charts-core';

import { applyStrokeStyles } from '../organization/organizationUtils';

export class NetworkLinkNode<TDatum> extends TranslatableGroup<TDatum> {
    /** Whether the link has no place in the layout, as when its parent is collapsed. */
    hidden = false;
    /** Whether the link lies outside the viewport, which the series leaves undrawn. */
    culled = false;

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
