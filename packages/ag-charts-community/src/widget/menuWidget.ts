import {
    CleanupRegistry,
    addEscapeEventListener,
    addMouseCloseListener,
    addOverrideFocusVisibleEventListener,
    addTouchCloseListener,
    createElementId,
    getLastFocus,
    hasNoModifiers,
    setAttribute,
} from 'ag-charts-core';

import { CollapseMode } from './collapseMode';
import type { CollapseOpts, ExpandOpts, ExpandableWidget } from './expandableWidget';
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

const closeKeys = ['Escape', 'ArrowLeft'] as const;

export class MenuWidget extends RovingTabContainerWidget<MenuItemWidget> implements ExpandableWidget<HTMLDivElement> {
    private expansionScope?: ExpansionScope;

    constructor(orientation: RovingDirection = 'vertical') {
        super(orientation, 'menu');
    }

    protected override destructor() {
        this.collapse({ mode: CollapseMode.DESTROY });
    }

    public addSeparator(): Element {
        const sep = this.elem.ownerDocument.createElement('div');
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
        const subMenu = new MenuWidget(this.orientation);
        subMenu.id = createElementId();

        const expand = () => {
            this.collapseExpandedSubMenu(subMenu);
            subMenuButton.expandControlled();
        };

        const arrowRightOpener = (ev: KeyboardWidgetEvent) => {
            if (hasNoModifiers(ev.sourceEvent) && ev.sourceEvent.code === 'ArrowRight') {
                this.collapseExpandedSubMenu(subMenu);
                subMenuButton.expandControlled();
            }
        };

        subMenuButton.setControlled(subMenu);
        subMenuButton.setAriaHasPopup('menu');
        subMenuButton.addListener('click', expand);
        subMenuButton.addListener('mouseenter', expand);
        subMenuButton.addListener('keydown', arrowRightOpener);
        this.addChild(subMenuButton);
        return { subMenuButton, subMenu };
    }

    private expandSubMenu(ev: WidgetEvent, subMenu: MenuWidget | undefined) {
        const { expansionScope } = this;
        if (!expansionScope) return;

        this.collapseExpandedSubMenu(subMenu);
        subMenu?.expand(ev);
    }

    private collapseExpandedSubMenu(newSubMenu: MenuWidget | undefined) {
        const { expansionScope } = this;
        if (!expansionScope) return;

        expansionScope.expandedSubMenu?.collapse({ mode: CollapseMode.SIDLING_OPENED });
        expansionScope.expandedSubMenu = newSubMenu;
    }

    expand(opts: ExpandOpts): void {
        if (this.expansionScope != null) return; // already open

        this.expansionScope = {
            lastFocus: getLastFocus(opts.sourceEvent),
            expandedSubMenu: undefined,
            abort: () => this.collapse({ mode: CollapseMode.ABORT }),
            close: () => this.collapse({ mode: CollapseMode.CLOSE }),
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

    collapse(opts?: CollapseOpts): void {
        const { mode = CollapseMode.CLOSE } = opts ?? {};

        if (this.expansionScope === undefined) return;
        const { lastFocus, removers, expandedSubMenu } = this.expansionScope;
        this.expansionScope = undefined; // stop re-entrance

        expandedSubMenu?.collapse({ mode: CollapseMode.PARENT_CLOSED });
        setAttribute(lastFocus, 'aria-expanded', false);
        if (mode === CollapseMode.CLOSE) {
            lastFocus?.focus({ preventScroll: true });
        }
        removers.flush();

        this.internalListener?.dispatch('collapse-widget', this, { type: 'collapse-widget', mode });
    }
}
