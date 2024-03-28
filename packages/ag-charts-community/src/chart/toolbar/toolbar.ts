import { Group } from '../../integrated-charts-scene';
import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import type { BBox } from '../../scene/bbox';
import type { InteractionEvent } from '../interaction/interactionManager';
import type { ToolbarButtonUpdatedEvent } from '../interaction/toolbarManager';
import { ToolbarButton } from './scenes/toolbarButton';
import { ToolbarContainer } from './scenes/toolbarContainer';

interface ButtonConfig {
    id: string;
    groupId: string;
    value: any;
}

export class Toolbar extends BaseModuleInstance implements ModuleInstance {
    public enabled = true;

    private y = 0;
    private height = 30;
    private margin = 10;

    private buttonGroups = new Map<string, Group>();

    private activeButton: ButtonConfig | undefined = undefined;
    private buttons = new Map<ToolbarButton, ButtonConfig>();
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
            ctx.toolbarManager.addListener('button-group-updated', this.onButtonGroupUpdated.bind(this))
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

        for (const [button, config] of this.buttons) {
            if (button.containsPoint(offsetX, offsetY)) {
                this.activeButton = config;
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
        const { id, groupId, value } = this.activeButton;
        this.ctx.toolbarManager.pressButton(id, groupId, value);
    }

    private onButtonGroupUpdated({ id: groupId, buttons }: ToolbarButtonUpdatedEvent) {
        const existingGroup = this.buttonGroups.get(groupId);
        if (existingGroup != null) {
            this.buttons.forEach((config, button) => {
                if (config.groupId === groupId) {
                    this.buttons.delete(button);
                }
            });
            this.container.removeChild(existingGroup);
        }

        const buttonGroup = new Group();

        let buttonOffsetX = 0;
        buttons.forEach(({ id, label, value }) => {
            const button = new ToolbarButton({
                label,
                minWidth: 32,
                height: 20,
                padding: 6,
            });

            button.translationX = buttonOffsetX;
            buttonOffsetX += button.computeBBox().width + this.buttonSpacingX;

            this.buttons.set(button, { id, groupId, value });

            buttonGroup.append(button);
        });

        this.buttonGroups.set(groupId, buttonGroup);
        this.container.appendChild(buttonGroup);

        let buttonGroupOffsetX = 0;
        this.container.children.forEach((group) => {
            group.translationX = buttonGroupOffsetX;
            buttonGroupOffsetX += (group.computeBBox()?.width ?? 0) + this.buttonSpacingX;
        });

        this.container.visible = this.buttons.size > 0;
    }

    private layoutNodes(x: number, y: number, _width: number, _height: number) {
        this.container.translationX = x;
        this.container.translationY = y;
    }
}
