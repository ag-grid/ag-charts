import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import { Group } from '../../scene/group';
import { Rect } from '../../scene/shape/rect';
import { Text } from '../../scene/shape/text';
import { ProxyPropertyOnWrite } from '../../util/proxy';
import { BOOLEAN, COLOR_STRING, OBJECT, STRING, Validate } from '../../util/validation';
import type { LayoutCompleteEvent } from '../layout/layoutManager';
import { zIndexMap } from '../zIndexMap';

export class Background<TImage = never> extends BaseModuleInstance implements ModuleInstance {
    protected readonly node;
    protected readonly rectNode = new Rect();
    protected readonly textNode = new Text();

    @Validate(BOOLEAN)
    @ProxyPropertyOnWrite('node', 'visible')
    visible: boolean;

    @Validate(COLOR_STRING, { optional: true })
    @ProxyPropertyOnWrite('rectNode', 'fill')
    fill?: string = 'white';

    // placeholder for enterprise module
    @Validate(OBJECT, { optional: true })
    image?: TImage;

    // placeholder for enterprise module
    @Validate(STRING, { optional: true })
    @ProxyPropertyOnWrite('textNode')
    text?: string;

    constructor(
        ctx: ModuleContext,
        private readonly zIndex: number = zIndexMap.SERIES_BACKGROUND,
        private readonly layer: boolean = false
    ) {
        super();

        this.node = new Group({ name: 'background', zIndex: this.zIndex, layer: this.layer });

        this.node.append([this.rectNode, this.textNode]);

        this.visible = true;

        this.destroyFns.push(
            ctx.scene.attachNode(this.node),
            ctx.layoutManager.addListener('layout:complete', (e) => this.onLayoutComplete(e))
        );
    }

    protected onLayoutComplete(e: LayoutCompleteEvent) {
        const { width, height } = e.chart;
        this.rectNode.width = width;
        this.rectNode.height = height;
    }
}
