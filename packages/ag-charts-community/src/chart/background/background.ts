import { Rect } from '../../scene/shape/rect';
import { Group } from '../../scene/group';
import type { ModuleInstance } from '../../util/module';
import { BaseModuleInstance } from '../../util/module';
import type { ModuleContext } from '../../util/moduleContext';
import { ProxyPropertyOnWrite } from '../../util/proxy';
import { BOOLEAN, OPT_COLOR_STRING, Validate } from '../../util/validation';
import type { LayoutCompleteEvent } from '../layout/layoutService';
import { Layers } from '../layers';

export class Background extends BaseModuleInstance implements ModuleInstance {
    private node: Group;
    private rectNode: Rect;

    constructor(ctx: ModuleContext) {
        super();

        this.node = new Group({ name: 'background' });
        this.node.zIndex = Layers.SERIES_BACKGROUND_ZINDEX;
        this.rectNode = new Rect();
        this.node.appendChild(this.rectNode);
        this.fill = 'white';
        this.visible = true;

        ctx.scene.root?.appendChild(this.node);
        this.destroyFns.push(() => ctx.scene.root?.removeChild(this.node));

        const layoutHandle = ctx.layoutService.addListener('layout-complete', this.onLayoutComplete);
        this.destroyFns.push(() => ctx.layoutService.removeListener(layoutHandle));
    }

    @Validate(BOOLEAN)
    @ProxyPropertyOnWrite('node', 'visible')
    visible: boolean;

    @Validate(OPT_COLOR_STRING)
    @ProxyPropertyOnWrite('rectNode', 'fill')
    fill: string | undefined;

    private onLayoutComplete = (e: LayoutCompleteEvent) => {
        const { width, height } = e.chart;
        this.rectNode.width = width;
        this.rectNode.height = height;
    };
}
