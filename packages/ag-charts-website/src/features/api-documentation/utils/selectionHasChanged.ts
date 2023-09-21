import type { JsObjectPropertiesViewConfig, JsObjectSelection, JsObjectSelectionProperty } from '../types';
import { getShouldLimitChildren } from './getShouldLimitChildren';

export function selectionHasChanged({
    selection,
    newSelection,
    config,
}: {
    selection: JsObjectSelection;
    newSelection: JsObjectSelection;
    config?: JsObjectPropertiesViewConfig;
}): boolean {
    const selectionPropName = (selection as JsObjectSelectionProperty).propName;
    const newSelectionPropName = (newSelection as JsObjectSelectionProperty).propName;
    if ((selection.isRoot && !newSelection.isRoot) || (!selection.isRoot && newSelection.isRoot)) {
        return true;
    } else if (selection.path.length === 0 && newSelection.path.length === 0) {
        return selectionPropName !== newSelectionPropName;
    }

    const selectionShouldLimitChildren = getShouldLimitChildren({
        config,
        path: selection.path,
        pathItem: selectionPropName,
    });
    const newSelectionShouldLimitChildren = getShouldLimitChildren({
        config,
        path: newSelection.path,
        pathItem: newSelectionPropName,
    });
    const limitChildrenIsDifferent = selectionShouldLimitChildren !== newSelectionShouldLimitChildren;

    return JSON.stringify(newSelection.path) !== JSON.stringify(selection.path) || limitChildrenIsDifferent;
}
