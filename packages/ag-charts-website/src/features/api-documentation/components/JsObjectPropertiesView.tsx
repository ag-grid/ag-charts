import classNames from 'classnames';
import type { FunctionComponent } from 'react';
import { JsObjectView } from './JsObjectView';
import styles from './JsObjectProperties.module.scss';
import type { JsObjectPropertiesViewConfig, JsObjectPropertiesViewProps } from '../types';
import { JsObjectDetails } from './JsObjectDetails';
import { buildModel } from '../utils/model';
import { useJsObjectSelection } from '../utils/useJsObjectSelection';
import { OptionsDataContext } from '../utils/optionsDataContext';
import { JsObjectPropertiesViewConfigContext } from '../utils/jsObjectPropertiesViewConfigContext';
import { FrameworkContext } from '../utils/frameworkContext';

export const JsObjectPropertiesView: FunctionComponent<JsObjectPropertiesViewProps> = ({
    heading,
    interfaceName,
    breadcrumbs = [],
    codeLookup,
    interfaceLookup,
    config = {} as JsObjectPropertiesViewConfig,
    optionsData,
    framework,
}) => {
    const model = buildModel(interfaceName, interfaceLookup, codeLookup);
    const { topLevelSelection, handleSelection } = useJsObjectSelection({ model });

    return (
        <div className={styles.container}>
            <JsObjectPropertiesViewConfigContext.Provider value={config}>
                <div className={styles.objectViewOuter}>
                    <JsObjectView breadcrumbs={breadcrumbs} handleSelection={handleSelection} model={model} />
                </div>

                <FrameworkContext.Provider value={framework}>
                    <OptionsDataContext.Provider value={optionsData}>
                        <div className={classNames(styles.referenceOuter, 'font-size-responsive')}>
                            {heading && (
                                <header>
                                    <h1 className="font-size-gigantic">{heading}</h1>
                                </header>
                            )}
                            <JsObjectDetails selection={topLevelSelection} />
                        </div>
                    </OptionsDataContext.Provider>
                </FrameworkContext.Provider>
            </JsObjectPropertiesViewConfigContext.Provider>
        </div>
    );
};
