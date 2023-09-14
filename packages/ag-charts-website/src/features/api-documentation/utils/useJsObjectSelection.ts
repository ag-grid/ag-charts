import { useCallback, useState } from 'react';
import type { JsObjectSelection, JsObjectSelectionProperty, TopLevelHeaderData } from '../types';
import type { JsonModel } from './model';
import { getSelectionReferenceId } from './getObjectReferenceId';
import { smoothScrollIntoView } from '@utils/smoothScrollIntoView';
import { getTopLevelSelection, getTopSelection } from './modelPath';
import { TOP_LEVEL_OPTIONS_TO_HIDE_CHILDREN, TOP_LEVEL_OPTIONS_TO_LIMIT_CHILDREN } from '../constants';
import { formatPropertyDocumentation, removeDefaultValue } from './documentationHelpers';
import { getPropertyType } from './getPropertyType';

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
    smoothScrollIntoView({ href: '#top' });

    if (id) {
        // Wait for one render cycle before scrolling to position
        setTimeout(() => {
            smoothScrollIntoView({ href: `#${id}` });
        }, 0);
    }
}

const ROOT_HEADING = 'AgChartOptions'; // TODO: Get this from the data;
function getTopLevelHeader(selection: JsObjectSelection): TopLevelHeaderData | undefined {
    const { type, path, model } = selection;
    const description = formatPropertyDocumentation(model).join('\n');
    const descriptionWithoutDefault = removeDefaultValue(description);
    const output = {
        path,
        description,
        descriptionWithoutDefault,
    };

    if (selection.isRoot) {
        return Object.assign({}, output, {
            heading: ROOT_HEADING,
            propertyType: getPropertyType(model.tsType),
        });
    } else if (type === 'property') {
        return Object.assign({}, output, {
            heading: selection.propName,
            propertyType: (model as any).type === 'primitive' ? (model as any).tsType : model.desc?.tsType,
        });
    } else if (type === 'model') {
        return Object.assign({}, output, {
            heading: '',
            propertyType: model.tsType,
        });
    }
}

export function useJsObjectSelection({ model }: { model: JsonModel }) {
    const rootSelection = getTopSelection({ model, hideChildren: true });
    const [topLevelSelection, setTopLevelSelection] = useState<JsObjectSelection>(rootSelection);
    const [selection, setSelection] = useState<JsObjectSelection>(rootSelection);
    const topLevelHeader = getTopLevelHeader(topLevelSelection);

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
                smoothScrollIntoView({ href: '#top' });
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
        topLevelHeader,
        handleSelection,
    };
}
