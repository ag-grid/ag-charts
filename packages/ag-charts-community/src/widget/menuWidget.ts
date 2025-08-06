import { CleanupRegistry, createElementId, getDocument, setAttribute } from 'ag-charts-core';

import {
    addEscapeEventListener,
    addMouseCloseListener,
    addOverrideFocusVisibleEventListener,
    addTouchCloseListener,
    getLastFocus,
    hasNoModifiers,
} from '../util/keynavUtil';
import { MenuItemWidget } from './menuItemWidget';
import type { RovingDirection } from './rovingDirection';
import { RovingTabContainerWidget } from './rovingTabContainerWidget';
import type { KeyboardWidgetEvent, WidgetEvent } from './widgetEvents';

interface ExpansionScope {
    lastFocus: HTMLElement | undefined;
    expandedSubMenu: MenuWidget | undefined;
    removers: CleanupRegistry;
    abort: () => void;
    close: () => void;
}

type ExpandEvent = Pick<WidgetEvent, 'sourceEvent'>;

enum CollapseMode {
    CLOSE = '0',
    ABORT = '1',
    DESTROY = '2',
    PARENT_CLOSED = '3',
    SIDLING_OPENED = '4',
}
const closeKeys = ['Escape', 'ArrowLeft'] as const;

export class MenuWidget extends RovingTabContainerWidget<MenuItemWidget> {
    private expansionScope?: ExpansionScope;

    constructor(orientation: RovingDirection = 'vertical') {
        super(orientation, 'menu');
    }

    protected override destructor() {
        this.selfCollapse(CollapseMode.DESTROY);
    }

    public addSeparator(): Element {
        const sep = getDocument().createElement('div');
        setAttribute(sep, 'role', 'separator');
        this.elem.appendChild(sep);
        return sep;
    }

    protected override onChildAdded(child: MenuItemWidget): void {
        super.onChildAdded(child);
        child.addListener('mouseenter', this.handleMouseEnter);
        child.addListener('mousemove', this.handleMouseMove);
    }

    protected override onChildRemoved(child: MenuItemWidget): void {
        super.onChildRemoved(child);
        child.removeListener('mouseenter', this.handleMouseEnter);
        child.removeListener('mousemove', this.handleMouseMove);
    }

    private readonly handleMouseEnter = (ev: WidgetEvent, current: MenuItemWidget) => {
        if (!current.hasPopup()) {
            this.expandSubMenu(ev, undefined);
        }
    };

    private readonly handleMouseMove = (_ev: WidgetEvent, current: MenuItemWidget) => {
        current.focus({ preventScroll: true });
    };

    public addSubMenu(): { subMenuButton: MenuItemWidget; subMenu: MenuWidget } {
        const subMenuButton = new MenuItemWidget();
        const subMenuId = createElementId();
        const subMenu = new MenuWidget(this.orientation);
        const accessibleOpener = (ev: WidgetEvent) => {
            // Disabled buttons are focusable and can receive events, but have aria-disabled="true"
            if (!subMenuButton.isDisabled()) {
                this.expandSubMenu(ev, subMenu);
            }
        };
        const arrowRightOpener = (ev: KeyboardWidgetEvent) => {
            if (hasNoModifiers(ev.sourceEvent) && ev.sourceEvent.code === 'ArrowRight') {
                accessibleOpener(ev);
            }
        };
        subMenuButton.setAriaHasPopup('menu');
        subMenuButton.setAriaExpanded(false);
        subMenuButton.setAriaControls(subMenuId);
        subMenuButton.addListener('click', accessibleOpener);
        subMenuButton.addListener('mouseenter', accessibleOpener);
        subMenuButton.addListener('keydown', arrowRightOpener);
        subMenu.addListener('expand-widget', () => subMenuButton.setAriaExpanded(false));
        subMenu.addListener('collapse-widget', () => subMenuButton.setAriaExpanded(true));
        subMenu.id = subMenuId;
        this.addChild(subMenuButton);
        return { subMenuButton, subMenu };
    }

    private expandSubMenu(ev: WidgetEvent, subMenu: MenuWidget | undefined) {
        const { expansionScope } = this;
        if (!expansionScope) return;

        expansionScope.expandedSubMenu?.selfCollapse(CollapseMode.SIDLING_OPENED);
        subMenu?.expand(ev);
        expansionScope.expandedSubMenu = subMenu;
    }

    public expand(event: ExpandEvent, opts?: { overrideFocusVisible?: boolean }): void {
        if (this.expansionScope != null) return; // already open

        this.expansionScope = {
            lastFocus: getLastFocus(event.sourceEvent),
            expandedSubMenu: undefined,
            abort: () => this.selfCollapse(CollapseMode.ABORT),
            close: () => this.selfCollapse(CollapseMode.CLOSE),
            removers: new CleanupRegistry(),
        };
        const scope = this.expansionScope;
        const buttons = this.children.map((value) => value.getElement());
        setAttribute(scope.lastFocus, 'aria-expanded', true);

        scope.removers.register(
            addMouseCloseListener(this.elem, scope.abort),
            addTouchCloseListener(this.elem, scope.abort),
            ...this.children.map((child) => addEscapeEventListener(child.getElement(), scope.close, closeKeys)),
            opts?.overrideFocusVisible &&
                addOverrideFocusVisibleEventListener(this.elem, buttons, opts.overrideFocusVisible)
        );

        this.internalListener?.dispatch('expand-widget', this, { type: 'expand-widget' });
        this.children[0]?.focus({ preventScroll: true });
    }

    private selfCollapse(mode: CollapseMode) {
        if (this.expansionScope === undefined) return;
        const { lastFocus, removers, expandedSubMenu } = this.expansionScope;
        this.expansionScope = undefined; // stop re-entrance

        expandedSubMenu?.selfCollapse(CollapseMode.PARENT_CLOSED);
        setAttribute(lastFocus, 'aria-expanded', false);
        if (mode === CollapseMode.CLOSE) {
            lastFocus?.focus({ preventScroll: true });
        }
        removers.flush();

        this.internalListener?.dispatch('collapse-widget', this, { type: 'collapse-widget' });
    }

    public collapse() {
        this.selfCollapse(CollapseMode.CLOSE);
    }
}
