import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import type { BBox } from '../../scene/bbox';
import { createElement, injectStyle } from '../../util/dom';
import { ObserveChanges } from '../../util/proxy';
import { BOOLEAN, Validate } from '../../util/validation';
import type { PointerInteractionEvent } from '../interaction/interactionManager';
import type {
    ToolbarButtonToggledEvent,
    ToolbarGroupToggledEvent,
    ToolbarProxyGroupOptionsEvent,
} from '../interaction/toolbarManager';
import { ToolbarGroupProperties } from './toolbarProperties';
import * as styles from './toolbarStyles';
import {
    TOOLBAR_ALIGNMENTS,
    TOOLBAR_GROUPS,
    TOOLBAR_POSITIONS,
    type ToolbarButton,
    type ToolbarGroup,
    ToolbarPosition,
} from './toolbarTypes';

export class Toolbar extends BaseModuleInstance implements ModuleInstance {
    @ObserveChanges<Toolbar>((target) => {
        target.processPendingEvents();
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
    public zoom = new ToolbarGroupProperties(
        this.onGroupChanged.bind(this, 'zoom'),
        this.onGroupButtonsChanged.bind(this, 'zoom')
    );

    private margin = 10;
    private floatingDetectionRange = 50;
    private readonly container: HTMLElement;

    private elements: Record<ToolbarPosition, HTMLElement>;

    private positions: Record<ToolbarPosition, Set<ToolbarGroup>> = {
        [ToolbarPosition.Top]: new Set(),
        [ToolbarPosition.Right]: new Set(),
        [ToolbarPosition.Bottom]: new Set(),
        [ToolbarPosition.Left]: new Set(),
        [ToolbarPosition.FloatingTop]: new Set(),
        [ToolbarPosition.FloatingBottom]: new Set(),
    };

    private groupCallers: Record<ToolbarGroup, number> = {
        annotations: 0,
        ranges: 0,
        zoom: 0,
    };

    private groupButtons: Record<ToolbarGroup, Array<HTMLButtonElement>> = {
        annotations: [],
        ranges: [],
        zoom: [],
    };

    private pendingButtonToggledEvents: Array<ToolbarButtonToggledEvent> = [];

    private groupProxied = new Set<ToolbarGroup>();

    constructor(private readonly ctx: ModuleContext) {
        super();

        this.container = ctx.toolbarManager.element;
        this.elements = {
            [ToolbarPosition.Top]: this.container.appendChild(createElement('div')),
            [ToolbarPosition.Right]: this.container.appendChild(createElement('div')),
            [ToolbarPosition.Bottom]: this.container.appendChild(createElement('div')),
            [ToolbarPosition.Left]: this.container.appendChild(createElement('div')),
            [ToolbarPosition.FloatingTop]: this.container.appendChild(createElement('div')),
            [ToolbarPosition.FloatingBottom]: this.container.appendChild(createElement('div')),
        };

        injectStyle(styles.css, styles.block);

        this.renderToolbar(ToolbarPosition.Top);
        this.renderToolbar(ToolbarPosition.Right);
        this.renderToolbar(ToolbarPosition.Bottom);
        this.renderToolbar(ToolbarPosition.Left);
        this.renderToolbar(ToolbarPosition.FloatingTop);
        this.renderToolbar(ToolbarPosition.FloatingBottom);

        this.toggleVisibilities();

        this.destroyFns.push(
            ctx.interactionManager.addListener('hover', this.onHover.bind(this)),
            ctx.toolbarManager.addListener('button-toggled', this.onButtonToggled.bind(this)),
            ctx.toolbarManager.addListener('group-toggled', this.onGroupToggled.bind(this)),
            ctx.toolbarManager.addListener('proxy-group-options', this.onProxyGroupOptions.bind(this)),
            ctx.layoutService.addListener('layout-complete', this.onLayoutComplete.bind(this))
        );
    }

    private onHover(event: PointerInteractionEvent<'hover'>) {
        if (!this.enabled) return;

        const { elements, floatingDetectionRange } = this;
        const { offsetY, sourceEvent } = event;

        const bottomDetectionY = elements[ToolbarPosition.FloatingBottom].offsetTop - floatingDetectionRange;
        const bottomVisible =
            offsetY > bottomDetectionY || sourceEvent.target === elements[ToolbarPosition.FloatingBottom];
        elements[ToolbarPosition.FloatingBottom].classList.toggle(styles.modifiers.floatingHidden, !bottomVisible);

        const topDetectionY =
            elements[ToolbarPosition.FloatingTop].offsetTop +
            elements[ToolbarPosition.FloatingTop].offsetHeight +
            floatingDetectionRange;
        const topVisible = offsetY < topDetectionY || sourceEvent.target === elements[ToolbarPosition.FloatingTop];
        elements[ToolbarPosition.FloatingTop].classList.toggle(styles.modifiers.floatingHidden, !topVisible);
    }

    private onGroupChanged(group: ToolbarGroup) {
        if (this[group] == null || this.groupProxied.has(group)) return;

        this.createGroup(group);
        this.toggleVisibilities();
    }

    private onGroupButtonsChanged(group: ToolbarGroup, buttons?: Array<ToolbarButton>) {
        if (!this.enabled || this.groupProxied.has(group)) return;

        this.createGroupButtons(group, buttons);
        this.toggleVisibilities();
    }

    private onLayoutComplete() {
        for (const position of TOOLBAR_POSITIONS) {
            this.elements[position].classList.remove(styles.modifiers.preventFlash);
        }
    }

    private onButtonToggled(event: ToolbarButtonToggledEvent) {
        const { group, value, enabled } = event;

        if (this.groupButtons[group].length === 0) {
            this.pendingButtonToggledEvents.push(event);
            return;
        }

        for (const button of this.groupButtons[group]) {
            if (button.dataset.toolbarValue !== `${value}`) continue;
            button.disabled = !enabled;
        }
    }

    private onGroupToggled(event: ToolbarGroupToggledEvent) {
        const { group, visible } = event;

        this.toggleGroup(group, visible);
        this.toggleVisibilities();
    }

    private onProxyGroupOptions(event: ToolbarProxyGroupOptionsEvent) {
        const { group, options } = event;

        this.groupProxied.add(group);

        this.createGroup(group);
        this.createGroupButtons(group, options.buttons);
        this.toggleGroup(group, options.enabled);

        this[group].set(options);
    }

    private createGroup(group: ToolbarGroup) {
        for (const position of TOOLBAR_POSITIONS) {
            if (this[group].enabled && this[group].position === position) {
                this.positions[position].add(group);
            } else {
                this.positions[position].delete(group);
            }
        }
    }

    private createGroupButtons(group: ToolbarGroup, buttons?: Array<ToolbarButton>) {
        for (const button of this.groupButtons[group]) {
            button.remove();
        }
        this.groupButtons[group] = [];

        const align = this[group].align ?? 'start';
        const position = this[group].position ?? 'top';
        const toolbar = this.elements[position as ToolbarPosition];

        for (const options of buttons ?? []) {
            const button = this.createButtonElement(group, options);
            const parent = toolbar.getElementsByClassName(styles.modifiers.group[align]).item(0);
            parent?.appendChild(button);
            this.groupButtons[group].push(button);
        }
    }

    private toggleGroup(group: ToolbarGroup, enabled?: boolean) {
        if (enabled) {
            this.groupCallers[group] += 1;
        } else {
            this.groupCallers[group] = Math.max(0, this.groupCallers[group] - 1);
        }
    }

    private processPendingEvents() {
        const pendingButtonToggledEvents = (this.pendingButtonToggledEvents ?? []).slice();

        for (const event of pendingButtonToggledEvents) {
            this.onButtonToggled(event);
        }

        this.pendingButtonToggledEvents = [];
    }

    async performLayout({ shrinkRect }: { shrinkRect: BBox }): Promise<{ shrinkRect: BBox }> {
        const { elements, margin } = this;

        if (!elements.top.classList.contains(styles.modifiers.hidden)) {
            shrinkRect.shrink(elements.top.offsetHeight + margin * 2, 'top');
        }

        if (!elements.right.classList.contains(styles.modifiers.hidden)) {
            shrinkRect.shrink(elements.right.offsetWidth + margin, 'right');
        }

        if (!elements.bottom.classList.contains(styles.modifiers.hidden)) {
            shrinkRect.shrink(elements.bottom.offsetHeight + margin * 2, 'bottom');
        }

        if (!elements.left.classList.contains(styles.modifiers.hidden)) {
            shrinkRect.shrink(elements.left.offsetWidth + margin, 'left');
        }

        return { shrinkRect };
    }

    async performCartesianLayout(opts: { seriesRect: BBox }): Promise<void> {
        const { elements, margin } = this;
        const { seriesRect } = opts;

        elements.top.style.top = `${seriesRect.y - elements.top.offsetHeight - margin * 2}px`;
        elements.top.style.left = `${margin}px`;
        elements.top.style.width = `calc(100% - ${margin * 2}px)`;

        elements.right.style.top = `${seriesRect.y + margin}px`;
        elements.right.style.right = `${margin}px`;
        elements.right.style.height = `calc(100% - ${seriesRect.y + margin * 2}px)`;

        elements.bottom.style.bottom = `${margin}px`;
        elements.bottom.style.left = `${margin}px`;
        elements.bottom.style.width = `calc(100% - ${margin * 2}px)`;

        elements.left.style.top = `${seriesRect.y}px`;
        elements.left.style.left = `${margin}px`;
        elements.left.style.height = `calc(100% - ${seriesRect.y + margin * 2}px)`;

        elements[ToolbarPosition.FloatingTop].style.top = `${seriesRect.y + margin * 4}px`;
        elements[ToolbarPosition.FloatingBottom].style.top =
            `${seriesRect.y + seriesRect.height - elements.top.offsetHeight - margin * 4}px`;
    }

    private toggleVisibilities() {
        if (this.elements == null) return;

        const isGroupVisible = (group: ToolbarGroup) => this[group].enabled && this.groupCallers[group] > 0;
        const isButtonVisible = (element: HTMLButtonElement) => (button: ToolbarButton) =>
            (typeof button.value !== 'string' && typeof button.value !== 'number') ||
            `${button.value}` === element.dataset.toolbarValue;

        for (const position of TOOLBAR_POSITIONS) {
            const visible = this.enabled && Array.from(this.positions[position].values()).some(isGroupVisible);
            this.elements[position].classList.toggle(styles.modifiers.hidden, !visible);
        }

        for (const group of TOOLBAR_GROUPS) {
            if (this[group] == null) continue;

            const visible = isGroupVisible(group);
            for (const button of this.groupButtons[group]) {
                const buttonVisible = visible && this[group].buttons?.some(isButtonVisible(button));
                button.classList.toggle(styles.modifiers.button.hidden, !buttonVisible);
            }
        }
    }

    private renderToolbar(position = ToolbarPosition.Top) {
        const element = this.elements[position];
        element.classList.add(styles.block, styles.modifiers[position], styles.modifiers.preventFlash);

        if (position === ToolbarPosition.FloatingTop || position === ToolbarPosition.FloatingBottom) {
            element.classList.add(styles.modifiers.floatingHidden);
        }

        for (const align of TOOLBAR_ALIGNMENTS) {
            const alignmentElement = createElement('div');
            alignmentElement.classList.add(styles.elements.group, styles.modifiers.group[align]);
            element.appendChild(alignmentElement);
        }
    }

    private createButtonElement(group: ToolbarGroup, options: ToolbarButton) {
        const button = createElement('button');
        button.classList.add(styles.elements.button);
        button.dataset.toolbarGroup = group;

        if (typeof options.value === 'string' || typeof options.value === 'number') {
            button.dataset.toolbarValue = `${options.value}`;
        }

        if (options.tooltip) {
            button.title = options.tooltip;
        }

        let inner = '';

        if (options.icon != null) {
            inner = `<span class="ag-charts-icon ag-charts-icon-${options.icon} ${styles.elements.icon}"></span>`;
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
