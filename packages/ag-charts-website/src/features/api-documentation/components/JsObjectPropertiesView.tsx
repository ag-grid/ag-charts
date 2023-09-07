import { useCallback, type FunctionComponent, useState } from 'react';
import { JsObjectView } from './JsObjectView';
import styles from './JsObjectProperties.module.scss';
import type { Config, JsObjectPropertiesViewProps, JsObjectSelection } from '../types';
import { JsObjectDetails } from './JsObjectDetails';
import { buildModel } from '../utils/model';

export const JsObjectPropertiesView: FunctionComponent<JsObjectPropertiesViewProps> = ({
    interfaceName,
    breadcrumbs = [],
    codeLookup,
    interfaceLookup,
    config = {} as Config,
    framework,
}) => {
    const model = buildModel(interfaceName, interfaceLookup, codeLookup);
    const completeModelSelection = {
        type: model.type,
        path: [],
        model,
    };
    const [selection, setSelection] = useState<JsObjectSelection>(completeModelSelection);
    const onSelection = useCallback(
        (data: JsObjectSelection) => {
            setSelection(data);
        },
        [selection]
    );

    return (
        <div className={styles.container}>
            <JsObjectView breadcrumbs={breadcrumbs} config={config} onSelection={onSelection} model={model} />
            <JsObjectDetails selection={selection} framework={framework} />
        </div>
    );
};
