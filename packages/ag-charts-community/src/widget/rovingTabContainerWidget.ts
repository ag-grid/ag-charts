import { getAttribute, setAttribute } from '../util/attributeUtil';
import { getDocument } from '../util/dom';
import { PREV_NEXT_KEYS, hasNoModifiers } from '../util/keynavUtil';
import type { ButtonWidget } from './buttonWidget';
import type { NativeWidget } from './nativeWidget';
import type { RovingDirection } from './rovingDirection';
import type { SliderWidget } from './sliderWidget';
import { Widget } from './widget';
import type { FocusWidgetEvent, KeyboardWidgetEvent } from './widgetEvents';

type RovingChildWidgets = SliderWidget | ButtonWidget | NativeWidget;
type RovingKeys = (typeof PREV_NEXT_KEYS)[keyof typeof PREV_NEXT_KEYS];

export abstract class RovingTabContainerWidget extends Widget<HTMLDivElement, RovingChildWidgets> {
    private focusedChildIndex = 0;

    public get orientation(): RovingDirection {
        return getAttribute(this.elem, 'aria-orientation') ?? 'both';
    }
    public set orientation(orientation: RovingDirection) {
        setAttribute(this.elem, 'aria-orientation', orientation !== 'both' ? orientation : undefined);
    }

    constructor(initialOrientation: RovingDirection, role: 'toolbar' | 'list') {
        super(getDocument().createElement('div'));
        this.orientation = initialOrientation;
        setAttribute(this.elem, 'role', role);
    }

    override focus() {
        this.children[this.focusedChildIndex]?.focus();
    }

    protected override onChildAdded(child: RovingChildWidgets): void {
        child.addListener('focus', this.onChildFocus);
        child.addListener('keydown', this.onChildKeyDown);
        child.setTabIndex(this.children.length === 1 ? 0 : -1);
    }

    protected override onChildRemoved(child: RovingChildWidgets): void {
        child.removeListener('focus', this.onChildFocus);
        child.removeListener('keydown', this.onChildKeyDown);
    }

    private readonly onChildFocus = (child: RovingChildWidgets, _event: FocusWidgetEvent): void => {
        const oldFocus = this.children[this.focusedChildIndex];
        this.focusedChildIndex = child.index;
        oldFocus?.setTabIndex(-1);
        child.setTabIndex(0);
    };

    private readonly onChildKeyDown = (child: RovingChildWidgets, event: KeyboardWidgetEvent): void => {
        const rovingOrientation = this.orientation;
        const [primaryKeys, seconardKeys]: [RovingKeys, RovingKeys | undefined] =
            rovingOrientation === 'both'
                ? [PREV_NEXT_KEYS['horizontal'], PREV_NEXT_KEYS['vertical']]
                : [PREV_NEXT_KEYS[rovingOrientation], undefined];

        let targetIndex = -1;
        if (hasNoModifiers(event.sourceEvent)) {
            const key = event.sourceEvent.key;
            if (key === primaryKeys.nextKey || key === seconardKeys?.nextKey) {
                targetIndex = child.index + 1;
            } else if (key === primaryKeys.prevKey || key === seconardKeys?.prevKey) {
                targetIndex = child.index - 1;
            }
        }
        this.children[targetIndex]?.focus();
    };
}
