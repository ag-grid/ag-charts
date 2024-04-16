import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import type { BBox } from '../../scene/bbox';
import { createElement, injectStyle } from '../../util/dom';
import { ObserveChanges } from '../../util/proxy';
import { BOOLEAN, Validate } from '../../util/validation';
import type { ToolbarGroupToggledEvent } from '../interaction/toolbarManager';
import { ToolbarGroupProperties } from './toolbarProperties';
import * as styles from './toolbarStyles';
import {
    TOOLBAR_ALIGNMENTS,
    TOOLBAR_GROUPS,
    TOOLBAR_POSITIONS,
    type ToolbarButton,
    type ToolbarGroup,
    type ToolbarPosition,
} from './toolbarTypes';

export class Toolbar extends BaseModuleInstance implements ModuleInstance {
    @ObserveChanges<Toolbar>((target) => {
        target.toggleVisibilities();
    })
    @Validate(BOOLEAN)
    public enabled = true;

    public annotations = new ToolbarGroupProperties(
        this.onGroupChanged.bind(this, 'annotations'),
        this.onGroupButtonsChanged.bind(this, 'annotations')
    );
    public ranges = new ToolbarGroupProperties(
        this.onGroupChanged.bind(this, 'ranges'),
        this.onGroupButtonsChanged.bind(this, 'ranges')
    );

    private margin = 10;
    private readonly container: HTMLElement;

    private fixed: Record<ToolbarPosition, HTMLElement>;

    private positions: Record<ToolbarPosition, Set<ToolbarGroup>> = {
        top: new Set(),
        right: new Set(),
        bottom: new Set(),
        left: new Set(),
    };

    private groupCallers: Record<ToolbarGroup, number> = {
        annotations: 0,
        ranges: 0,
    };

    private groupButtons: Record<ToolbarGroup, Array<HTMLButtonElement>> = {
        annotations: [],
        ranges: [],
    };

    constructor(private readonly ctx: ModuleContext) {
        super();

        this.container = ctx.toolbarManager.element;
        this.fixed = {
            top: this.container.appendChild(createElement('div')),
            right: this.container.appendChild(createElement('div')),
            bottom: this.container.appendChild(createElement('div')),
            left: this.container.appendChild(createElement('div')),
        };

        injectStyle(styles.css, styles.block);

        this.renderToolbar('top');
        this.renderToolbar('right');
        this.renderToolbar('bottom');
        this.renderToolbar('left');

        this.toggleVisibilities();

        this.destroyFns.push(
            ctx.toolbarManager.addListener('group-toggled', this.onGroupToggled.bind(this)),
            ctx.layoutService.addListener('layout-complete', this.onLayoutComplete.bind(this))
        );
    }

    private onGroupChanged(group: ToolbarGroup) {
        if (this[group] == null) return;

        for (const position of TOOLBAR_POSITIONS) {
            if (this[group].enabled && this[group].position === position) {
                this.positions[position].add(group);
            } else {
                this.positions[position].delete(group);
            }
        }

        this.toggleVisibilities();
    }

    private onGroupButtonsChanged(group: ToolbarGroup, buttons?: Array<ToolbarButton>) {
        if (!this.enabled) return;

        const align = this[group].align ?? 'start';
        const position = this[group].position ?? 'top';
        const toolbar = this.fixed[position as ToolbarPosition];

        for (const options of buttons ?? []) {
            const button = this.createButtonElement(group, options);
            const parent = toolbar.getElementsByClassName(styles.elements[align]).item(0);
            parent?.appendChild(button);
            this.groupButtons[group].push(button);
        }
    }

    private onLayoutComplete() {
        for (const position of TOOLBAR_POSITIONS) {
            this.fixed[position].classList.remove(styles.modifiers.preventFlash);
        }
    }

    private onGroupToggled(event: ToolbarGroupToggledEvent) {
        const { group, visible } = event;

        if (visible) {
            this.groupCallers[group] += 1;
        } else {
            this.groupCallers[group] = Math.max(0, this.groupCallers[group] - 1);
        }

        this.toggleVisibilities();
    }

    async performLayout({ shrinkRect }: { shrinkRect: BBox }): Promise<{ shrinkRect: BBox }> {
        const { fixed, margin } = this;

        if (!fixed.top.classList.contains(styles.modifiers.hidden)) {
            shrinkRect.shrink(fixed.top.offsetHeight + margin * 2, 'top');
        }

        if (!fixed.right.classList.contains(styles.modifiers.hidden)) {
            shrinkRect.shrink(fixed.right.offsetWidth + margin, 'right');
        }

        if (!fixed.bottom.classList.contains(styles.modifiers.hidden)) {
            shrinkRect.shrink(fixed.bottom.offsetHeight + margin * 2, 'bottom');
        }

        if (!fixed.left.classList.contains(styles.modifiers.hidden)) {
            shrinkRect.shrink(fixed.left.offsetWidth + margin, 'left');
        }

        return { shrinkRect };
    }

    async performCartesianLayout(opts: { seriesRect: BBox }): Promise<void> {
        const { fixed, margin } = this;
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

    private toggleVisibilities() {
        if (this.fixed == null) return;

        const isGroupVisible = (group: ToolbarGroup) => this[group].enabled && this.groupCallers[group] > 0;

        for (const position of TOOLBAR_POSITIONS) {
            const visible = this.enabled && Array.from(this.positions[position].values()).some(isGroupVisible);
            this.fixed[position].classList.toggle(styles.modifiers.hidden, !visible);
        }

        for (const group of TOOLBAR_GROUPS) {
            if (this[group] == null) continue;

            const visible = isGroupVisible(group);
            for (const button of this.groupButtons[group]) {
                button.classList.toggle(styles.modifiers.button.hidden, !visible);
            }
        }
    }

    private renderToolbar(position: ToolbarPosition = 'top') {
        const element = this.fixed[position];
        element.classList.add(styles.block, styles.modifiers[position], styles.modifiers.preventFlash);

        for (const align of TOOLBAR_ALIGNMENTS) {
            const alignmentElement = createElement('div');
            alignmentElement.classList.add(styles.elements[align]);
            element.appendChild(alignmentElement);
        }
    }

    private createButtonElement(group: ToolbarGroup, options: ToolbarButton) {
        const button = createElement('button');
        button.classList.add(styles.elements.button);
        button.dataset.toolbarGroup = group;

        let inner = '';

        if (options.icon != null) {
            inner = `<span class="${styles.elements.icon}">${options.icon}</span>`;
        }

        if (options.label != null) {
            inner = `${inner}<span class="${styles.elements.label}">${options.label}</span>`;
        }

        button.innerHTML = inner;
        button.onclick = this.onButtonPress.bind(this, group, options.value);

        this.destroyFns.push(() => button.remove());

        return button;
    }

    private onButtonPress(group: ToolbarGroup, value: any) {
        this.ctx.toolbarManager.pressButton(group, value);
    }
}
