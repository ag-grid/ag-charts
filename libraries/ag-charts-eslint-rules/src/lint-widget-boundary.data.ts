declare class NativeWidget {
    constructor(elem: HTMLElement);
    getElement(): HTMLElement;
    addChild(child: NativeWidget): void;
}
declare const _Widget: { NativeWidget: typeof NativeWidget };
declare const widget: NativeWidget | undefined;
declare const overlay: { getElement(rect: object): HTMLElement };
declare const div: HTMLDivElement;

// Flagged: the raw element escapes the Widget.
export function test_escapes() {
    widget!.getElement().focus();
    widget?.getElement().focus();
}

// Allowed: a recorded escape. The directive itself must name a reason.
export function test_recorded_escape() {
    // eslint-disable-next-line aglint/widget-boundary -- the reason this site is exempt
    return widget!.getElement();
}

// Flagged by reportUnusedDisableDirectives: the directive outlived the escape it allowed.
export function test_stale_directive() {
    // eslint-disable-next-line aglint/widget-boundary -- no longer escapes
    return widget;
}

// Allowed: a `getElement` that takes arguments is not the Widget accessor.
export function test_overlay_renderer() {
    return overlay.getElement({});
}

// Flagged: fallbacks with no Phase 3 marker, by identifier and by namespace.
export const bare = new NativeWidget(div);
export const namespaced = new _Widget.NativeWidget(div);
export class BareSubclass extends NativeWidget {}
export const bareExpression = class extends NativeWidget {};

// Allowed: the marker sits directly before the statement.
// TODO: Phase 3 "Common Widget Ancestor" - the reason this fallback is still needed.
export const marked = new NativeWidget(div);

// TODO: Phase 3 "Common Widget Ancestor" - a marker on a class covers the fallbacks inside it.
export class MarkedSubclass extends NativeWidget {
    readonly icon = new NativeWidget(div);
}

/** TODO: Phase 3 "Common Widget Ancestor" - any comment form carries the marker. */
export class MarkedByJsDoc extends NativeWidget {}

export function test_marker_scope() {
    // TODO: Phase 3 "Common Widget Ancestor" - covers only the statement that follows.
    const first = new NativeWidget(div);
    // Flagged: the marker above does not reach a later sibling statement.
    const second = new NativeWidget(div);
    first.addChild(second);
}

// Flagged: the marker must come before the statement, not after it.
export const markedAfter = new NativeWidget(div); // TODO: Phase 3 "Common Widget Ancestor" - too late.
