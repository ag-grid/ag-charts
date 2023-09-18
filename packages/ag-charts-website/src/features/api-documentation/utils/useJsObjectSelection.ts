import { useCallback, useState } from 'react';
import type {
    JsObjectPropertiesViewConfig,
    JsObjectSelection,
    JsObjectSelectionProperty,
    TopLevelHeaderData,
} from '../types';
import type { JsonModel } from './model';
import { getSelectionReferenceId } from './getObjectReferenceId';
import { smoothScrollIntoView } from '@utils/smoothScrollIntoView';
import { getTopLevelSelection, getTopSelection } from './modelPath';
import { formatPropertyDocumentation, removeDefaultValue } from './documentationHelpers';
import { getPropertyType } from './getPropertyType';
import { getShouldLimitChildren } from './getShouldLimitChildren';
import { selectionHasChanged } from './selectionHasChanged';

function scrollToId(id?: string) {
    // Scroll to top to reset scroll position
    smoothScrollIntoView({ href: '#top', skipReplaceUrl: true });

    if (id) {
        // Wait for one render cycle before scrolling to position
        setTimeout(() => {
            smoothScrollIntoView({ href: `#${id}`, skipReplaceUrl: true });
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

export function useJsObjectSelection({ model, config }: { model: JsonModel; config?: JsObjectPropertiesViewConfig }) {
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
            } else {
                const { propName } = newSelection as JsObjectSelectionProperty;
                const shouldLimitChildren = getShouldLimitChildren({
                    config,
                    path,
                    pathItem: propName,
                });

                let shouldLimitChildrenDepth;
                if (shouldLimitChildren) {
                    shouldLimitChildrenDepth = 1;
                }
                const onlyShowToDepth =
                    newSelection.onlyShowToDepth === undefined
                        ? shouldLimitChildrenDepth
                        : newSelection.onlyShowToDepth;
                try {
                    const [newTopLevelPathItem] = newSelection.path;
                    if (selectionHasChanged({ selection: topLevelSelection, newSelection })) {
                        const newTopLevelSelection = getTopLevelSelection({ selection: newSelection, model, config });
                        if (newTopLevelSelection) {
                            setTopLevelSelection({ ...newTopLevelSelection, onlyShowToDepth });
                        } else {
                            // eslint-disable-next-line no-console
                            console.warn('No top level selection found:', {
                                newTopLevelPathItem,
                                newSelection,
                            });
                        }
                    }
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
