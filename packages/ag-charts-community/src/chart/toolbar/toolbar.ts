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

        let top = anchor.y - element.offsetHeight - verticalSpacing;
        let left = anchor.x - element.offsetWidth / 2;

        if (anchor.position === 'above') {
            top = anchor.y - element.offsetHeight / 2;
            left = anchor.x + horizontalSpacing;
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
                button.dataset.toolbarValue,
                new BBox(
                    button.offsetLeft + (parent?.offsetLeft ?? 0),
                    button.offsetTop + (parent?.offsetTop ?? 0),
                    button.offsetWidth,
                    button.offsetHeight
                )
            );
        }
    }

    private onProxyGroupOptions(event: ToolbarProxyGroupOptionsEvent) {
        if (!this.enabled) return;

        const { caller, group, options } = event;

        this.groupProxied.set(group, options);
        this[group].set(options);

        this.toggleGroup(caller, group, options.enabled);
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

    private createGroupButtons(group: ToolbarGroup, buttons: Array<ToolbarButton> = []) {
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

        let index = 0;
        const nextSection = () => {
            let newSection = alignElement.children.item(index);
            if (!newSection) {
                newSection = createElement('div');
                alignElement.appendChild(newSection);
                this.destroyFns.push(() => newSection!.remove());
            }
            newSection.classList.add(styles.elements.section, styles.modifiers[this[group].size]);
            index++;
            return newSection;
        };

        let section = nextSection();
        let prevSection = buttons.at(0)?.section;

        for (const options of buttons) {
            if (prevSection !== options.section) {
                section = nextSection();
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
        const { groupButtons, groupProxied, hasNewLocale } = this;

        if (!hasNewLocale) return;

        for (const group of TOOLBAR_GROUPS) {
            const groupProxyOptions = groupProxied.get(group);
            groupButtons[group].forEach((element) => this.refreshButtonLocale(element, this[group], groupProxyOptions));
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

    private refreshButtonLocale(
        element: HTMLButtonElement,
        group: ToolbarGroupProperties,
        groupProxyOptions?: ToolbarProxyGroupOptionsEvent['options']
    ) {
        const {
            dataset: { toolbarValue },
        } = element;

        const button =
            groupProxyOptions?.buttons?.find(({ value }) => value === toolbarValue) ??
            group.buttons?.find(({ value }) => value === toolbarValue);

        if (!button) return;

        this.updateButtonText(element, button);
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

    private updateToolbarAriaLabel(group: ToolbarGroup, alignElement?: HTMLElement) {
        if (!alignElement) {
            const { align, position } = this[group];
            alignElement = this.positionAlignments[position][align];
            if (!alignElement) return;
        }
        const map = {
            annotations: 'ariaLabelAnnotationsToolbar',
            annotationOptions: 'ariaLabelAnnotationOptionsToolbar',
            ranges: 'ariaLabelRangesToolbar',
            zoom: 'ariaLabelZoomToolbar',
        } as const;
        alignElement.ariaLabel = this.ctx.localeManager.t(map[group]);
    }

    private updateButtonText(button: HTMLButtonElement, options: ToolbarButton) {
        const {
            ctx: { domManager, localeManager },
        } = this;

        if (options.tooltip) {
            const tooltip = localeManager.t(options.tooltip);
            button.title = tooltip;
        }

        let inner = '';

        if (options.icon != null) {
            inner = `<span class="${domManager.getIconClass(options.icon)} ${styles.elements.icon}"></span>`;
        }

        if (options.label != null) {
            const label = localeManager.t(options.label);
            inner = `${inner}<span class="${styles.elements.label}">${label}</span>`;
        }

        button.innerHTML = inner;
        const ariaLabel = options.ariaLabel ? this.ctx.localeManager.t(options.ariaLabel) : undefined;
        setAttribute(button, 'aria-label', ariaLabel);
    }

    private onButtonPress(group: ToolbarGroup, value: any) {
        this.ctx.toolbarManager.pressButton(group, value);
    }
}
