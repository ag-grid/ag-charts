import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import { Group } from '../../scene/group';
import { Rect } from '../../scene/shape/rect';
import { ProxyPropertyOnWrite } from '../../util/proxy';
import { BOOLEAN, OPT_COLOR_STRING, Validate } from '../../util/validation';
import { Layers } from '../layers';
import type { LayoutCompleteEvent } from '../layout/layoutService';

export class Background<TImage = never> extends BaseModuleInstance implements ModuleInstance {
    protected readonly node = new Group({ name: 'background', zIndex: Layers.SERIES_BACKGROUND_ZINDEX });
    protected readonly rectNode = new Rect();

    @Validate(BOOLEAN)
    @ProxyPropertyOnWrite('node', 'visible')
    visible: boolean = true;

    @Validate(OPT_COLOR_STRING)
    @ProxyPropertyOnWrite('rectNode', 'fill')
    fill?: string = 'white';

    // placeholder for enterprise module
    image?: TImage = undefined;

    constructor(ctx: ModuleContext) {
        super();

        this.node.appendChild(this.rectNode);
        ctx.scene.root?.appendChild(this.node);

        this.destroyFns.push(
            () => ctx.scene.root?.removeChild(this.node),
            ctx.layoutService.addListener('layout-complete', (e) => this.onLayoutComplete(e))
        );
    }

    protected onLayoutComplete(e: LayoutCompleteEvent) {
        const { width, height } = e.chart;
        this.rectNode.width = width;
        this.rectNode.height = height;
    }
}
