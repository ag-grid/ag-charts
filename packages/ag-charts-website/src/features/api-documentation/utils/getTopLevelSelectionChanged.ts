import type { JsObjectPropertiesViewConfig, JsObjectSelection, JsObjectSelectionProperty } from '../types';
import { getShouldLimitChildren } from './getShouldLimitChildren';
import type { JsonModel } from './model';
import { getFullPath, getTopLevelSelection } from './modelPath';

interface TopLevelSelectionChangedResult {
    hasChanged: boolean;
    newTopLevelSelection?: JsObjectSelection;
}

export function getTopLevelSelectionChanged({
    selection,
    topLevelSelection,
    newSelection,
    model,
    config,
}: {
    selection: JsObjectSelection;
    topLevelSelection: JsObjectSelection;
    newSelection: JsObjectSelection;
    model: JsonModel;
    config?: JsObjectPropertiesViewConfig;
}): TopLevelSelectionChangedResult {
    const topLevelSelectionPropName = (topLevelSelection as JsObjectSelectionProperty).propName;
    const newSelectionPropName = (newSelection as JsObjectSelectionProperty).propName;
    const newTopLevelSelection = getTopLevelSelection({ selection: newSelection, model, config });
    if ((topLevelSelection.isRoot && !newSelection.isRoot) || (!topLevelSelection.isRoot && newSelection.isRoot)) {
        return {
            hasChanged: true,
            newTopLevelSelection,
        };
    } else if (topLevelSelection.path.length === 0 && newSelection.path.length === 0) {
        return {
            hasChanged: topLevelSelectionPropName !== newSelectionPropName,
            newTopLevelSelection,
        };
    }

    const selectionShouldLimitChildren = getShouldLimitChildren({
        config,
        path: selection.path,
        pathItem: (selection as JsObjectSelectionProperty).propName,
    });
    const newSelectionShouldLimitChildren = getShouldLimitChildren({
        config,
        path: newSelection.path,
        pathItem: newSelectionPropName,
    });
    const limitChildrenIsDifferent = selectionShouldLimitChildren !== newSelectionShouldLimitChildren;

    const newTopLevelSelectionPath = getFullPath(newTopLevelSelection!);
    const topLevelSelectionPath = getFullPath(topLevelSelection!);
    const hasChanged =
        JSON.stringify(newTopLevelSelectionPath) !== JSON.stringify(topLevelSelectionPath) || limitChildrenIsDifferent;
    return {
        hasChanged,
        newTopLevelSelection,
    };
}
