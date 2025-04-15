import { getDocument } from 'ag-charts-core';
import type { Direction } from 'ag-charts-types';

import { setAttribute } from '../module-support';
import { DestroyFns } from '../util/destroy';
import {
    addAutoCloseOnBlurEventListener,
    addEscapeEventListener,
    addMouseCloseListener,
    addOverrideFocusVisibleEventListener,
    addTouchCloseListener,
    getLastFocus,
} from '../util/keynavUtil';
import { RovingTabContainerWidget } from './rovingTabContainerWidget';
import type { WidgetEvent } from './widgetEvents';

type OpenScope = {
    lastFocus: HTMLElement | undefined;
    lastFocusAborted: boolean;
    removers: DestroyFns;
    abort(): void;
    close(): void;
};

export class MenuWidget extends RovingTabContainerWidget {
    private openScope?: OpenScope;

    constructor(orientation: Direction = 'horizontal') {
        super(orientation, 'menu');
    }

    protected override destructor() {
        // Nothing to destroy.
    }

    public addSeparator(): Element {
        const sep = getDocument().createElement('div');
        this.elem.appendChild(sep);
        return sep;
    }

    public open(event: WidgetEvent, opts?: { overrideFocusVisible?: boolean; autoCloseOnBlur?: boolean }): void {
        const { autoCloseOnBlur = false, overrideFocusVisible = undefined } = opts ?? {};
        this.openScope = {
            lastFocus: getLastFocus(event.sourceEvent),
            lastFocusAborted: false,
            abort: () => this.abort(),
            close: () => this.selfClose(),
            removers: new DestroyFns(),
        };
        const buttons: HTMLElement[] = this.children.map((value) => value.getElement());
        setAttribute(this.openScope.lastFocus, 'aria-expanded', true);

        addMouseCloseListener(this.openScope.removers, this.elem, this.openScope.abort);
        addTouchCloseListener(this.openScope.removers, this.elem, this.openScope.abort);
        addEscapeEventListener(this.openScope.removers, this.elem, this.openScope.close);
        if (autoCloseOnBlur === true) {
            addAutoCloseOnBlurEventListener(this.openScope.removers, buttons, this.openScope.close);
        }
        if (overrideFocusVisible !== undefined) {
            addOverrideFocusVisibleEventListener(this.openScope.removers, this.elem, buttons, overrideFocusVisible);
        }

        this.children[0]?.focus({ preventScroll: true });
    }

    private selfClose() {
        if (this.openScope === undefined) return;
        const { lastFocus, lastFocusAborted, removers } = this.openScope;

        setAttribute(lastFocus, 'aria-expanded', false);
        if (!lastFocusAborted) {
            lastFocus?.focus({ preventScroll: true });
        }
        removers.destroy();

        this.internalListener?.dispatch('close-widget', this, { type: 'close-widget' });
        this.openScope = undefined;
    }

    public close() {
        this.selfClose();
    }

    private abort() {
        this.openScope!.lastFocusAborted = true;
        this.selfClose();
    }
}
