import * as core from 'ag-charts-core';
import { NativeWidget as RegionWidget } from 'ag-charts-core';

declare class NativeWidget {
    constructor(elem: HTMLElement);
    getElement(): HTMLElement;
    addChild(child: NativeWidget): void;
}
declare const _Widget: { NativeWidget: typeof NativeWidget };
declare const widget: NativeWidget | undefined;
declare const overlay: { getElement(rect: object): HTMLElement };
declare const div: HTMLDivElement;
declare function useReader(reader: () => HTMLElement): void;

// Flagged: the raw element escapes the Widget.
export function test_escapes() {
    widget!.getElement().focus();
    widget?.getElement().focus();
}

// Flagged: every other route to the accessor.
export function test_accessor_routes() {
    widget!['getElement']().focus();
    widget![`getElement`]().focus();
    const readElement = widget!.getElement.bind(widget);
    useReader(widget!.getElement);
    return readElement;
}

// Allowed: a `getElement` that takes arguments is not the Widget accessor.
export function test_overlay_renderer() {
    return overlay.getElement({});
}

// Allowed: a recorded escape with a reason, next-line or same-line.
export function test_recorded_escape() {
    // eslint-disable-next-line aglint/widget-boundary -- the reason this site is exempt
    widget!.getElement().focus();
    return widget!.getElement(); // eslint-disable-line aglint/widget-boundary -- the reason this site is exempt
}

// Flagged: an exemption with no reason, or an empty one.
export function test_directive_without_reason() {
    // eslint-disable-next-line aglint/widget-boundary
    widget!.getElement().focus();
    // eslint-disable-next-line aglint/widget-boundary --
    widget!.getElement().focus();
    // eslint-disable-next-line
    widget!.getElement().focus();
}

// Allowed: other rules' directives are none of this rule's business.
export function test_other_rule_directive() {
    // eslint-disable-next-line no-console
    console.log(widget);
}

// Flagged by reportUnusedDisableDirectives: the directive outlived the escape it allowed.
export function test_stale_directive() {
    // eslint-disable-next-line aglint/widget-boundary -- no longer escapes
    return widget;
}

// Flagged: a block disable would cover any later escape, not just one site.
/* eslint-disable aglint/widget-boundary -- covers too much */
export function test_block_disable() {
    return widget!.getElement();
}
/* eslint-enable aglint/widget-boundary */

// Flagged: fallbacks with no Phase 3 marker, by identifier, namespace, bracket access and import alias.
export const bare = new NativeWidget(div);
export const namespaced = new _Widget.NativeWidget(div);
export const bracketed = new core['NativeWidget'](div);
export const aliased = new RegionWidget(div);
export class BareSubclass extends NativeWidget {}
export class AliasedSubclass extends RegionWidget {}
export const bareExpression = class extends NativeWidget {};

// Allowed: the marker sits directly before the statement.
// TODO: Phase 3 "Common Widget Ancestor" - the reason this fallback is still needed.
export const marked = new RegionWidget(div);

// TODO: Phase 3 "Common Widget Ancestor" - a marker on a class covers its heritage clause only.
export class MarkedSubclass extends NativeWidget {
    // Flagged: the class marker does not reach the fallbacks inside the class.
    readonly icon = new NativeWidget(div);

    // TODO: Phase 3 "Common Widget Ancestor" - each fallback inside the class has its own marker.
    readonly markedIcon = new NativeWidget(div);
}

/** TODO: Phase 3 "Common Widget Ancestor" - any comment form carries the marker. */
export class MarkedByJsDoc extends NativeWidget {}

// TODO: Phase 3 "Common Widget Ancestor" - a marker on a function does not reach the statements in it.
export function test_marker_scope() {
    // Flagged: the function's marker does not reach this statement.
    const unmarked = new NativeWidget(div);
    // TODO: Phase 3 "Common Widget Ancestor" - covers only the statement that follows.
    const first = new NativeWidget(div);
    // Flagged: the marker above does not reach a later sibling statement.
    const second = new NativeWidget(div);
    first.addChild(second);
    first.addChild(unmarked);
}

// Flagged: the marker must come before the statement, not after it.
export const markedAfter = new NativeWidget(div); // TODO: Phase 3 "Common Widget Ancestor" - too late.
