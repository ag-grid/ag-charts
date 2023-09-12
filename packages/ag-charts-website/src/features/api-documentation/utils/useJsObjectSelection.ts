import { useCallback, useState } from 'react';
import type { JsObjectSelection, JsObjectSelectionProperty } from '../types';
import type { JsonModel } from './model';
import { getSelectionReferenceId } from './getObjectReferenceId';
import { smoothScrollIntoView } from '@utils/smoothScrollIntoView';
import { getTopLevelSelection, getTopSelection } from './modelPath';
import { TOP_LEVEL_OPTIONS_TO_HIDE_CHILDREN, TOP_LEVEL_OPTIONS_TO_LIMIT_CHILDREN } from '../constants';

function selectionHasChanged({
    selection,
    newSelection,
}: {
    selection: JsObjectSelection;
    newSelection: JsObjectSelection;
}): boolean {
    return JSON.stringify(newSelection.path) !== JSON.stringify(selection.path);
}

function scrollToId(id?: string) {
    // Scroll to top to reset scroll position
    smoothScrollIntoView('#top');

    if (id) {
        // Wait for one render cycle before scrolling to position
        setTimeout(() => {
            smoothScrollIntoView(`#${id}`);
        }, 0);
    }
}

export function useJsObjectSelection({ model }: { model: JsonModel }) {
    const rootSelection = getTopSelection({ model, hideChildren: true });
    const [topLevelSelection, setTopLevelSelection] = useState<JsObjectSelection>(rootSelection);
    const [selection, setSelection] = useState<JsObjectSelection>(rootSelection);

    const handleSelection = useCallback(
        (newSelection: JsObjectSelection) => {
            const { path } = newSelection;
            const isTopLevelSelection = path.length === 0;
            const newPropertyType = newSelection.model?.desc?.type;

            if (isTopLevelSelection && newPropertyType === 'primitive') {
                // Scroll to position, rather than filtering
                setTopLevelSelection(rootSelection);
                setSelection(rootSelection);

                const id = getSelectionReferenceId(newSelection);
                scrollToId(id);
            } else if (isTopLevelSelection) {
                const { propName } = newSelection as JsObjectSelectionProperty;
                const shouldHideChildren = TOP_LEVEL_OPTIONS_TO_HIDE_CHILDREN.includes(propName);
                const shouldLimitChildren = TOP_LEVEL_OPTIONS_TO_LIMIT_CHILDREN.includes(propName);

                let shouldLimitChildrenDepth;
                if (shouldHideChildren) {
                    shouldLimitChildrenDepth = 0;
                } else if (shouldLimitChildren) {
                    shouldLimitChildrenDepth = 1;
                }
                const onlyShowToDepth =
                    newSelection.onlyShowToDepth === undefined
                        ? shouldLimitChildrenDepth
                        : newSelection.onlyShowToDepth;
                setTopLevelSelection({ ...newSelection, onlyShowToDepth });
                setSelection(newSelection);
                smoothScrollIntoView('#top');
            } else {
                try {
                    const [newTopLevelPathItem] = newSelection.path;
                    if (selectionHasChanged({ selection: topLevelSelection, newSelection })) {
                        const newTopLevelSelection = getTopLevelSelection({ selection: newSelection, model });
                        if (newTopLevelSelection) {
                            setTopLevelSelection(newTopLevelSelection);
                        } else {
                            // eslint-disable-next-line no-console
                            console.warn('No top level selection found:', {
                                newTopLevelPathItem,
                                newSelection,
                            });
                        }
                    }
                    // NOTE: Don't change top level selection, as it hasn't changed
                    setSelection(newSelection);

                    const id = getSelectionReferenceId(newSelection);
                    scrollToId(id);
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.warn(error, { topLevelSelection, selection, newSelection });
                }
            }
        },
        [topLevelSelection, selection]
    );

    return {
        selection,
        topLevelSelection,
        handleSelection,
    };
}
