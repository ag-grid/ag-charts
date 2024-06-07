import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import type { AgToolbarGroupPosition } from '../../options/agChartOptions';
import type { BBox } from '../../scene/bbox';
import { createElement } from '../../util/dom';
import { initToolbarKeyNav, makeAccessibleClickListener } from '../../util/keynavUtil';
import { ObserveChanges } from '../../util/proxy';
import { BOOLEAN, Validate } from '../../util/validation';
import { InteractionState, type PointerInteractionEvent } from '../interaction/interactionManager';
import type {
    ToolbarButtonToggledEvent,
    ToolbarFloatingAnchorChangedEvent,
    ToolbarGroupToggledEvent,
    ToolbarProxyGroupOptionsEvent,
} from '../interaction/toolbarManager';
import { ToolbarGroupProperties } from './toolbarProperties';
import * as styles from './toolbarStyles';
import {
    TOOLBAR_ALIGNMENTS,
    TOOLBAR_GROUPS,
    TOOLBAR_POSITIONS,
    type ToolbarAlignment,
    type ToolbarButton,
    type ToolbarGroup,
    ToolbarPosition,
    isAnimatingFloatingPosition,
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
    public annotationOptions = new ToolbarGroupProperties(
        this.onGroupChanged.bind(this, 'annotationOptions'),
        this.onGroupButtonsChanged.bind(this, 'annotationOptions')
    );
    public ranges = new ToolbarGroupProperties(
        this.onGroupChanged.bind(this, 'ranges'),
        this.onGroupButtonsChanged.bind(this, 'ranges')
    );
    public zoom = new ToolbarGroupProperties(
        this.onGroupChanged.bind(this, 'zoom'),
        this.onGroupButtonsChanged.bind(this, 'zoom')
    );

    private readonly margin = 10;
    private readonly floatingDetectionRange = 28;

    private readonly elements: Record<ToolbarPosition, HTMLElement>;

    private readonly positions: Record<ToolbarPosition, Set<ToolbarGroup>> = {
        [ToolbarPosition.Top]: new Set(),
        [ToolbarPosition.Right]: new Set(),
        [ToolbarPosition.Bottom]: new Set(),
        [ToolbarPosition.Left]: new Set(),
        [ToolbarPosition.Floating]: new Set(),
        [ToolbarPosition.FloatingTop]: new Set(),
        [ToolbarPosition.FloatingBottom]: new Set(),
    };

    private readonly positionAlignments: Record<ToolbarPosition, Partial<Record<ToolbarAlignment, HTMLElement>>> = {
        [ToolbarPosition.Top]: {},
        [ToolbarPosition.Right]: {},
        [ToolbarPosition.Bottom]: {},
        [ToolbarPosition.Left]: {},
        [ToolbarPosition.Floating]: {},
        [ToolbarPosition.FloatingTop]: {},
        [ToolbarPosition.FloatingBottom]: {},
    };

    private readonly groupCallers: Record<ToolbarGroup, Set<string>> = {
        annotations: new Set(),
        annotationOptions: new Set(),
        ranges: new Set(),
        zoom: new Set(),
    };

    private groupButtons: Record<ToolbarGroup, Array<HTMLButtonElement>> = {
        annotations: [],
        annotationOptions: [],
        ranges: [],
        zoom: [],
    };

    private groupDestroyFns: Record<ToolbarGroup, Array<() => void>> = {
        annotations: [],
        annotationOptions: [],
        ranges: [],
        zoom: [],
    };

    private pendingButtonToggledEvents: Array<ToolbarButtonToggledEvent> = [];

    private readonly groupProxied = new Set<ToolbarGroup>();
    private hasNewLocale = true;

    constructor(private readonly ctx: ModuleContext) {
        super();

        ctx.domManager.addStyles(styles.block, styles.css);

        this.elements = {} as Record<ToolbarPosition, HTMLElement>;
        for (const position of TOOLBAR_POSITIONS) {
            this.elements[position] = ctx.domManager.addChild('canvas-overlay', `toolbar-${position}`);
            this.renderToolbar(position);
        }
        this.toggleVisibilities();

        this.destroyFns.push(
            ctx.interactionManager.addListener('hover', this.onHover.bind(this), InteractionState.All),
            ctx.interactionManager.addListener('leave', this.onLeave.bind(this), InteractionState.All),
            ctx.toolbarManager.addListener('button-toggled', this.onButtonToggled.bind(this)),
            ctx.toolbarManager.addListener('group-toggled', this.onGroupToggled.bind(this)),
            ctx.toolbarManager.addListener('floating-anchor-changed', this.onFloatingAnchorChanged.bind(this)),
            ctx.toolbarManager.addListener('proxy-group-options', this.onProxyGroupOptions.bind(this)),
            ctx.layoutService.addListener('layout-complete', this.onLayoutComplete.bind(this)),
            ctx.localeManager.addListener('locale-changed', () => {
                this.hasNewLocale = true;
            }),
            () => this.destroyElements()
        );
    }

    private destroyElements() {
        this.ctx.domManager.removeStyles(styles.block);
        for (const element of Object.keys(this.elements)) {
            this.ctx.domManager.removeChild('canvas-overlay', `toolbar-${element}`);
        }
    }

    private onHover(event: PointerInteractionEvent<'hover'>) {
        const {
            enabled,
            elements,
            floatingDetectionRange,
            ctx: { scene },
        } = this;
        const {
            offsetY,
            sourceEvent: { target },
        } = event;
        const { FloatingBottom, FloatingTop } = ToolbarPosition;

        if (!enabled) return;

        const bottom = elements[FloatingBottom];
        const top = elements[FloatingTop];

        const bottomDetectionY = bottom.offsetTop - floatingDetectionRange;
        const bottomVisible =
            (offsetY > bottomDetectionY && offsetY < scene.canvas.element.offsetHeight) || target === bottom;

        const topDetectionY = top.offsetTop + top.offsetHeight + floatingDetectionRange;
        const topVisible = (offsetY > 0 && offsetY < topDetectionY) || target === top;

        this.translateFloatingElements(FloatingBottom, bottomVisible);
        this.translateFloatingElements(FloatingTop, topVisible);
    }

    private onLeave(event: PointerInteractionEvent<'leave'>) {
        const {
            enabled,
            ctx: { scene },
        } = this;
        const { relatedElement, targetElement } = event;
        const { FloatingBottom, FloatingTop } = ToolbarPosition;

        if (!enabled || targetElement !== scene.canvas.element) return;

        const isTargetButton = TOOLBAR_GROUPS.some((group) =>
            this.groupButtons[group].some((button) => button === relatedElement)
        );
        if (isTargetButton) return;

        this.translateFloatingElements(FloatingBottom, false);
        this.translateFloatingElements(FloatingTop, false);
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
        const { group, value, active, enabled, visible } = event;

        if (this.groupButtons[group].length === 0) {
            this.pendingButtonToggledEvents.push(event);
            return;
        }

        for (const button of this.groupButtons[group]) {
            if (button.dataset.toolbarValue !== `${value}`) continue;
            button.ariaDisabled = `${!enabled}`;
            button.classList.toggle(styles.modifiers.button.hiddenToggled, !visible);
            button.classList.toggle(styles.modifiers.button.active, active);
        }
    }

    private onGroupToggled(event: ToolbarGroupToggledEvent) {
        const { caller, group, visible } = event;

        this.toggleGroup(caller, group, visible);
        this.toggleVisibilities();
    }

    private onFloatingAnchorChanged(event: ToolbarFloatingAnchorChangedEvent) {
        const { group, anchor } = event;

        if (!this.positions[ToolbarPosition.Floating].has(group)) return;

        const element = this.elements[ToolbarPosition.Floating];
        element.style.top = `${anchor.y - element.offsetHeight - this.margin}px`;
        element.style.left = `${anchor.x - element.offsetWidth / 2}px`;
    }

    private onProxyGroupOptions(event: ToolbarProxyGroupOptionsEvent) {
        const { caller, group, options } = event;

        this.groupProxied.add(group);

        this.createGroup(group, options.enabled, options.position);
        this.createGroupButtons(group, options.buttons);
        this.toggleGroup(caller, group, options.enabled);

        this[group].set(options);
    }

    private createGroup(group: ToolbarGroup, enabled?: boolean, position?: AgToolbarGroupPosition) {
        enabled ??= this[group].enabled;
        position ??= this[group].position;

        for (const pos of TOOLBAR_POSITIONS) {
            if (enabled && position === pos) {
                this.positions[pos].add(group);
            } else {
                this.positions[pos].delete(group);
            }
        }
    }

    private createGroupButtons(group: ToolbarGroup, buttons?: Array<ToolbarButton>) {
        for (const button of this.groupButtons[group]) {
            button.remove();
        }
        this.groupButtons[group] = [];
        this.groupDestroyFns[group].forEach((d) => d());
        this.groupDestroyFns[group] = [];

        const align = this[group].align ?? 'start';
        const position = this[group].position ?? 'top';
        const parent = this.positionAlignments[position][align];

        if (!parent) return;

        for (const options of buttons ?? []) {
            const button = this.createButtonElement(group, options);
            parent.appendChild(button);
            this.groupButtons[group].push(button);
        }

        let onFocus;
        let onBlur;

        if (isAnimatingFloatingPosition(position)) {
            onFocus = () => this.translateFloatingElements(position, true);
            onBlur = () => this.translateFloatingElements(position, false);
        }

        this.groupDestroyFns[group] = initToolbarKeyNav({
            orientation: 'horizontal',
            toolbar: parent,
            buttons: this.groupButtons[group],
            onFocus,
            onBlur,
        });
    }

    private toggleGroup(caller: string, group: ToolbarGroup, enabled?: boolean) {
        if (enabled) {
            this.groupCallers[group].add(caller);
        } else {
            this.groupCallers[group].delete(caller);
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

        if (this.hasNewLocale) {
            this.groupButtons.annotations.forEach((button, index) => {
                this.updateButtonText(button, this.annotations.buttons![index]);
            });
            this.groupButtons.annotationOptions.forEach((button, index) => {
                this.updateButtonText(button, this.annotationOptions.buttons![index]);
            });
            this.groupButtons.ranges.forEach((button, index) => {
                this.updateButtonText(button, this.ranges.buttons![index]);
            });
            this.groupButtons.zoom.forEach((button, index) => {
                this.updateButtonText(button, this.zoom.buttons![index]);
            });
            this.hasNewLocale = false;
        }

        return { shrinkRect };
    }

    async performCartesianLayout(opts: { seriesRect: BBox }): Promise<void> {
        const { elements, margin } = this;
        const { seriesRect } = opts;
        const { FloatingBottom, FloatingTop } = ToolbarPosition;

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

        elements[FloatingTop].style.top = `${seriesRect.y}px`;

        elements[FloatingBottom].style.top =
            `${seriesRect.y + seriesRect.height - elements[FloatingBottom].offsetHeight}px`;
    }

    private toggleVisibilities() {
        if (this.elements == null) return;

        const isGroupVisible = (group: ToolbarGroup) => this[group].enabled && this.groupCallers[group].size > 0;
        const isButtonVisible = (element: HTMLButtonElement) => (button: ToolbarButton) =>
            (typeof button.value !== 'string' && typeof button.value !== 'number') ||
            `${button.value}` === element.dataset.toolbarValue;

        for (const position of TOOLBAR_POSITIONS) {
            const visible = this.enabled && Array.from(this.positions[position].values()).some(isGroupVisible);
            this.elements[position].classList.toggle(styles.modifiers.hidden, !visible);
        }

        for (const group of TOOLBAR_GROUPS) {
            if (this[group] == null) continue;

            const groupVisible = isGroupVisible(group);
            for (const button of this.groupButtons[group]) {
                const buttonVisible = groupVisible && this[group].buttons?.some(isButtonVisible(button));
                button.classList.toggle(styles.modifiers.button.hiddenValue, !buttonVisible);
            }
        }
    }

    private translateFloatingElements(
        position: ToolbarPosition.FloatingBottom | ToolbarPosition.FloatingTop,
        visible: boolean
    ) {
        const { elements, margin, positionAlignments } = this;

        const element = elements[position];
        const alignments = Object.values(positionAlignments[position]);
        element.classList.toggle(styles.modifiers.floatingHidden, !visible);

        const dir = position === ToolbarPosition.FloatingBottom ? 1 : -1;

        for (const align of alignments) {
            align.style.transform =
                visible && align.style.transform !== ''
                    ? 'translateY(0)'
                    : `translateY(${(element.offsetHeight + margin) * dir}px)`;
        }
    }

    private renderToolbar(position = ToolbarPosition.Top) {
        const element = this.elements[position];
        element.classList.add(styles.block, styles.modifiers[position], styles.modifiers.preventFlash);

        if (isAnimatingFloatingPosition(position)) {
            element.classList.add(styles.modifiers.floatingHidden);
        }

        for (const align of TOOLBAR_ALIGNMENTS) {
            const alignmentElement = createElement('div');
            alignmentElement.classList.add(styles.elements.align, styles.modifiers.align[align]);
            element.appendChild(alignmentElement);
            this.positionAlignments[position][align] = alignmentElement;
        }
    }

    private createButtonElement(group: ToolbarGroup, options: ToolbarButton) {
        const button = createElement('button');
        button.classList.add(styles.elements.button);
        button.dataset.toolbarGroup = group;
        button.tabIndex = -1;

        if (typeof options.value === 'string' || typeof options.value === 'number') {
            button.dataset.toolbarValue = `${options.value}`;
        }
        button.onclick = makeAccessibleClickListener(button, this.onButtonPress.bind(this, group, options.value));
        this.updateButtonText(button, options);

        this.destroyFns.push(() => button.remove());

        return button;
    }

    private updateButtonText(button: HTMLButtonElement, options: ToolbarButton) {
        if (options.tooltip) {
            const tooltip = this.ctx.localeManager.t(options.tooltip);
            button.title = tooltip;
        }

        let inner = '';

        if (options.icon != null) {
            inner = `<span class="ag-charts-icon-${options.icon} ${styles.elements.icon}"></span>`;
        }

        if (options.label != null) {
            const label = this.ctx.localeManager.t(options.label);
            inner = `${inner}<span class="${styles.elements.label}">${label}</span>`;
        }

        button.innerHTML = inner;
    }

    private onButtonPress(group: ToolbarGroup, value: any) {
        this.ctx.toolbarManager.pressButton(group, value);
    }
}
