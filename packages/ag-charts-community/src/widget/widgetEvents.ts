import type { AreExact, DeepReadonly } from 'ag-charts-core';

import type { CollapseWidgetEvent, ExpandControlledWidgetEvent, ExpandWidgetEvent } from './expandableWidget';

// These types cannot be derived from `WIDGET_META`, because that would cause cyclical-referencing:
type FocusWidgetEventType = 'blur' | 'focus';
type KeyboardWidgetEventType = 'keyup' | 'keydown';
type MouseWidgetEventType = 'contextmenu' | 'click' | 'dblclick' | 'mouseenter' | 'mousemove' | 'mouseleave';
type TouchWidgetEventType = 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel';
type DragWidgetEventType = 'drag-start' | 'drag-move' | 'drag-end';
type WidgetEventType =
    /* Union of all allowed `type` values for widget events: */
    | 'change'
    | 'wheel'
    | FocusWidgetEventType
    | KeyboardWidgetEventType
    | MouseWidgetEventType
    | TouchWidgetEventType
    | DragWidgetEventType
    | (CollapseWidgetEvent | ExpandControlledWidgetEvent | ExpandWidgetEvent)['type'];

// Verify that `WIDGET_META` has no missing event-type and no spurious entries:
true satisfies AreExact<WidgetEventType, WidgetMetaKeys>;
true satisfies AreExact<FocusWidgetEventType, DerivedKeysForWidgetEvent<FocusWidgetEvent>>;
true satisfies AreExact<KeyboardWidgetEventType, DerivedKeysForWidgetEvent<KeyboardWidgetEvent>>;
true satisfies AreExact<MouseWidgetEventType, DerivedKeysForWidgetEvent<MouseWidgetEvent>>;
true satisfies AreExact<TouchWidgetEventType, DerivedKeysForWidgetEvent<TouchWidgetEvent>>;
true satisfies AreExact<DragWidgetEventType, DerivedKeysForWidgetEvent<DragWidgetEvent>>;

// Synthetic types
type KeyboardSyntheticMouseWidgetEventType = 'click';
type TouchSyntheticMouseWidgetEventType = 'click' | 'dblclick';

export type WidgetEvent<T extends WidgetEventType = WidgetEventType> = {
    readonly type: T;
    readonly sourceEvent: Event;
};

export type FocusWidgetEvent<T extends FocusWidgetEventType = FocusWidgetEventType> = {
    readonly type: T;
    readonly sourceEvent: FocusEvent;
};

export type KeyboardWidgetEvent<T extends KeyboardWidgetEventType = KeyboardWidgetEventType> = {
    readonly type: T;
    readonly sourceEvent: KeyboardEvent;
};

export type KeyboardSyntheticMouseWidgetEvent<
    T extends MouseWidgetEventType & KeyboardSyntheticMouseWidgetEventType = KeyboardSyntheticMouseWidgetEventType,
> = {
    readonly type: T;
    readonly device: 'keyboard';
    readonly sourceEvent: KeyboardEvent;
};

export type TouchWidgetEvent<T extends TouchWidgetEventType = TouchWidgetEventType> = {
    readonly type: T;
    readonly sourceEvent: TouchEvent;
};

export type TouchSyntheticMouseWidgetEvent<
    T extends MouseWidgetEventType & TouchSyntheticMouseWidgetEventType = TouchSyntheticMouseWidgetEventType,
> = {
    readonly type: T;
    readonly device: 'touch';
    readonly offsetX: number;
    readonly offsetY: number;
    readonly clientX: number;
    readonly clientY: number;
    readonly currentX: number;
    readonly currentY: number;
    readonly sourceEvent: TouchEvent;
};

export type NativeMouseWidgetEvent<T extends MouseWidgetEventType = MouseWidgetEventType> = {
    readonly type: T;
    readonly device: 'mouse';
    readonly offsetX: number;
    readonly offsetY: number;
    readonly clientX: number;
    readonly clientY: number;
    readonly currentX: number;
    readonly currentY: number;
    readonly sourceEvent: MouseEvent;
};

export type MouseWidgetEvent<T extends MouseWidgetEventType = MouseWidgetEventType> =
    | NativeMouseWidgetEvent<T>
    | (T extends TouchSyntheticMouseWidgetEventType ? TouchSyntheticMouseWidgetEvent<T> : never)
    | (T extends KeyboardSyntheticMouseWidgetEventType ? KeyboardSyntheticMouseWidgetEvent<T> : never);

