import { useCallback, useState } from 'react';
import type { JsObjectSelection, JsObjectSelectionProperty } from '../types';
import type { JsonModel } from './model';
import { getSelectionReferenceId } from './getObjectReferenceId';
import { smoothScrollIntoView } from '@utils/smoothScrollIntoView';
import { getTopLevelSelection, getTopSelection } from './modelPath';
import { TOP_LEVEL_OPTIONS_TO_LIMIT_CHILDREN } from '../constants';

function selectionHasChanged({
    selection,
    newSelection,
}: {
    selection: JsObjectSelection;
    newSelection: JsObjectSelection;
}): boolean {
    return JSON.stringify(newSelection.path) !== JSON.stringify(selection.path);
}

export function useJsObjectSelection({ model }: { model: JsonModel }) {
    const [selection, setSelection] = useState<JsObjectSelection>(getTopSelection({ model, hideChildren: true }));

    const handleSelection = useCallback(
        (newSelection: JsObjectSelection) => {
            const { path } = newSelection;
            const isTopLevelSelection = path.length === 0;

            if (isTopLevelSelection) {
                const { propName } = newSelection as JsObjectSelectionProperty;
                const shouldLimitChildren = TOP_LEVEL_OPTIONS_TO_LIMIT_CHILDREN.includes(propName);
                const shouldLimitChildrenDepth = shouldLimitChildren ? 1 : undefined;
                const onlyShowToDepth =
                    newSelection.onlyShowToDepth === undefined
                        ? shouldLimitChildrenDepth
                        : newSelection.onlyShowToDepth;
                setSelection({ ...newSelection, onlyShowToDepth });
                smoothScrollIntoView('#top');
            } else {
                try {
                    const [newTopLevelPathItem] = newSelection.path;
                    if (selectionHasChanged({ selection, newSelection })) {
                        const newTopLevelSelection = getTopLevelSelection({ selection: newSelection, model });
                        if (newTopLevelSelection) {
                            setSelection(newTopLevelSelection);
                        } else {
                            // eslint-disable-next-line no-console
                            console.warn('No top level selection found:', {
                                newTopLevelPathItem,
                                newSelection,
                            });
                        }
                    }

                    const id = getSelectionReferenceId(newSelection);
                    // Scroll to top to reset scroll position
                    smoothScrollIntoView('#top');
                    // Wait for one render cycle before scrolling to position
                    setTimeout(() => {
                        smoothScrollIntoView(`#${id}`);
                    }, 0);
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.warn(error, { selection, newSelection });
                }
            }
        },
        [selection]
    );

    return {
        selection,
        handleSelection,
    };
}
