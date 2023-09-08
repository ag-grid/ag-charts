import { useCallback, type FunctionComponent, useState } from 'react';
import { JsObjectView } from './JsObjectView';
import styles from './JsObjectProperties.module.scss';
import type { Config, JsObjectPropertiesViewProps, JsObjectSelection, JsObjectSelectionProperty } from '../types';
import { JsObjectDetails } from './JsObjectDetails';
import { buildModel } from '../utils/model';
import { getSelectionReferenceId } from '../utils/getObjectReferenceId';
import { smoothScrollIntoView } from '@utils/smoothScrollIntoView';
import { getTopLevelSelection, getTopSelection } from '../utils/modelPath';
import { TOP_LEVEL_OPTIONS_TO_LIMIT_CHILDREN } from '../constants';

export const JsObjectPropertiesView: FunctionComponent<JsObjectPropertiesViewProps> = ({
    interfaceName,
    breadcrumbs = [],
    codeLookup,
    interfaceLookup,
    config = {} as Config,
    framework,
}) => {
    const model = buildModel(interfaceName, interfaceLookup, codeLookup);
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

    return (
        <div className={styles.container}>
            <JsObjectView breadcrumbs={breadcrumbs} config={config} handleSelection={handleSelection} model={model} />
            <JsObjectDetails selection={selection} framework={framework} />
        </div>
    );
};
