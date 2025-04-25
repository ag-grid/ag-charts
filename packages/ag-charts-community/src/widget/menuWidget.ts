import { getDocument } from 'ag-charts-core';
import type { Direction } from 'ag-charts-types';

import { setAttribute } from '../util/attributeUtil';
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
    removers: DestroyFns;
    abort: () => void;
    close: () => void;
};

enum CloseEnum { CLOSE = '0', ABORT = '1', DESTROY = '2' };

export class MenuWidget extends RovingTabContainerWidget {
    private openScope?: OpenScope;

    constructor(orientation: Direction = 'vertical') {
        super(orientation, 'menu');
    }

    protected override destructor() {
        this.selfClose(CloseEnum.DESTROY);
    }

    public addSeparator(): Element {
        const sep = getDocument().createElement('div');
        this.elem.appendChild(sep);
        return sep;
    }

    public addSubMenu(): { subMenuButton: ButtonWidget; subMenu: MenuWidget } {
        const subMenuButton = new ButtonWidget();
        const subMenu = new MenuWidget();
        const accessibleOpener = (ev: WidgetEvent) => {
            // Disabled buttons are focusable and can receive events, but have aria-disabled="true"
            if (!subMenuButton.isDisabled()) {
                subMenu.open(ev);
            }
        };
        subMenuButton.setAriaHasPopup('menu');
        subMenuButton.addListener('click', accessibleOpener);
        subMenuButton.addListener('mouseenter', accessibleOpener);
        this.addChild(subMenuButton);
        return { subMenuButton, subMenu };
    }

    public open(event: WidgetEvent, opts?: { overrideFocusVisible?: boolean }): void {
        const { overrideFocusVisible = undefined } = opts ?? {};
        if (this.openScope != null) return; // already open

        this.openScope = {
            lastFocus: getLastFocus(event.sourceEvent),
            abort: () => this.selfClose(CloseEnum.ABORT),
            close: () => this.selfClose(CloseEnum.CLOSE),
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

    private selfClose(mode: CloseEnum) {
        if (this.openScope === undefined) return;
        const { lastFocus, removers } = this.openScope;
        this.openScope = undefined; // stop re-entrance

        setAttribute(lastFocus, 'aria-expanded', false);
        if (mode === CloseEnum.CLOSE) {
            lastFocus?.focus({ preventScroll: true });
        }
        removers.destroy();

        this.internalListener?.dispatch('close-widget', this, { type: 'close-widget' });
    }

    public close() {
        this.selfClose(CloseEnum.CLOSE);
    }
}
