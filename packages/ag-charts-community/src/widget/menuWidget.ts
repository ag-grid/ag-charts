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

interface OpenScope {
    lastFocus: HTMLElement | undefined;
    openSubMenu: MenuWidget | undefined;
    removers: CleanupRegistry;
    abort: () => void;
    close: () => void;
}

type OpenEvent = Pick<WidgetEvent, 'sourceEvent'>;

enum CloseMode {
    CLOSE = '0',
    ABORT = '1',
    DESTROY = '2',
    PARENT_CLOSED = '3',
    SIDLING_OPENED = '4',
}
const closeKeys = ['Escape', 'ArrowLeft'] as const;

export class MenuWidget extends RovingTabContainerWidget<MenuItemWidget> {
    private openScope?: OpenScope;

    constructor(orientation: RovingDirection = 'vertical') {
        super(orientation, 'menu');
    }

    protected override destructor() {
        this.selfClose(CloseMode.DESTROY);
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
    }

    protected override onChildRemoved(child: MenuItemWidget): void {
        super.onChildRemoved(child);
        child.removeListener('mouseenter', this.handleMouseEnter);
    }

    private readonly handleMouseEnter = (ev: WidgetEvent, current: MenuItemWidget) => {
        if (!current.hasPopup()) {
            this.openSubMenu(ev, undefined);
        }
        current.addListener('mousemove', () => current.focus({ preventScroll: true }));
    };

    public addSubMenu(): { subMenuButton: MenuItemWidget; subMenu: MenuWidget } {
        const subMenuButton = new MenuItemWidget();
        const subMenuId = createElementId();
        const subMenu = new MenuWidget(this.orientation);
        const accessibleOpener = (ev: WidgetEvent) => {
            // Disabled buttons are focusable and can receive events, but have aria-disabled="true"
            if (!subMenuButton.isDisabled()) {
                this.openSubMenu(ev, subMenu);
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
        subMenu.addListener('close-widget', () => subMenuButton.setAriaExpanded(false));
        subMenu.addListener('open-widget', () => subMenuButton.setAriaExpanded(true));
        subMenu.id = subMenuId;
        this.addChild(subMenuButton);
        return { subMenuButton, subMenu };
    }

    private openSubMenu(ev: WidgetEvent, subMenu: MenuWidget | undefined) {
        const { openScope } = this;
        if (!openScope) return;

        openScope.openSubMenu?.selfClose(CloseMode.SIDLING_OPENED);
        subMenu?.open(ev);
        openScope.openSubMenu = subMenu;
    }

    public open(event: OpenEvent, opts?: { overrideFocusVisible?: boolean }): void {
        if (this.openScope != null) return; // already open

        this.openScope = {
            lastFocus: getLastFocus(event.sourceEvent),
            openSubMenu: undefined,
            abort: () => this.selfClose(CloseMode.ABORT),
            close: () => this.selfClose(CloseMode.CLOSE),
            removers: new CleanupRegistry(),
        };
        const scope = this.openScope;
        const buttons = this.children.map((value) => value.getElement());
        setAttribute(scope.lastFocus, 'aria-expanded', true);

        scope.removers.register(
            addMouseCloseListener(this.elem, scope.abort),
            addTouchCloseListener(this.elem, scope.abort),
            ...this.children.map((child) => addEscapeEventListener(child.getElement(), scope.close, closeKeys)),
            opts?.overrideFocusVisible &&
                addOverrideFocusVisibleEventListener(this.elem, buttons, opts.overrideFocusVisible)
        );

        this.internalListener?.dispatch('open-widget', this, { type: 'open-widget' });
        this.children[0]?.focus({ preventScroll: true });
    }

    private selfClose(mode: CloseMode) {
        if (this.openScope === undefined) return;
        const { lastFocus, removers, openSubMenu } = this.openScope;
        this.openScope = undefined; // stop re-entrance

        openSubMenu?.selfClose(CloseMode.PARENT_CLOSED);
        setAttribute(lastFocus, 'aria-expanded', false);
        if (mode === CloseMode.CLOSE) {
            lastFocus?.focus({ preventScroll: true });
        }
        removers.flush();

        this.internalListener?.dispatch('close-widget', this, { type: 'close-widget' });
    }

    public close() {
        this.selfClose(CloseMode.CLOSE);
    }
}
