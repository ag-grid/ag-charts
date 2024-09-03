import type { AgToolbarGroupPosition } from 'ag-charts-types';

import type { LayoutContext, ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import { BBox } from '../../scene/bbox';
import { setAttribute } from '../../util/attributeUtil';
import { createElement, getWindow } from '../../util/dom';
import { initToolbarKeyNav, makeAccessibleClickListener } from '../../util/keynavUtil';
import { clamp } from '../../util/number';
import { ObserveChanges } from '../../util/proxy';
import { BOOLEAN, Validate } from '../../util/validation';
import { Vec2 } from '../../util/vector';
import { InteractionState, type PointerInteractionEvent } from '../interaction/interactionManager';
import type {
    ToolbarButtonToggledEvent,
    ToolbarButtonUpdatedEvent,
    ToolbarFloatingAnchorChangedEvent,
    ToolbarGroupToggledEvent,
    ToolbarGroupUpdatedEvent,
    ToolbarProxyGroupOptionsEvent,
} from '../interaction/toolbarManager';
import { type LayoutCompleteEvent, LayoutElement } from '../layout/layoutManager';
import { type ButtonConfiguration, ToolbarGroupProperties } from './toolbarProperties';
import * as styles from './toolbarStyles';
import {
    TOOLBAR_ALIGNMENTS,
    TOOLBAR_GROUPS,
    TOOLBAR_GROUP_ORDERING,
    TOOLBAR_POSITIONS,
    type ToolbarAlignment,
    type ToolbarAnchor,
    type ToolbarButtonConfig,
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

    private dragState: {
        client: { x: number; y: number };
        position: ToolbarAnchor;
        detached: boolean;
    } = {
        client: { x: 0, y: 0 },
        position: {
            x: 0,
            y: 0,
        },
        detached: false,
    };

    private floatingToolbarId?: number;

    private readonly horizontalSpacing = 10;
    private readonly verticalSpacing = 10;
    private readonly floatingDetectionRange = 38;

    private readonly elements: Record<ToolbarPosition, HTMLElement>;

    private readonly positions: Record<ToolbarPosition, Set<ToolbarGroup>> = {
        [ToolbarPosition.Top]: new Set(),
        [ToolbarPosition.Left]: new Set(),
        [ToolbarPosition.Right]: new Set(),
        [ToolbarPosition.Bottom]: new Set(),
        [ToolbarPosition.Floating]: new Set(),
        [ToolbarPosition.FloatingTop]: new Set(),
        [ToolbarPosition.FloatingBottom]: new Set(),
    };

    private readonly positionAlignments: Record<ToolbarPosition, Partial<Record<ToolbarAlignment, HTMLElement>>> = {
        [ToolbarPosition.Top]: {},
        [ToolbarPosition.Left]: {},
        [ToolbarPosition.Right]: {},
        [ToolbarPosition.Bottom]: {},
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

    private readonly ariaToolbars: {
        groups: ToolbarGroup[];
        destroyFns: (() => void)[];
        resetListeners: () => void;
    }[] = [
        { groups: ['seriesType', 'annotations'], destroyFns: [], resetListeners: () => {} },
        { groups: ['annotationOptions'], destroyFns: [], resetListeners: () => {} },
        { groups: ['ranges'], destroyFns: [], resetListeners: () => {} },
        { groups: ['zoom'], destroyFns: [], resetListeners: () => {} },
    ];

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
            ctx.toolbarManager.addListener('group-updated', this.onGroupUpdated.bind(this)),
            ctx.toolbarManager.addListener('floating-anchor-changed', this.onFloatingAnchorChanged.bind(this)),
            ctx.toolbarManager.addListener('proxy-group-options', this.onProxyGroupOptions.bind(this)),
            ctx.layoutManager.registerElement(LayoutElement.Toolbar, this.onLayoutStart.bind(this)),
            ctx.layoutManager.addListener('layout:complete', this.onLayoutComplete.bind(this)),
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

    private onLayoutComplete(opts: LayoutCompleteEvent) {
        for (const position of TOOLBAR_POSITIONS) {
            this.elements[position].classList.remove(styles.modifiers.preventFlash);
        }
        if (this.enabled) {
            this.refreshInnerLayout(opts.series.rect);
        }
    }

    private onButtonUpdated(event: ToolbarButtonUpdatedEvent) {
        const { type: _type, group, id, ...params } = event;
        this[group].overrideButtonConfiguration(id, { ...params });
    }

    private setButtonActive(button: HTMLElement, active: boolean) {
        button.classList.toggle(styles.modifiers.button.active, active);
    }

    private setButtonChecked(button: HTMLElement, checked: boolean) {
        if (button.role === 'switch') {
            button.ariaChecked = checked.toString();
        }
    }

    private setButtonGroupFirstLast(group: Element) {
        const childNodes = Array.from(group.childNodes ?? []) as HTMLElement[];

        const setFirstClass = (first: boolean, button: HTMLElement, modifier: string) => {
            const buttonVisible = !button.classList.contains(styles.modifiers.button.hiddenToggled);
            button.classList.toggle(modifier, buttonVisible && first);
            return buttonVisible ? false : first;
        };

        childNodes.reduce<boolean>(
            (first, button) => setFirstClass(first, button, styles.modifiers.button.first),
            true
        );

        childNodes.reduceRight<boolean>(
            (last, button) => setFirstClass(last, button, styles.modifiers.button.last),
            true
        );
    }

    private onButtonToggled(event: ToolbarButtonToggledEvent) {
        const { group, id, active, enabled, visible, checked } = event;

        if (this.groupButtons[group].length === 0) {
            this.pendingButtonToggledEvents.push(event);
            return;
        }

        const button = this.groupButtons[group].find((b) => b.dataset.toolbarId === `${id}`);
        if (button == null) return;

        button.ariaDisabled = `${!enabled}`;
        button.classList.toggle(styles.modifiers.button.hiddenToggled, !visible);
        this.setButtonActive(button, active);
        this.setButtonChecked(button, checked);

        this.setButtonGroupFirstLast(button.parentNode! as HTMLElement);
    }

    private onGroupToggled(event: ToolbarGroupToggledEvent) {
        const { caller, group, active, visible } = event;

        this.toggleGroup(caller, group, active, visible);
        this.toggleVisibilities();
    }

    private onGroupUpdated(event: ToolbarGroupUpdatedEvent) {
        const { group } = event;

        for (const ariaToolbar of this.ariaToolbars) {
            if (ariaToolbar.groups.includes(group)) {
                ariaToolbar.resetListeners();
                return;
            }
        }
    }

    private onFloatingAnchorChanged(event: ToolbarFloatingAnchorChangedEvent) {
        const { elements, positions, horizontalSpacing, verticalSpacing } = this;

        const { group, anchor, floatingToolbarId } = event;

        if (this.floatingToolbarId === floatingToolbarId && this.dragState.detached) {
            return;
        }

        this.floatingToolbarId = floatingToolbarId;
        this.dragState.detached = false;

        if (!positions[ToolbarPosition.Floating].has(group)) return;

        const element = elements[ToolbarPosition.Floating];

        const position = anchor.position ?? 'above';

        const { offsetWidth: width, offsetHeight: height } = element;

        let top = anchor.y - height - verticalSpacing;
        let left = anchor.x - width / 2;

        if (position === 'below') {
            top = anchor.y + verticalSpacing;
        } else if (position === 'right') {
            top = anchor.y - height / 2;
            left = anchor.x + horizontalSpacing;
        } else if (position === 'above-left') {
            left = anchor.x;
        }

        const groupBBox = new BBox(left, top, width, height);
        this.positionGroup(element, group, groupBBox);
    }

    private positionGroup(element: HTMLElement, group: ToolbarGroup, bbox: BBox) {
        const {
            ctx: { domManager },
        } = this;

        const canvasRect = domManager.getBoundingClientRect();
        bbox.x = clamp(0, bbox.x, canvasRect.width - bbox.width);
        bbox.y = clamp(0, bbox.y, canvasRect.height - bbox.height);

        element.style.setProperty('left', `${bbox.x}px`);
        element.style.setProperty('top', `${bbox.y}px`);

        this.onGroupMoved(group, bbox);
    }

    private onGroupMoved(group: ToolbarGroup, bbox: BBox) {
        const {
            groupButtons,
            ctx: { toolbarManager },
        } = this;
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
                ),
                bbox
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
                sectionElement.role = 'presentation';
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
                this.setButtonGroupFirstLast(section);
                section = nextSection(options.section);
            }
            prevSection = options.section;
            const button = this.createButtonElement(group, options);
            section.appendChild(button);
            this.groupButtons[group].push(button);
        }
        this.setButtonGroupFirstLast(section);

        const onEscape = () => {
            this.ctx.toolbarManager.cancel(group);
        };
        let onFocus;
        let onBlur;
        if (isAnimatingFloatingPosition(position)) {
            onFocus = () => this.translateFloatingElements(position, true);
            onBlur = () => this.translateFloatingElements(position, false);
        }

        this.createAriaToolbar(group, alignElement, onFocus, onBlur, onEscape);
    }

    private createAriaToolbar(
        group: ToolbarGroup,
        toolbar: HTMLElement,
        onFocus: undefined | ((event: FocusEvent) => void),
        onBlur: undefined | ((event: FocusEvent) => void),
        onEscape: (event: KeyboardEvent) => void
    ) {
        const orientation = this.computeAriaOrientation(this[group].position);
        const ariaToolbar = this.getAriaToolbar(group);

        ariaToolbar.resetListeners = () => {
            const buttons = ariaToolbar.groups
                .map((g) => this.groupButtons[g])
                .flat()
                .filter(
                    (b) =>
                        !b.classList.contains(styles.modifiers.button.hiddenToggled) &&
                        !b.classList.contains(styles.modifiers.button.dragHandle)
                );
            ariaToolbar.destroyFns.forEach((d) => d());
            ariaToolbar.destroyFns = initToolbarKeyNav({ orientation, toolbar, buttons, onEscape, onFocus, onBlur });
        };
        ariaToolbar.resetListeners();
        this.updateToolbarAriaLabel(group, toolbar);
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

    private onLayoutStart(ctx: LayoutContext) {
        if (this.enabled) {
            this.refreshOuterLayout(ctx.layoutBox);
            this.refreshLocale();
        }
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
            alignmentElement.role = 'presentation';
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
        button.addEventListener(
            'click',
            makeAccessibleClickListener(button, (event) =>
                this.onButtonPress(event, button, group, options.id, options.value)
            )
        );

        if (options.value === 'drag') {
            button.addEventListener(
                'mousedown',
                makeAccessibleClickListener(button, (event) => this.onDragStart(event, button, group))
            );
            button.classList.add(styles.modifiers.button.dragHandle);
        }

        if (options.role === 'switch') {
            button.role = options.role;
            button.ariaChecked = false.toString();
        }
        this.updateButton(button, options);

        setTimeout(() => {
            button.classList.add(styles.modifiers.button.withTransition);
        }, 1);

        this.destroyFns.push(() => button.remove());

        return button;
    }

    private getAriaToolbar(group: ToolbarGroup): Toolbar['ariaToolbars'][number] {
        for (const ariaToolbar of this.ariaToolbars) {
            if (ariaToolbar.groups.includes(group)) {
                return ariaToolbar;
            }
        }
        throw new Error(`AG Charts - cannot find aria-toolbar of '${group}'`);
    }

    private updateToolbarAriaLabel(group: ToolbarGroup, alignElement?: HTMLElement) {
        if (!alignElement) {
            const { align, position } = this[group];
            alignElement = this.positionAlignments[position][align];
            if (!alignElement) return;
        }
        const map = {
            seriesType: 'ariaLabelFinancialCharts',
            annotations: 'ariaLabelFinancialCharts',
            annotationOptions: 'ariaLabelAnnotationOptionsToolbar',
            ranges: 'ariaLabelRangesToolbar',
            zoom: 'ariaLabelZoomToolbar',
        } as const;
        alignElement.ariaLabel = this.ctx.localeManager.t(map[group]);
    }

    private expandButtonConfig(button: HTMLButtonElement, options: ButtonConfiguration): ToolbarButtonConfig {
        if (options.role !== 'switch' || button.ariaChecked !== 'true' || options.checkedOverrides === undefined)
            return options;

        return {
            icon: options.checkedOverrides.icon ?? options.icon,
            label: options.checkedOverrides.label ?? options.label,
            ariaLabel: options.checkedOverrides.ariaLabel ?? options.ariaLabel,
            tooltip: options.checkedOverrides.tooltip ?? options.tooltip,
        };
    }

    private updateButton(button: HTMLButtonElement, options: ButtonConfiguration) {
        const { domManager, localeManager } = this.ctx;
        const { icon, label, ariaLabel, tooltip } = this.expandButtonConfig(button, options);

        if (tooltip) {
            button.title = localeManager.t(tooltip);
        }

        let inner = '';

        if (icon != null) {
            inner = `<span class="${domManager.getIconClassNames(icon)} ${styles.elements.icon}"></span>`;
        }

        if (label != null) {
            const tlabel = localeManager.t(label);
            inner = `${inner}<span class="${styles.elements.label}">${tlabel}</span>`;
        }

        button.innerHTML = inner;

        button.classList.toggle(styles.modifiers.button.fillVisible, options.fill != null);
        button.style.setProperty('--fill', options.fill ?? null);

        const strokeWidthVisible = options.strokeWidth != null;
        button.classList.toggle(styles.modifiers.button.strokeWidthVisible, strokeWidthVisible);
        button.style.setProperty('--strokeWidth', strokeWidthVisible ? `${options.strokeWidth}px` : null);

        const tAriaLabel = ariaLabel ? this.ctx.localeManager.t(ariaLabel) : undefined;
        setAttribute(button, 'aria-label', tAriaLabel);
    }

    private onButtonPress(
        event: MouseEvent,
        button: HTMLButtonElement,
        group: ToolbarGroup,
        id: string | undefined,
        value: any
    ) {
        this.ctx.toolbarManager.pressButton(group, this.buttonId({ id, value }), value, this.buttonRect(button), event);
    }

    private onDragStart(event: MouseEvent, button: HTMLButtonElement, group: ToolbarGroup) {
        const element = this.elements[ToolbarPosition.Floating];

        event.preventDefault();
        event.stopPropagation();

        this.dragState = {
            client: Vec2.from(event.clientX, event.clientY),
            position: Vec2.from(
                Number(element.style.getPropertyValue('left').replace('px', '')),
                Number(element.style.getPropertyValue('top').replace('px', ''))
            ),
            detached: true,
        };

        button.classList.toggle(styles.modifiers.button.dragging, true);

        const onDrag = (e: MouseEvent) => this.onDrag(e, group);
        const onDragEnd = () => {
            button.classList.toggle(styles.modifiers.button.dragging, false);
            window.removeEventListener('mousemove', onDrag);
        };

        const window = getWindow();

        window.addEventListener('mousemove', onDrag);
        window.addEventListener('mouseup', onDragEnd, {
            once: true,
        });

        this.ctx.toolbarManager.groupMoved(group);
    }

    private onDrag(event: MouseEvent, group: ToolbarGroup) {
        const { elements, dragState } = this;
        const element = elements[ToolbarPosition.Floating];
        const { offsetWidth: width, offsetHeight: height } = element;

        const offset = Vec2.sub(Vec2.from(event.clientX, event.clientY), dragState.client);
        const position = Vec2.add(dragState.position, offset);

        const groupBBox = new BBox(position.x, position.y, width, height);
        this.positionGroup(element, group, groupBBox);
    }

    private buttonId(button: ButtonConfiguration) {
        const { id, value, label } = button;
        if (id != null) {
            return id;
        } else if (value != null && typeof value !== 'object') {
            return String(value);
        }
        // @todo(AG-12343): buttons with non-primitive values need IDs
        return label ?? '';
    }
}