export type WheelWidgetEvent = {
    readonly type: 'wheel';
    readonly offsetX: number;
    readonly offsetY: number;
    readonly clientX: number;
    readonly clientY: number;
    readonly deltaX: number;
    readonly deltaY: number;
    readonly sourceEvent: WheelEvent;
};

export type ClickLikeEvent = MouseWidgetEvent<'click' | 'dblclick'> & { device: 'mouse' | 'touch' };
export type HoverLikeEvent = ClickLikeEvent | MouseWidgetEvent<'mousemove'> | DragWidgetEvent<'drag-move'>;

// `originDelta` is the offset relative to position of the HTML element when the drag initiated.
// This is helpful for elements that move during drag actions, like navigator sliders.
export type DragWidgetEvent<T extends DragWidgetEventType = DragWidgetEventType> =
    | {
          readonly type: T;
          readonly device: 'mouse';
          readonly offsetX: number;
          readonly offsetY: number;
          readonly clientX: number;
          readonly clientY: number;
          readonly currentX: number;
          readonly currentY: number;
          readonly originDeltaX: number;
          readonly originDeltaY: number;
          readonly sourceEvent: MouseEvent;
      }
    | {
          readonly type: T;
          readonly device: 'touch';
          readonly offsetX: number;
          readonly offsetY: number;
          readonly clientX: number;
          readonly clientY: number;
          readonly currentX: number;
          readonly currentY: number;
          readonly originDeltaX: number;
          readonly originDeltaY: number;
          readonly sourceEvent: TouchEvent;
      };

function allocMouseEvent<T extends MouseWidgetEventType>(type: T, sourceEvent: MouseEvent, current: HTMLElement) {
    const { offsetX, offsetY, clientX, clientY } = sourceEvent;
    const { currentX, currentY } = WidgetEventUtil.calcCurrentXY(current, sourceEvent);
    return { type, device: 'mouse' as const, offsetX, offsetY, clientX, clientY, currentX, currentY, sourceEvent };
}

function allocTouchEvent<T extends TouchWidgetEventType>(type: T, sourceEvent: TouchEvent, _current: HTMLElement) {
    return { type, sourceEvent };
}

export type WidgetEventMap = DerivedWidgetEvents;
export type WidgetEventMap_HTML = DerivedWidgetEventsWhereIsNative;
export type WidgetEventMap_Internal = DerivedWidgetEventsWhereIsInternal;
export type WidgetSourceEventMap_HTML = DerivedSourceEventsWhereIsNative;

function declareInternalEntry<T extends { type: WidgetEventType }>(): { isInternal: true; typeDerivation: T } {
    // We don't actually need the `isInternal` and `typeDerivation` properties at runtime; these are only used for
    // compile-time meta-programming.
    return undefined as unknown as { isInternal: true; typeDerivation: T };
}

