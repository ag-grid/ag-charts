import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import { Group } from '../../scene/group';
import { Rect } from '../../scene/shape/rect';
import { ProxyPropertyOnWrite } from '../../util/proxy';
import { BOOLEAN, OPT_COLOR_STRING, Validate } from '../../util/validation';
import { Layers } from '../layers';
import type { LayoutCompleteEvent } from '../layout/layoutService';

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
        this.destroyFns.push(
            () => ctx.scene.root?.removeChild(this.node),
            ctx.layoutService.addListener('layout-complete', this.onLayoutComplete)
        );
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
