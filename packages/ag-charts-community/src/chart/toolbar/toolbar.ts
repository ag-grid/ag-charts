import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import type { BBox } from '../../scene/bbox';
import { createElement, injectStyle } from '../../util/dom';
import { BOOLEAN, Validate } from '../../util/validation';
import type { ToolbarGroup } from '../interaction/toolbarManager';
import { ToolbarGroupProperties } from './toolbarProperties';
import * as styles from './toolbarStyles';
import { TOOLBAR_POSITIONS, type ToolbarPosition } from './toolbarTypes';

export class Toolbar extends BaseModuleInstance implements ModuleInstance {
    @Validate(BOOLEAN)
    public enabled = true;

    public annotations = new ToolbarGroupProperties(
        this.toggleGroup.bind(this, 'annotations'),
        this.onGroupButtonsChanged.bind(this, 'annotations')
    );
    public ranges = new ToolbarGroupProperties(
        this.toggleGroup.bind(this, 'ranges'),
        this.onGroupButtonsChanged.bind(this, 'ranges')
    );

    private margin = 10;
    private readonly container: HTMLElement;
    private elements: {
        fixed: Record<ToolbarPosition, HTMLDivElement>;
        floating?: Record<'top' | 'bottom', HTMLDivElement>;
    };

    private positions: Record<ToolbarPosition, Set<ToolbarGroup>> = {
        top: new Set(),
        right: new Set(),
        bottom: new Set(),
        left: new Set(),
    };

    constructor(private readonly ctx: ModuleContext) {
        super();

        this.container = ctx.toolbarManager.element;
        this.elements = {
            fixed: {
                top: this.container.appendChild(createElement('div')),
                right: this.container.appendChild(createElement('div')),
                bottom: this.container.appendChild(createElement('div')),
                left: this.container.appendChild(createElement('div')),
            },
        };

        injectStyle(styles.css, 'toolbar');

        this.renderToolbar('top');
        this.renderToolbar('right');
        this.renderToolbar('bottom');
        this.renderToolbar('left');

        this.toggleToolbarVisibility('top', false);
        this.toggleToolbarVisibility('right', false);
        this.toggleToolbarVisibility('bottom', false);
        this.toggleToolbarVisibility('left', false);

        this.destroyFns.push(
            ctx.toolbarManager.addListener('group-toggled', (event) => {
                this.toggleGroup(event.group, event.visible);
            })
        );
    }

    private onGroupButtonsChanged(group: ToolbarGroup, buttons: ToolbarGroupProperties['buttons']) {
        const position = this[group].position ?? 'top';
        const toolbar = this.elements.fixed[position as ToolbarPosition];

        for (const options of buttons ?? []) {
            const button = this.createButtonElement(group, options);
            toolbar.appendChild(button);
        }
    }

    private toggleGroup(group: ToolbarGroup, enabled?: boolean) {
        if (this[group] == null) return;

        for (const position of TOOLBAR_POSITIONS) {
            if (enabled && this[group].position === position) {
                this.positions[position].add(group);
            } else {
                this.positions[position].delete(group);
            }

            this.toggleToolbarVisibility(position, this.positions[position].size > 0);
        }

        const buttons = this.elements.fixed[this[group].position].children;
        for (let i = 0; i < buttons.length; i++) {
            const child = buttons[i];
            if (!(child instanceof HTMLDivElement)) continue;
            if (child.dataset.toolbarGroup === group) {
                child.classList.toggle(styles.modifiers.button.hidden, !enabled);
            }
        }
    }

    async performLayout({ shrinkRect }: { shrinkRect: BBox }): Promise<{ shrinkRect: BBox }> {
        const {
            container,
            elements: { fixed },
            margin,
        } = this;

        container.style.visibility = 'visible';

        if (fixed.top.style.visibility !== 'hidden') {
            shrinkRect.shrink(fixed.top.offsetHeight + margin * 2, 'top');
        }

        if (fixed.right.style.visibility !== 'hidden') {
            shrinkRect.shrink(fixed.right.offsetWidth + margin, 'right');
        }

        if (fixed.bottom.style.visibility !== 'hidden') {
            shrinkRect.shrink(fixed.bottom.offsetHeight + margin * 2, 'bottom');
        }

        if (fixed.left.style.visibility !== 'hidden') {
            shrinkRect.shrink(fixed.left.offsetWidth + margin, 'left');
        }

        return { shrinkRect };
    }

    async performCartesianLayout(opts: { seriesRect: BBox }): Promise<void> {
        const {
            elements: { fixed },
            margin,
        } = this;
        const { seriesRect } = opts;

        fixed.top.style.top = `${seriesRect.y - fixed.top.offsetHeight - margin * 2}px`;
        fixed.top.style.left = `${margin}px`;
        fixed.top.style.width = `calc(100% - ${margin * 2}px)`;

        fixed.right.style.top = `${seriesRect.y + margin}px`;
        fixed.right.style.right = `${margin}px`;
        fixed.right.style.height = `calc(100% - ${seriesRect.y + margin * 2}px)`;

        fixed.bottom.style.bottom = `${margin}px`;
        fixed.bottom.style.left = `${margin}px`;
        fixed.bottom.style.width = `calc(100% - ${margin * 2}px)`;

        fixed.left.style.top = `${seriesRect.y}px`;
        fixed.left.style.left = `${margin}px`;
        fixed.left.style.height = `calc(100% - ${seriesRect.y + margin * 2}px)`;
    }

    private toggleToolbarVisibility(position: ToolbarPosition = 'top', visible = true) {
        this.elements.fixed[position].style.visibility = visible ? 'visible' : 'hidden';
    }

    private renderToolbar(position: ToolbarPosition = 'top') {
        const element = this.elements.fixed[position];
        element.classList.add(styles.block, styles.modifiers[position]);
    }

    private createButtonElement(group: ToolbarGroup, options: { label: string; value: any }) {
        const button = createElement('button');
        button.classList.add(styles.elements.button);
        button.classList.toggle(styles.modifiers.button.hidden, !this[group].enabled);
        button.dataset.toolbarGroup = group;
        button.innerHTML = options.label;
        button.onclick = this.onButtonPress.bind(this, group, options.value);

        this.destroyFns.push(() => button.remove());

        return button;
    }

    private onButtonPress(group: ToolbarGroup, value: any) {
        this.ctx.toolbarManager.pressButton(group, value);
    }
}