const WIDGET_META = {
    // Event
    change: {
        isNative: true,
        allocator(sourceEvent: Event, _current: HTMLElement): WidgetEvent<'change'> {
            return { type: 'change', sourceEvent };
        },
    },

    // FocusEvent
    blur: {
        isNative: true,
        allocator(sourceEvent: FocusEvent, _current: HTMLElement): FocusWidgetEvent<'blur'> {
            return { type: 'blur', sourceEvent };
        },
    },
    focus: {
        isNative: true,
        allocator(sourceEvent: FocusEvent, _current: HTMLElement): FocusWidgetEvent<'focus'> {
            return { type: 'focus', sourceEvent };
        },
    },

    // KeyboardEvent
    keydown: {
        isNative: true,
        allocator(sourceEvent: KeyboardEvent): KeyboardWidgetEvent<'keydown'> {
            return { type: 'keydown', sourceEvent };
        },
    },
    keyup: {
        isNative: true,
        allocator(sourceEvent: KeyboardEvent): KeyboardWidgetEvent<'keyup'> {
            return { type: 'keyup', sourceEvent };
        },
    },

    // MouseEvent
    contextmenu: {
        isNative: true,
        allocator(sourceEvent: MouseEvent, current: HTMLElement): MouseWidgetEvent<'contextmenu'> {
            return allocMouseEvent('contextmenu', sourceEvent, current);
        },
    },
    click: {
        isNative: true,
        allocator(sourceEvent: MouseEvent, current: HTMLElement): MouseWidgetEvent<'click'> {
            return allocMouseEvent('click', sourceEvent, current);
        },
    },
    dblclick: {
        isNative: true,
        allocator(sourceEvent: MouseEvent, current: HTMLElement): MouseWidgetEvent<'dblclick'> {
            return allocMouseEvent('dblclick', sourceEvent, current);
        },
    },
    mouseenter: {
        isNative: true,
        allocator(sourceEvent: MouseEvent, current: HTMLElement): MouseWidgetEvent<'mouseenter'> {
            return allocMouseEvent('mouseenter', sourceEvent, current);
        },
    },
    mousemove: {
        isNative: true,
        allocator(sourceEvent: MouseEvent, current: HTMLElement): MouseWidgetEvent<'mousemove'> {
            return allocMouseEvent('mousemove', sourceEvent, current);
        },
    },
    mouseleave: {
        isNative: true,
        allocator(sourceEvent: MouseEvent, current: HTMLElement): MouseWidgetEvent<'mouseleave'> {
            return allocMouseEvent('mouseleave', sourceEvent, current);
        },
    },

    // WheelEvent
    wheel: {
        isNative: true,
        allocator(sourceEvent: WheelEvent, _current: HTMLElement): WheelWidgetEvent {
            const { offsetX, offsetY, clientX, clientY } = sourceEvent;

            // AG-10475 On Chrome (Windows), wheel clicks send deltaMode: 0 events with deltaY: -100 or +100.
            // So we divide this by 100 to give us the desired step.
            const factor = sourceEvent.deltaMode === 0 ? 0.01 : 1;
            let deltaX = sourceEvent.deltaX * factor;
            let deltaY = sourceEvent.deltaY * factor;

            // AG-11225 On Windows, unlike MacOS, wheel scrolls with shift do not automatically apply the vertical
            // scrolling to the deltaX component of the event. So we normalise that here.
            const swapXY = Math.abs(sourceEvent.deltaX) === 0 && sourceEvent.shiftKey;
            if (swapXY) {
                [deltaX, deltaY] = [deltaY, deltaX];
            }

            return { type: 'wheel', offsetX, offsetY, clientX, clientY, deltaX, deltaY, sourceEvent };
        },
    },

    // TouchEvent
    touchstart: {
        isNative: true,
        allocator(sourceEvent: TouchEvent, current: HTMLElement): TouchWidgetEvent<'touchstart'> {
            return allocTouchEvent('touchstart', sourceEvent, current);
        },
    },
    touchmove: {
        isNative: true,
        allocator(sourceEvent: TouchEvent, current: HTMLElement): TouchWidgetEvent<'touchmove'> {
            return allocTouchEvent('touchmove', sourceEvent, current);
        },
    },
    touchend: {
        isNative: true,
        allocator(sourceEvent: TouchEvent, current: HTMLElement): TouchWidgetEvent<'touchend'> {
            return allocTouchEvent('touchend', sourceEvent, current);
        },
    },
    touchcancel: {
        isNative: true,
        allocator(sourceEvent: TouchEvent, current: HTMLElement): TouchWidgetEvent<'touchcancel'> {
            return allocTouchEvent('touchcancel', sourceEvent, current);
        },
    },

    // Internal events (DragWidgetEvent, CollapseWidgetEvent, ExpandWidgetEvent, ExpandControlledWidgetEvent)
    'drag-start': declareInternalEntry<DragWidgetEvent<'drag-start'>>(),
    'drag-move': declareInternalEntry<DragWidgetEvent<'drag-move'>>(),
    'drag-end': declareInternalEntry<DragWidgetEvent<'drag-end'>>(),
    'collapse-widget': declareInternalEntry<CollapseWidgetEvent>(),
    'expand-widget': declareInternalEntry<ExpandWidgetEvent>(),
    'expand-controlled-widget': declareInternalEntry<ExpandControlledWidgetEvent>(),
} as const satisfies {
    readonly [K in string]:
        | {
              readonly isNative: true;
              readonly isInternal?: never;
              readonly allocator:
                  | ((sourceEvent: Event, current: HTMLElement) => WidgetEvent)
                  | ((sourceEvent: FocusEvent, current: HTMLElement) => FocusWidgetEvent)
                  | ((sourceEvent: KeyboardEvent, current: HTMLElement) => KeyboardWidgetEvent)
                  | ((sourceEvent: MouseEvent, current: HTMLElement) => MouseWidgetEvent)
                  | ((sourceEvent: WheelEvent, current: HTMLElement) => WheelWidgetEvent)
                  | ((sourceEvent: TouchEvent, current: HTMLElement) => TouchWidgetEvent);
          }
        | {
              readonly isNative?: never;
              readonly isInternal: true;
              readonly typeDerivation: object;
          };
};

