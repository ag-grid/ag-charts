import { useCallback, type FunctionComponent, useState } from 'react';
import { JsObjectView } from './JsObjectView';
import styles from './JsObjectProperties.module.scss';
import type { Config, JsObjectPropertiesViewProps, OnSelectionValue } from '../types';
import { InterfaceDocumentation } from './InterfaceDocumentation';

export const JsObjectPropertiesView: FunctionComponent<JsObjectPropertiesViewProps> = ({
    interfaceName,
    framework,
    breadcrumbs = [],
    codeLookup,
    interfaceLookup,
    config = {} as Config,
}) => {
    const [selectedPropName, setSelectedPropName] = useState<string>();
    const onSelection = useCallback(
        ({ propName, path }: OnSelectionValue) => {
            // Only support top level selections
            if ((path.length === 0 && propName) || (path.length === 1 && path[0] === propName)) {
                if (selectedPropName === propName) {
                    setSelectedPropName(undefined);
                } else {
                    setSelectedPropName(propName);
                }
            }
        },
        [selectedPropName]
    );
    const names = selectedPropName ? [selectedPropName] : [];

    const docsConfig: Config = {
        ...config,
        description: '',
        lookups: {
            codeLookup,
            interfaces: interfaceLookup,
        },
    };
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

            <InterfaceDocumentation
                interfaceName={interfaceName}
                framework={framework}
                names={names}
                interfaceLookup={interfaceLookup}
                codeLookup={codeLookup}
                config={docsConfig}
            />
        </div>
    );
};
