import {
    type AgDocumentLike,
    PREV_NEXT_KEYS,
    getAttribute,
    hasNoModifiers,
    setAttribute,
    toAgDocument,
} from 'ag-charts-core';

import type { ButtonWidget } from './buttonWidget';
import type { MenuItemWidget } from './menuItemWidget';
import type { NativeWidget } from './nativeWidget';
import type { RovingDirection } from './rovingDirection';
import type { SliderWidget } from './sliderWidget';
import { Widget } from './widget';
import type { FocusWidgetEvent, KeyboardWidgetEvent } from './widgetEvents';

type RovingChildWidgets = SliderWidget | ButtonWidget | MenuItemWidget | NativeWidget;
type RovingKeys = (typeof PREV_NEXT_KEYS)[keyof typeof PREV_NEXT_KEYS];

export abstract class RovingTabContainerWidget<TChildWidget extends RovingChildWidgets> extends Widget<
    HTMLDivElement,
    TChildWidget
> {
    private focusedChildIndex = 0;

    public get orientation(): RovingDirection {
        return getAttribute(this.elem, 'aria-orientation') ?? 'both';
    }
    public set orientation(orientation: RovingDirection) {
        setAttribute(this.elem, 'aria-orientation', orientation === 'both' ? undefined : orientation);
    }

    constructor(initialOrientation: RovingDirection, role: 'toolbar' | 'list' | 'menu', document?: AgDocumentLike) {
        const resolvedDocument = toAgDocument(document);
        if (!resolvedDocument) {
            throw new Error('AG Charts - unable to resolve document');
        }
        const element = resolvedDocument.createElement('div');
        super(element);
        setAttribute(this.elem, 'role', role);
        this.orientation = initialOrientation;
    }

    override focus() {
        this.children[this.focusedChildIndex]?.focus();
    }

    public clear() {
        this.focusedChildIndex = 0;
        for (const child of this.children) {
            this.removeChildListeners(child);
            child.parent = undefined;
        }
        this.elem.textContent = '';
        this.children.length = 0;
    }

    private addChildListeners(child: RovingChildWidgets): void {
        child.addListener('focus', this.onChildFocus);
        child.addListener('keydown', this.onChildKeyDown);
    }

    private removeChildListeners(child: RovingChildWidgets): void {
        child.removeListener('focus', this.onChildFocus);
        child.removeListener('keydown', this.onChildKeyDown);
    }

    protected override onChildAdded(child: RovingChildWidgets): void {
        this.addChildListeners(child);
        child.setTabIndex(this.children.length === 1 ? 0 : -1);
    }

    protected override onChildRemoved(removedChild: RovingChildWidgets): void {
        this.removeChildListeners(removedChild);

        // Repair `this.focusedChildIndex` and `this.children[].index`
        const { focusedChildIndex, children } = this;
        const removedFocusedChild = focusedChildIndex === removedChild.index;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.index === focusedChildIndex) {
                this.focusedChildIndex = i;
            }
            child.index = i;
        }
        // Repair `this.children[this.focusedChildIndex].tabIndex`
        if (removedFocusedChild) {
            // Fall back to `focusChildIndex - 1` (if the child at the end of the array is removed)
            const newFocusChild: RovingChildWidgets | undefined =
                children[focusedChildIndex] ?? children[focusedChildIndex - 1];
            if (newFocusChild) {
                this.focusedChildIndex = newFocusChild.index;
                newFocusChild.setTabIndex(0);
            } else {
                this.focusedChildIndex = 0; // this happens when this.children ends up empty
            }
        }
    }

    private readonly onChildFocus = (_event: FocusWidgetEvent, child: RovingChildWidgets): void => {
        const oldFocus = this.children[this.focusedChildIndex];
        this.focusedChildIndex = child.index;
        oldFocus?.setTabIndex(-1);
        child.setTabIndex(0);
    };

    private readonly onChildKeyDown = (event: KeyboardWidgetEvent, child: RovingChildWidgets): void => {
        const rovingOrientation = this.orientation;
        const [primaryKeys, secondaryKeys]: [RovingKeys, RovingKeys | undefined] =
            rovingOrientation === 'both'
                ? [PREV_NEXT_KEYS['horizontal'], PREV_NEXT_KEYS['vertical']]
                : [PREV_NEXT_KEYS[rovingOrientation], undefined];

        let targetIndex = -1;
        if (hasNoModifiers(event.sourceEvent)) {
            const key = event.sourceEvent.key;
            if (key === primaryKeys.nextKey || key === secondaryKeys?.nextKey) {
                targetIndex = child.index + 1;
            } else if (key === primaryKeys.prevKey || key === secondaryKeys?.prevKey) {
                targetIndex = child.index - 1;
            }
        }
        this.children[targetIndex]?.focus();
    };
}
