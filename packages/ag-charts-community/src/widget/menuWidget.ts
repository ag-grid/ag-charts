import { getDocument, setAttribute } from 'ag-charts-core';
import type { Direction } from 'ag-charts-types';

import { DestroyFns } from '../util/destroy';
import {
    addEscapeEventListener,
    addMouseCloseListener,
    addOverrideFocusVisibleEventListener,
    addTouchCloseListener,
    getLastFocus,
} from '../util/keynavUtil';
import { ButtonWidget } from './buttonWidget';
import { RovingTabContainerWidget } from './rovingTabContainerWidget';
import type { WidgetEvent } from './widgetEvents';

type OpenScope = {
    lastFocus: HTMLElement | undefined;
    openSubMenu: MenuWidget | undefined;
    removers: DestroyFns;
    abort: () => void;
    close: () => void;
};

enum CloseMode {
    CLOSE = '0',
    ABORT = '1',
    DESTROY = '2',
    PARENT_CLOSED = '3',
    SIDLING_OPENED = '4',
}

export class MenuWidget extends RovingTabContainerWidget {
    private openScope?: OpenScope;

    constructor(orientation: Direction = 'vertical') {
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

    public addSubMenu(): { subMenuButton: ButtonWidget; subMenu: MenuWidget } {
        const subMenuButton = new ButtonWidget();
        const subMenu = new MenuWidget();
        const accessibleOpener = (ev: WidgetEvent) => {
            const { openScope } = this;
            // Disabled buttons are focusable and can receive events, but have aria-disabled="true"
            if (openScope && !subMenuButton.isDisabled()) {
                openScope.openSubMenu?.selfClose(CloseMode.SIDLING_OPENED);
                subMenu.open(ev);
                openScope.openSubMenu = subMenu;
            }
        };
        subMenuButton.setAriaHasPopup('menu');
        subMenuButton.setAriaExpanded(false);
        subMenuButton.addListener('click', accessibleOpener);
        subMenuButton.addListener('mouseenter', accessibleOpener);
        subMenu.addListener('close-widget', () => subMenuButton.setAriaExpanded(false));
        subMenu.addListener('open-widget', () => subMenuButton.setAriaExpanded(true));
        this.addChild(subMenuButton);
        return { subMenuButton, subMenu };
    }

    public open(event: WidgetEvent, opts?: { overrideFocusVisible?: boolean }): void {
        const { overrideFocusVisible = undefined } = opts ?? {};
        if (this.openScope != null) return; // already open

        this.openScope = {
            lastFocus: getLastFocus(event.sourceEvent),
            openSubMenu: undefined,
            abort: () => this.selfClose(CloseMode.ABORT),
            close: () => this.selfClose(CloseMode.CLOSE),
            removers: new DestroyFns(),
        };
        const buttons: HTMLElement[] = this.children.map((value) => value.getElement());
        setAttribute(this.openScope.lastFocus, 'aria-expanded', true);

        addMouseCloseListener(this.openScope.removers, this.elem, this.openScope.abort);
        addTouchCloseListener(this.openScope.removers, this.elem, this.openScope.abort);
        for (const child of this.children) {
            addEscapeEventListener(this.openScope.removers, child.getElement(), this.openScope.close);
        }
        if (overrideFocusVisible !== undefined) {
            addOverrideFocusVisibleEventListener(this.openScope.removers, this.elem, buttons, overrideFocusVisible);
        }

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
        removers.destroy();

        this.internalListener?.dispatch('close-widget', this, { type: 'close-widget' });
    }

    public close() {
        this.selfClose(CloseMode.CLOSE);
    }
}
