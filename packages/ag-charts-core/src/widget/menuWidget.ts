import { attachListener } from '../dom/domEvents';
import { isDirectionRtl } from '../dom/domUtil';
import { hasNoModifiers } from '../dom/keynavUtil';
import { createElementId } from '../identity/id';
import { CollapseMode } from './collapseMode';
import type { CollapseOpts, ExpandOpts, ExpandableWidget } from './expandableWidget';
import { MenuItemWidget } from './menuItemWidget';
import { Opener } from './opener';
import type { RovingDirection } from './rovingDirection';
import { RovingTabContainerWidget } from './rovingTabContainerWidget';
import { SeparatorWidget } from './separatorWidget';
import type { KeyboardWidgetEvent, WidgetEvent } from './widgetEvents';

interface ExpansionScope {
    opener: Opener | undefined;
    expandedSubMenu: MenuWidget | undefined;
    removeOutsidePressListener: () => void;
}

export class MenuWidget extends RovingTabContainerWidget<MenuItemWidget> implements ExpandableWidget<HTMLDivElement> {
    private expansionScope?: ExpansionScope;

    constructor(orientation: RovingDirection = 'vertical') {
        super(orientation, 'menu');
    }

    protected override destructor() {
        this.collapse({ mode: CollapseMode.DESTROY });
    }

    /**
     * Appends a separator after the current rows. The separator is not a child widget, so the roving tab index skips
     * it, and `clear()` removes it from the DOM along with the rows.
     */
    public addSeparator(): SeparatorWidget {
        const sep = new SeparatorWidget(this.elem.ownerDocument);
        this.elem.appendChild(sep.getElement());
        return sep;
    }

    public toggleChildEnabledByIndex(index: number, enabled: boolean): void {
        this.children.at(index)?.setEnabled(enabled);
    }

    protected override onChildAdded(child: MenuItemWidget): void {
        super.onChildAdded(child);
        child.addListener('mouseenter', this.handleMouseEnter);
        child.addListener('mousemove', this.handleMouseMove);
        child.addListener('keydown', this.handleKeyDown);
    }

    protected override onChildRemoved(child: MenuItemWidget): void {
        super.onChildRemoved(child);
        child.removeListener('mouseenter', this.handleMouseEnter);
        child.removeListener('mousemove', this.handleMouseMove);
        child.removeListener('keydown', this.handleKeyDown);
    }

    private readonly handleMouseEnter = (_ev: WidgetEvent, current: MenuItemWidget) => {
        if (!current.hasPopup()) {
            this.collapseExpandedSubMenu(undefined);
        }
    };

    private readonly handleMouseMove = (_ev: WidgetEvent, current: MenuItemWidget) => {
        current.focus({ preventScroll: true });
    };

    private readonly handleKeyDown = ({ sourceEvent }: KeyboardWidgetEvent) => {
        if (this.expansionScope == null || !hasNoModifiers(sourceEvent)) return;
        const backKey = isDirectionRtl(this.elem) ? 'ArrowRight' : 'ArrowLeft';
        if (sourceEvent.key === 'Escape' || sourceEvent.key === backKey) {
            this.collapse({ mode: CollapseMode.CLOSE });
        }
    };

    public addSubMenu(): { subMenuButton: MenuItemWidget; subMenu: MenuWidget } {
        const subMenuButton = new MenuItemWidget();
        const subMenu = new MenuWidget(this.orientation);
        subMenu.id = createElementId();

        const expand = () => {
            this.collapseExpandedSubMenu(subMenu);
            subMenuButton.expandControlled();
        };

        const arrowOpener = (ev: KeyboardWidgetEvent) => {
            const openKey = isDirectionRtl(this.elem) ? 'ArrowLeft' : 'ArrowRight';
            if (hasNoModifiers(ev.sourceEvent) && ev.sourceEvent.code === openKey) {
                expand();
            }
        };

        subMenuButton.setControlled(subMenu);
        subMenuButton.setAriaHasPopup('menu');
        subMenuButton.addListener('click', expand);
        subMenuButton.addListener('mouseenter', expand);
        subMenuButton.addListener('keydown', arrowOpener);
        this.addChild(subMenuButton);
        return { subMenuButton, subMenu };
    }

    private collapseExpandedSubMenu(newSubMenu: MenuWidget | undefined) {
        const { expansionScope } = this;
        if (!expansionScope) return;

        expansionScope.expandedSubMenu?.collapse({ mode: CollapseMode.SIDLING_OPENED });
        expansionScope.expandedSubMenu = newSubMenu;
    }

    expand(opts: ExpandOpts): void {
        if (this.expansionScope != null) return; // already open

        const opener = Opener.fromEvent(opts.sourceEvent);
        this.expansionScope = {
            opener,
            expandedSubMenu: undefined,
            removeOutsidePressListener: addOutsidePressListener(this.elem, () =>
                this.collapse({ mode: CollapseMode.ABORT })
            ),
        };
        opener?.setAriaExpanded(true);

        this.internalListener?.dispatch('expand-widget', this, { type: 'expand-widget' });
        this.children[0]?.focus({ preventScroll: true });
    }

    collapse(opts?: CollapseOpts): void {
        const { mode = CollapseMode.CLOSE } = opts ?? {};

        if (this.expansionScope === undefined) return;
        const { opener, expandedSubMenu, removeOutsidePressListener } = this.expansionScope;
        this.expansionScope = undefined; // stop re-entrance

        expandedSubMenu?.collapse({ mode: CollapseMode.PARENT_CLOSED });
        opener?.setAriaExpanded(false);
        if (mode === CollapseMode.CLOSE) {
            opener?.focus({ preventScroll: true });
        }
        removeOutsidePressListener();

        this.internalListener?.dispatch('collapse-widget', this, { type: 'collapse-widget', mode });
    }
}

/** Calls `onPress` when a mouse (primary or secondary button) or touch press starts outside `elem`. */
function addOutsidePressListener(elem: HTMLElement, onPress: () => void): () => void {
    const win = elem.ownerDocument.defaultView!;
    // A listener outside a shadow root sees its host as the target, so look for the element along the composed path.
    const isOutside = (event: Event) => !event.composedPath().includes(elem);
    const removeMouse = attachListener(win, 'mousedown', (event: MouseEvent) => {
        if ((event.button === 0 || event.button === 2) && isOutside(event)) onPress();
    });
    const removeTouch = attachListener(win, 'touchstart', (event: TouchEvent) => {
        // Target touches all started on the event's target, so the event's path covers them.
        if (event.targetTouches.length > 0 && isOutside(event)) onPress();
    });
    return () => {
        removeMouse();
        removeTouch();
    };
}
