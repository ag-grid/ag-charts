import { useCallback, type FunctionComponent, useState } from 'react';
import { JsObjectView } from './JsObjectView';
import styles from './JsObjectProperties.module.scss';
import type { Config, JsObjectPropertiesViewProps, JsObjectSelection } from '../types';
import { JsObjectDetails } from './JsObjectDetails';

export const JsObjectPropertiesView: FunctionComponent<JsObjectPropertiesViewProps> = ({
    interfaceName,
    breadcrumbs = [],
    codeLookup,
    interfaceLookup,
    config = {} as Config,
    framework,
}) => {
    const [selection, setSelection] = useState<JsObjectSelection>();
    const onSelection = useCallback(
        (data: JsObjectSelection) => {
            setSelection(data);
        },
        [selection]
    );
    return (
        <div className={styles.container}>
            <JsObjectView
                interfaceName={interfaceName}
                interfaceLookup={interfaceLookup}
                codeLookup={codeLookup}
                breadcrumbs={breadcrumbs}
                config={config}
                onSelection={onSelection}
            />

            {selection ? <JsObjectDetails selection={selection} framework={framework} /> : 'TODO: No selection'}
        </div>
    );
};
