import type { AgToolbarGroupPosition } from 'ag-charts-types';

import type { LayoutContext, ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import { BBox } from '../../scene/bbox';
import { setAttribute } from '../../util/attributeUtil';
import { createElement } from '../../util/dom';
import { initToolbarKeyNav, makeAccessibleClickListener } from '../../util/keynavUtil';
import { clamp } from '../../util/number';
import { ObserveChanges } from '../../util/proxy';
import { BOOLEAN, Validate } from '../../util/validation';
import { InteractionState, type PointerInteractionEvent } from '../interaction/interactionManager';
import type {
    ToolbarButtonToggledEvent,
    ToolbarButtonUpdatedEvent,
    ToolbarFloatingAnchorChangedEvent,
    ToolbarGroupToggledEvent,
    ToolbarProxyGroupOptionsEvent,
} from '../interaction/toolbarManager';
import { type ButtonConfiguration, ToolbarGroupProperties } from './toolbarProperties';
import * as styles from './toolbarStyles';
import {
    TOOLBAR_ALIGNMENTS,
    TOOLBAR_GROUPS,
    TOOLBAR_GROUP_ORDERING,
    TOOLBAR_POSITIONS,
    type ToolbarAlignment,
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

    public seriesType = new ToolbarGroupProperties(
        this.onGroupChanged.bind(this, 'seriesType'),
        this.onGroupButtonsChanged.bind(this, 'seriesType')
    );
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

    private readonly horizontalSpacing = 10;
    private readonly verticalSpacing = 10;
    private readonly floatingDetectionRange = 38;

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
        seriesType: new Set(),
        annotations: new Set(),
        annotationOptions: new Set(),
        ranges: new Set(),
        zoom: new Set(),
    };

    private groupButtons: Record<ToolbarGroup, Array<HTMLButtonElement>> = {
        seriesType: [],
        annotations: [],
        annotationOptions: [],
        ranges: [],
        zoom: [],
    };

    private groupDestroyFns: Record<ToolbarGroup, Array<() => void>> = {
        seriesType: [],
        annotations: [],
        annotationOptions: [],
        ranges: [],
        zoom: [],
    };

    private pendingButtonToggledEvents: Array<ToolbarButtonToggledEvent> = [];

    private readonly groupProxied = new Map<ToolbarGroup, ToolbarProxyGroupOptionsEvent['options']>();
    private hasNewLocale = true;

    constructor(private readonly ctx: ModuleContext) {
        super();

        this.elements = {} as Record<ToolbarPosition, HTMLElement>;
        for (const position of TOOLBAR_POSITIONS) {
            this.elements[position] = ctx.domManager.addChild('canvas-overlay', `toolbar-${position}`);
            this.elements[position].role = 'presentation';
            this.renderToolbar(position);
        }
        this.toggleVisibilities();

        this.destroyFns.push(
            ctx.interactionManager.addListener('hover', this.onHover.bind(this), InteractionState.All),
            ctx.interactionManager.addListener('leave', this.onLeave.bind(this), InteractionState.All),
            ctx.toolbarManager.addListener('button-toggled', this.onButtonToggled.bind(this)),
            ctx.toolbarManager.addListener('button-updated', this.onButtonUpdated.bind(this)),
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

    private onGroupButtonsChanged(group: ToolbarGroup, buttons: ButtonConfiguration[], configurationOnly: boolean) {
        if (!this.enabled || this.groupProxied.has(group)) return;

        if (configurationOnly) {
            for (const buttonOptions of this[group].buttonConfigurations()) {
                this.refreshButtonContent(group, buttonOptions);
            }
        } else {
            this.createGroupButtons(group, buttons);
        }
        this.toggleVisibilities();
    }

    private onLayoutComplete() {
        for (const position of TOOLBAR_POSITIONS) {
            this.elements[position].classList.remove(styles.modifiers.preventFlash);
        }
    }

    private onButtonUpdated(event: ToolbarButtonUpdatedEvent) {
        const { type: _type, group, id, ...params } = event;
        this[group].overrideButtonConfiguration(id, { ...params });
    }

    private setButtonActive(button: HTMLElement, active: boolean) {
        button.classList.toggle(styles.modifiers.button.active, active);
    }

    private onButtonToggled(event: ToolbarButtonToggledEvent) {
        const { group, id, active, enabled, visible } = event;

        if (this.groupButtons[group].length === 0) {
            this.pendingButtonToggledEvents.push(event);
            return;
        }

        for (const button of this.groupButtons[group]) {
            if (button.dataset.toolbarId !== `${id}`) continue;
            button.ariaDisabled = `${!enabled}`;
            button.classList.toggle(styles.modifiers.button.hiddenToggled, !visible);
            this.setButtonActive(button, active);
        }
    }

    private onGroupToggled(event: ToolbarGroupToggledEvent) {
        const { caller, group, active, visible } = event;

        this.toggleGroup(caller, group, active, visible);
        this.toggleVisibilities();
    }

    private onFloatingAnchorChanged(event: ToolbarFloatingAnchorChangedEvent) {
        const {
            elements,
            groupButtons,
            positions,
            horizontalSpacing,
            verticalSpacing,
            ctx: { domManager, toolbarManager },
        } = this;

        const { group, anchor } = event;

        if (!positions[ToolbarPosition.Floating].has(group)) return;

        const element = elements[ToolbarPosition.Floating];
        if (element.classList.contains(styles.modifiers.hidden)) return;

        const position = anchor.position ?? 'above';

        let top = anchor.y - element.offsetHeight - verticalSpacing;
        let left = anchor.x - element.offsetWidth / 2;

        if (position === 'right') {
            top = anchor.y - element.offsetHeight / 2;
            left = anchor.x + horizontalSpacing;
        } else if (position === 'above-left') {
            left = anchor.x;
        }

        const canvasRect = domManager.getBoundingClientRect();
        top = clamp(0, top, canvasRect.height - element.offsetHeight);
        left = clamp(0, left, canvasRect.width - element.offsetWidth);

        element.style.top = `${top}px`;
        element.style.left = `${left}px`;

        for (const button of groupButtons[group]) {
            if (button.classList.contains(styles.modifiers.button.hiddenToggled)) continue;

            const parent = button.offsetParent as HTMLElement | null;
            toolbarManager.buttonMoved(
                group,
                button.dataset.toolbarId,
                new BBox(
                    button.offsetLeft + (parent?.offsetLeft ?? 0),
                    button.offsetTop + (parent?.offsetTop ?? 0),
                    button.offsetWidth,
                    button.offsetHeight
                )
            );
        }
    }

    private buttonRect(button: HTMLButtonElement, canvasRect: DOMRect = this.ctx.domManager.getBoundingClientRect()) {
        const buttonRect = button.getBoundingClientRect();
        return new BBox(
            buttonRect.left - canvasRect.left,
            buttonRect.top - canvasRect.top,
            buttonRect.width,
            buttonRect.height
        );
    }

    private onProxyGroupOptions(event: ToolbarProxyGroupOptionsEvent) {
        if (!this.enabled) return;

        const { caller, group, options } = event;

        this.groupProxied.set(group, options);
        this[group].set(options);

        this.toggleGroup(caller, group, undefined, options.enabled);
        this.createGroup(group, options.enabled, options.position);

        if (options.enabled) {
            this.createGroupButtons(group, options.buttons);
        }
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

    private createGroupButtons(group: ToolbarGroup, buttons: ButtonConfiguration[] = []) {
        for (const button of this.groupButtons[group]) {
            button.remove();
        }

        this.groupButtons[group] = [];
        this.groupDestroyFns[group].forEach((d) => d());
        this.groupDestroyFns[group] = [];

        if (buttons.length === 0) return;

        const { align, position } = this[group];
        const alignElement = this.positionAlignments[position][align];

        if (!alignElement) return;

        const nextSection = (section: string | undefined) => {
            const alignElementChildren = Array.from(alignElement.children);
            const dataGroup = 'data-group';
            const dataSection = 'data-section';
            let sectionElement = alignElementChildren.find((prevSection) => {
                return (
                    prevSection.getAttribute(dataGroup) === group &&
                    prevSection.getAttribute(dataSection) === (section ?? '')
                );
            });

            if (!sectionElement) {
                sectionElement = createElement('div');
                sectionElement.setAttribute(dataGroup, group);
                sectionElement.setAttribute(dataSection, section ?? '');

                const groupIndex = TOOLBAR_GROUP_ORDERING[group];
                const insertBeforeElement = alignElementChildren.find((prevSection) => {
                    const prevGroup = prevSection.getAttribute(dataGroup) as ToolbarGroup;
                    const prevGroupIndex = TOOLBAR_GROUP_ORDERING[prevGroup];
                    return prevGroupIndex > groupIndex;
                });
                if (insertBeforeElement != null) {
                    alignElement.insertBefore(sectionElement, insertBeforeElement);
                } else {
                    alignElement.appendChild(sectionElement);
                }

                this.destroyFns.push(() => sectionElement!.remove());
            }

            sectionElement.classList.add(styles.elements.section, styles.modifiers[this[group].size]);

            return sectionElement;
        };

        let prevSection = buttons.at(0)?.section;
        let section = nextSection(prevSection);

        for (const options of buttons) {
            if (prevSection !== options.section) {
                section = nextSection(options.section);
            }
            prevSection = options.section;
            const button = this.createButtonElement(group, options);
            section.appendChild(button);
            this.groupButtons[group].push(button);
        }

        const onEscape = () => {
            this.ctx.toolbarManager.cancel(group);
        };

        let onFocus;
        let onBlur;

        if (isAnimatingFloatingPosition(position)) {
            onFocus = () => this.translateFloatingElements(position, true);
            onBlur = () => this.translateFloatingElements(position, false);
        }

        const orientation = this.computeAriaOrientation(this[group].position);
        this.groupDestroyFns[group] = initToolbarKeyNav({
            orientation,
            toolbar: alignElement,
            buttons: this.groupButtons[group],
            onEscape,
            onFocus,
            onBlur,
        });
        this.updateToolbarAriaLabel(group, alignElement);
    }

    private computeAriaOrientation(position: ToolbarPosition): 'horizontal' | 'vertical' {
        return (
            {
                top: 'horizontal',
                right: 'vertical',
                bottom: 'horizontal',
                left: 'vertical',
                floating: 'horizontal',
                'floating-top': 'horizontal',
                'floating-bottom': 'horizontal',
            } as const
        )[position];
    }

    private toggleGroup(
        caller: string,
        group: ToolbarGroup,
        active: boolean | undefined,
        enabled: boolean | undefined
    ) {
        if (enabled === true) {
            this.groupCallers[group].add(caller);
        } else if (enabled === false) {
            this.groupCallers[group].delete(caller);
        }

        if (active != null) {
            for (const button of this.groupButtons[group]) {
                this.setButtonActive(button, active);
            }
        }
    }

    private processPendingEvents() {
        const pendingButtonToggledEvents = (this.pendingButtonToggledEvents ?? []).slice();

        for (const event of pendingButtonToggledEvents) {
            this.onButtonToggled(event);
        }

        this.pendingButtonToggledEvents = [];
    }

    async performLayout(ctx: LayoutContext): Promise<LayoutContext> {
        if (!this.enabled) return ctx;

        this.refreshOuterLayout(ctx.shrinkRect);
        this.refreshLocale();

        return ctx;
    }

    async performCartesianLayout(opts: { seriesRect: BBox }): Promise<void> {
        if (!this.enabled) return;

        this.refreshInnerLayout(opts.seriesRect);
    }

    private refreshOuterLayout(shrinkRect: BBox) {
        const { elements, horizontalSpacing, verticalSpacing } = this;

        if (!elements.top.classList.contains(styles.modifiers.hidden)) {
            shrinkRect.shrink(elements.top.offsetHeight + verticalSpacing, 'top');
        }

        if (!elements.right.classList.contains(styles.modifiers.hidden)) {
            shrinkRect.shrink(elements.right.offsetWidth + horizontalSpacing, 'right');
        }

        if (!elements.bottom.classList.contains(styles.modifiers.hidden)) {
            shrinkRect.shrink(elements.bottom.offsetHeight + verticalSpacing, 'bottom');

            // See: https://ag-grid.atlassian.net/browse/AG-11852
            elements.bottom.style.top = `${shrinkRect.y + shrinkRect.height + verticalSpacing}px`;
        }

        if (!elements.left.classList.contains(styles.modifiers.hidden)) {
            shrinkRect.shrink(elements.left.offsetWidth + horizontalSpacing, 'left');
        }
    }

    private refreshLocale() {
        const { hasNewLocale } = this;

        if (!hasNewLocale) return;

        for (const group of TOOLBAR_GROUPS) {
            const buttons = this[group].buttonConfigurations();
            for (const buttonOptions of buttons) {
                this.refreshButtonContent(group, buttonOptions);
            }
            this.updateToolbarAriaLabel(group);
        }

        this.hasNewLocale = false;
    }

    private refreshInnerLayout(rect: BBox) {
        const { elements, verticalSpacing } = this;
        const { FloatingBottom, FloatingTop } = ToolbarPosition;

        elements.top.style.top = `${rect.y - elements.top.offsetHeight - verticalSpacing}px`;
        elements.top.style.left = `${rect.x}px`;
        elements.top.style.width = `${rect.width}px`;

        // See: https://ag-grid.atlassian.net/browse/AG-11852
        // elements.bottom.style.top = `${rect.y + rect.height}px`;
        elements.bottom.style.left = `${rect.x}px`;
        elements.bottom.style.width = `${rect.width}px`;

        elements.right.style.top = `${rect.y}px`;
        elements.right.style.right = `0px`;
        elements.right.style.height = `${rect.height}px`;

        elements.left.style.top = `${rect.y}px`;
        elements.left.style.left = `0px`;
        elements.left.style.height = `${rect.height}px`;

        elements[FloatingTop].style.top = `${rect.y}px`;

        elements[FloatingBottom].style.top = `${rect.y + rect.height - elements[FloatingBottom].offsetHeight}px`;
    }

    private refreshButtonContent(group: ToolbarGroup, buttonOptions: ButtonConfiguration) {
        const id = this.buttonId(buttonOptions);
        const button = this.groupProxied.get(group)?.buttons?.find((b) => this.buttonId(b) === id) ?? buttonOptions;

        const element = this.groupButtons[group].find((b) => b.getAttribute('data-toolbar-id') === id);
        if (element == null) return;

        this.updateButton(element, button);
    }

    private toggleVisibilities() {
        if (this.elements == null) return;

        const isGroupVisible = (group: ToolbarGroup) => this[group].enabled && this.groupCallers[group].size > 0;
        const isButtonVisible = (element: HTMLButtonElement) => (button: ButtonConfiguration) => {
            const id = this.buttonId(button);
            return id == null || id === element.dataset.toolbarId;
        };

        for (const position of TOOLBAR_POSITIONS) {
            const visible = this.enabled && Array.from(this.positions[position].values()).some(isGroupVisible);
            this.elements[position].classList.toggle(styles.modifiers.hidden, !visible);
        }

        for (const group of TOOLBAR_GROUPS) {
            if (this[group] == null) continue;
            const groupVisible = isGroupVisible(group);
            for (const button of this.groupButtons[group]) {
                const buttonVisible = groupVisible && this[group].buttonConfigurations().some(isButtonVisible(button));
                button.classList.toggle(styles.modifiers.button.hiddenValue, !buttonVisible);
            }
        }
    }

    private translateFloatingElements(
        position: ToolbarPosition.FloatingBottom | ToolbarPosition.FloatingTop,
        visible: boolean
    ) {
        const { elements, verticalSpacing: verticalMargin, positionAlignments } = this;

        const element = elements[position];
        const alignments = Object.values(positionAlignments[position]);
        element.classList.toggle(styles.modifiers.floatingHidden, !visible);

        const dir = position === ToolbarPosition.FloatingBottom ? 1 : -1;

        for (const align of alignments) {
            align.style.transform =
                visible && align.style.transform !== ''
                    ? 'translateY(0)'
                    : `translateY(${(element.offsetHeight + verticalMargin) * dir}px)`;
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
            alignmentElement.dataset.pointerCapture = 'exclusive';
            element.appendChild(alignmentElement);
            this.positionAlignments[position][align] = alignmentElement;
        }
    }

    private createButtonElement(group: ToolbarGroup, options: ButtonConfiguration) {
        const button = createElement('button');
        button.classList.add(styles.elements.button);
        button.dataset.toolbarGroup = group;
        button.tabIndex = -1;

        button.dataset.toolbarId = this.buttonId(options);
        button.onclick = makeAccessibleClickListener(
            button,
            this.onButtonPress.bind(this, button, group, options.id, options.value)
        );
        this.updateButton(button, options);

        this.destroyFns.push(() => button.remove());

        return button;
    }

    private updateToolbarAriaLabel(group: ToolbarGroup, alignElement?: HTMLElement) {
        if (!alignElement) {
            const { align, position } = this[group];
            alignElement = this.positionAlignments[position][align];
            if (!alignElement) return;
        }
        const map = {
            seriesType: 'ariaLabelChartToolbar',
            annotations: 'ariaLabelAnnotationsToolbar',
            annotationOptions: 'ariaLabelAnnotationOptionsToolbar',
            ranges: 'ariaLabelRangesToolbar',
            zoom: 'ariaLabelZoomToolbar',
        } as const;
        alignElement.ariaLabel = this.ctx.localeManager.t(map[group]);
    }

    private updateButton(button: HTMLButtonElement, options: ButtonConfiguration) {
        const {
            ctx: { domManager, localeManager },
        } = this;

        if (options.tooltip) {
            const tooltip = localeManager.t(options.tooltip);
            button.title = tooltip;
        }

        let inner = '';

        if (options.icon != null) {
            inner = `<span class="${domManager.getIconClassNames(options.icon)} ${styles.elements.icon}"></span>`;
        }

        if (options.label != null) {
            const label = localeManager.t(options.label);
            inner = `${inner}<span class="${styles.elements.label}">${label}</span>`;
        }

        button.innerHTML = inner;

        button.classList.toggle(styles.modifiers.button.fillVisible, options.fill != null);
        button.style.setProperty('--fill', options.fill ?? null);

        const ariaLabel = options.ariaLabel ? this.ctx.localeManager.t(options.ariaLabel) : undefined;
        setAttribute(button, 'aria-label', ariaLabel);
    }

    private onButtonPress(button: HTMLButtonElement, group: ToolbarGroup, id: string | undefined, value: any) {
        this.ctx.toolbarManager.pressButton(group, this.buttonId({ id, value }), value, this.buttonRect(button));
    }

    private buttonId(button: ButtonConfiguration) {
        const { id, value, label } = button;
        if (id != null) return id;
        if (value != null && typeof value !== 'object') return String(value);

        // @todo(AG-12343): buttons with non-primitive values need IDs
        return label ?? '';
    }
}
