import { useCallback, useState } from 'react';
import type { JsObjectSelection, JsObjectSelectionProperty } from '../types';
import type { JsonModel } from './model';
import { getSelectionReferenceId } from './getObjectReferenceId';
import { smoothScrollIntoView } from '@utils/smoothScrollIntoView';
import { getTopLevelSelection, getTopSelection } from './modelPath';
import { TOP_LEVEL_OPTIONS_TO_LIMIT_CHILDREN } from '../constants';

export function useJsObjectSelection({ model }: { model: JsonModel }) {
    const [selection, setSelection] = useState<JsObjectSelection>(getTopSelection({ model, hideChildren: true }));

    const handleSelection = useCallback(
        (newSelection: JsObjectSelection) => {
            const { path } = newSelection;
            const isTopLevelSelection = path.length === 0;

            if (isTopLevelSelection) {
                const { propName } = newSelection as JsObjectSelectionProperty;
                const onlyShowToDepth = TOP_LEVEL_OPTIONS_TO_LIMIT_CHILDREN.includes(propName) ? 1 : undefined;
                setSelection({ ...newSelection, onlyShowToDepth });
                smoothScrollIntoView('#top');
            } else {
                const [newTopLevelPathItem] = newSelection.path;
                const [currentTopLevelPathItem] = selection.path;
                const isCurrentTopLevelSelection = currentTopLevelPathItem === newTopLevelPathItem;
                if (!isCurrentTopLevelSelection) {
                    const newTopLevelSelection = getTopLevelSelection({ pathItem: newTopLevelPathItem, model });
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
            }
        },
        [selection]
    );

    return {
        selection,
        handleSelection,
    };
}