// Verify that `WIDGET_META[K][allocator]` returns on object that satisfies `{type: K}`
type ExpectedHTMLTypeBranding = { [K in DerivedKeysWhereIsNative]: K };
type ActualHTMLTypeBranding = { [K in DerivedKeysWhereIsNative]: ReturnType<WidgetMeta[K]['allocator']>['type'] };
undefined as unknown as ActualHTMLTypeBranding satisfies ExpectedHTMLTypeBranding;

// Verify that `WIDGET_META[K][typeDerivation]` is an object that satisfies `{type: K}`
type ExpectedInternalTypeBranding = { [K in DerivedKeysWhereIsInternal]: K };
type ActualInternalTypeBranding = { [K in DerivedKeysWhereIsInternal]: WidgetMeta[K]['typeDerivation']['type'] };
undefined as unknown as ActualInternalTypeBranding satisfies ExpectedInternalTypeBranding;

type WidgetMeta = typeof WIDGET_META;
type WidgetMetaKeys = keyof WidgetMeta;

type DerivedKeysWhereIsNative = {
    [K in WidgetMetaKeys]: WidgetMeta[K] extends { readonly isNative: true } ? K : never;
}[WidgetMetaKeys];

type DerivedKeysWhereIsInternal = {
    [K in WidgetMetaKeys]: WidgetMeta[K] extends { readonly isInternal: true } ? K : never;
}[WidgetMetaKeys];

type DerivedSourceEventsWhereIsNative = {
    [K in DerivedKeysWhereIsNative]: Parameters<WidgetMeta[K]['allocator']>[0];
};
type DerivedWidgetEventsWhereIsNative = {
    [K in DerivedKeysWhereIsNative]: ReturnType<WidgetMeta[K]['allocator']>;
};
type DerivedWidgetEventsWhereIsInternal = {
    [K in DerivedKeysWhereIsInternal]: WidgetMeta[K]['typeDerivation'];
};
type DerivedWidgetEvents = DerivedWidgetEventsWhereIsNative & DerivedWidgetEventsWhereIsInternal;

type _DerivedKeysForWidgetEvent_HTML_branch<TWidgetEvent> = {
    [K in DerivedKeysWhereIsNative]: ReturnType<WidgetMeta[K]['allocator']> extends TWidgetEvent
        ? ReturnType<WidgetMeta[K]['allocator']>
        : never;
}[DerivedKeysWhereIsNative]['type'];
type _DerivedKeysForWidgetEvent_Internal_branch<TWidgetEvent> = {
    [K in DerivedKeysWhereIsInternal]: WidgetMeta[K]['typeDerivation'] extends TWidgetEvent
        ? WidgetMeta[K]['typeDerivation']
        : never;
}[DerivedKeysWhereIsInternal]['type'];
type DerivedKeysForWidgetEvent<TWidgetEvent> =
    _DerivedKeysForWidgetEvent_HTML_branch<TWidgetEvent> extends never
        ? _DerivedKeysForWidgetEvent_Internal_branch<TWidgetEvent>
        : _DerivedKeysForWidgetEvent_HTML_branch<TWidgetEvent>;

export class WidgetEventUtil {
    static alloc<K extends DerivedKeysWhereIsNative>(
        type: K,
        sourceEvent: DerivedSourceEventsWhereIsNative[K],
        current: HTMLElement
    ): DerivedWidgetEventsWhereIsNative[K] {
        const unsafeAllocator: (sourceEvent: any, current: HTMLElement) => any = WIDGET_META[type].allocator;
        return unsafeAllocator(sourceEvent, current);
    }

    static isHTMLEvent(type: WidgetMetaKeys): type is WidgetMetaKeys & keyof HTMLElementEventMap {
        const meta: DeepReadonly<{ [K in typeof type]?: { isNative?: boolean; isInternal?: boolean } }> = WIDGET_META;
        return meta[type]?.isNative === true;
    }

    static calcCurrentXY(
        current: HTMLElement,
        event: { clientX: number; clientY: number }
    ): { currentX: number; currentY: number } {
        const currentRect = current.getBoundingClientRect();
        return { currentX: event.clientX - currentRect.x, currentY: event.clientY - currentRect.y };
    }
}
