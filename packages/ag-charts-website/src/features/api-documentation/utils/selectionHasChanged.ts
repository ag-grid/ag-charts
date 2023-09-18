import type { JsObjectSelection, JsObjectSelectionProperty } from '../types';

export function selectionHasChanged({
    selection,
    newSelection,
}: {
    selection: JsObjectSelection;
    newSelection: JsObjectSelection;
}): boolean {
    if ((selection.isRoot && !newSelection.isRoot) || (!selection.isRoot && newSelection.isRoot)) {
        return true;
    } else if (selection.path.length === 0 && newSelection.path.length === 0) {
        return (
            (selection as JsObjectSelectionProperty).propName !== (newSelection as JsObjectSelectionProperty).propName
        );
    }

    return JSON.stringify(newSelection.path) !== JSON.stringify(selection.path);
}
