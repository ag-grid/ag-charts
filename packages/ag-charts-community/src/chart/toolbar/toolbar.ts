import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import type { BBox } from '../../scene/bbox';
import type { InteractionEvent } from '../interaction/interactionManager';
import type { ToolbarEvent } from '../interaction/toolbarManager';
import { ToolbarButton } from './scenes/toolbarButton';
import { ToolbarContainer } from './scenes/toolbarContainer';

export class Toolbar extends BaseModuleInstance implements ModuleInstance {
    public enabled = true;

    private y = 0;
    private height = 30;
    private margin = 10;

    private activeButton?: string;
    private buttonNodes = new Map<string, string>();
    private buttonOffsetX = 0;
    private buttonSpacingX = 10;

    private container = new ToolbarContainer();

    constructor(private readonly ctx: ModuleContext) {
        super();

        this.container.visible = false;

        const toolbarRegion = ctx.regionManager.addRegion('toolbar', this.container);
        this.destroyFns.push(
            ctx.scene.attachNode(this.container),
            toolbarRegion.addListener('hover', this.onHover.bind(this)),
            toolbarRegion.addListener('leave', this.onHover.bind(this)),
            toolbarRegion.addListener('click', this.onClick.bind(this)),
            ctx.toolbarManager.addListener('visibility', this.onVisibility.bind(this)),
            ctx.toolbarManager.addListener('button-added', this.onButtonAdded.bind(this)),
            ctx.toolbarManager.addListener('button-removed', this.onButtonRemoved.bind(this))
        );
    }

    async performLayout({ shrinkRect }: { shrinkRect: BBox }): Promise<{ shrinkRect: BBox }> {
        if (this.container.visible) {
            const toolbarTotalHeight = this.height + this.margin;
            shrinkRect.shrink(toolbarTotalHeight, 'top');
            this.y = shrinkRect.y - this.height - this.margin;
        } else {
            this.y = 0;
        }

        return { shrinkRect };
    }

    async performCartesianLayout(opts: { seriesRect: BBox }): Promise<void> {
        const { x, width } = opts.seriesRect;

        if (this.container.visible) {
            const { y, height } = this;
            this.layoutNodes(x, y, width, height);
        }
    }

    private onHover({ offsetX, offsetY }: InteractionEvent<'hover' | 'leave'>) {
        this.activeButton = undefined;

        if (!this.container.visible) return;

        for (const button of this.container.children) {
            if (button.containsPoint(offsetX, offsetY)) {
                this.activeButton = this.buttonNodes.get(button.id);
                break;
            }
        }

        if (this.activeButton == null) {
            this.ctx.cursorManager.updateCursor('rangeButtons');
        } else {
            this.ctx.cursorManager.updateCursor('rangeButtons', 'pointer');
        }
    }

    private onClick() {
        if (!this.container.visible || this.activeButton == null) return;
        this.ctx.toolbarManager.pressButton(this.activeButton);
    }

    private onVisibility({ visible }: ToolbarEvent<'visibility'>) {
        this.container.visible = visible;
    }

    private onButtonAdded({ id, options }: ToolbarEvent<'button-added'>) {
        const button = new ToolbarButton({
            label: options.label,
            width: 32,
            height: 20,
        });

        button.translationX = this.buttonOffsetX;
        this.buttonOffsetX += button.computeBBox().width + this.buttonSpacingX;

        this.buttonNodes.set(button.id, id);

        this.container.append(button);
    }

    private onButtonRemoved({ id }: ToolbarEvent<'button-removed'>) {
        const child = this.container.children.find((c) => this.buttonNodes.get(c.id) === id);
        if (child) {
            this.buttonOffsetX -= child.getCachedBBox().width + this.buttonSpacingX;
            this.container.removeChild(child);
        }
    }

    private layoutNodes(x: number, y: number, _width: number, _height: number) {
        this.container.translationX = x;
        this.container.translationY = y;
    }
}
