import { _ModuleSupport, _Util, _Scene } from 'ag-charts-community';
import type { BackgroundImage } from './backgroundImage';

const { ActionOnSet, Validate, ProxyPropertyOnWrite, BOOLEAN, OPT_COLOR_STRING, Layers } = _ModuleSupport;
const { Group, Rect } = _Scene;

export class Background extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    private node: _Scene.Group;
    private rectNode: _Scene.Rect;
    private updateService: _ModuleSupport.UpdateService;

    @Validate(BOOLEAN)
    @ProxyPropertyOnWrite('node', 'visible')
    visible: boolean;

    @Validate(OPT_COLOR_STRING)
    @ProxyPropertyOnWrite('rectNode', 'fill')
    fill: string | undefined;

    @ActionOnSet<Background>({
        newValue(image: BackgroundImage) {
            this.node.appendChild(image.node);
            image.onload = this.onImageLoad;
        },
        oldValue(image: BackgroundImage) {
            this.node.removeChild(image.node);
            image.onload = undefined;
        },
    })
    image: BackgroundImage | undefined = undefined;

    constructor(ctx: _ModuleSupport.ModuleContext) {
        super();

        this.updateService = ctx.updateService;

        this.node = new Group({ name: 'background', zIndex: Layers.SERIES_BACKGROUND_ZINDEX });
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

    private onLayoutComplete = (event: _ModuleSupport.LayoutCompleteEvent) => {
        const { width, height } = event.chart;
        this.rectNode.width = width;
        this.rectNode.height = height;
        if (this.image) {
            this.image.performLayout(width, height);
        }
    };

    private onImageLoad = () => {
        this.updateService.update(_ModuleSupport.ChartUpdateType.SCENE_RENDER);
    };
}
