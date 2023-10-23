import classNames from 'classnames';
import type { FunctionComponent } from 'react';

import type {
    JsObjectPropertiesViewConfig,
    JsObjectPropertiesViewProps,
    JsObjectSelection,
    TopLevelHeaderData,
} from '../types';
import { FrameworkContext } from '../utils/frameworkContext';
import { JsObjectPropertiesViewConfigContext } from '../utils/jsObjectPropertiesViewConfigContext';
import { buildModel } from '../utils/model';
import { OptionsDataContext } from '../utils/optionsDataContext';
import { useJsObjectSelection } from '../utils/useJsObjectSelection';
import { HeadingPath } from './HeadingPath';
import { JsObjectDetails } from './JsObjectDetails';
import styles from './JsObjectProperties.module.scss';
import { JsObjectView } from './JsObjectView';
import { MetaList } from './MetaList';

function TopLevelHeader({
    topLevelHeader,
    topLevelSelection,
}: {
    topLevelHeader?: TopLevelHeaderData;
    topLevelSelection: JsObjectSelection;
}) {
    if (!topLevelHeader) {
        return null;
    }

    const pathSeparator = topLevelHeader.heading && topLevelHeader.path.length > 0 ? '.' : '';

    return (
        <header>
            <h1 className="font-size-gigantic">
                <HeadingPath path={topLevelHeader.path} keepTopLevelIfOnlyItem={true} />
                {pathSeparator}
                {topLevelHeader.heading}
            </h1>
            <p>{topLevelHeader.descriptionWithoutDefault}</p>
            <MetaList
                propertyType={topLevelHeader.propertyType}
                model={topLevelSelection.model}
                description={topLevelHeader.description}
            />
        </header>
    );
}

export const JsObjectPropertiesView: FunctionComponent<JsObjectPropertiesViewProps> = ({
    interfaceName,
    breadcrumbs = [],
    codeLookup,
    interfaceLookup,
    config = {} as JsObjectPropertiesViewConfig,
    optionsData,
    framework,
}) => {
    const model = buildModel(interfaceName, interfaceLookup, codeLookup);
    const { topLevelSelection, topLevelHeader, handleSelection } = useJsObjectSelection({ model, config });

    return (
        <div className={styles.container}>
            <JsObjectPropertiesViewConfigContext.Provider value={config}>
                <div className={styles.objectViewOuter}>
                    <JsObjectView breadcrumbs={breadcrumbs} handleSelection={handleSelection} model={model} />
                </div>

                <FrameworkContext.Provider value={framework}>
                    <OptionsDataContext.Provider value={optionsData}>
                        <div className={classNames(styles.referenceOuter, 'font-size-responsive')}>
                            <TopLevelHeader topLevelHeader={topLevelHeader} topLevelSelection={topLevelSelection} />
                            <JsObjectDetails selection={topLevelSelection} />
                        </div>
                    </OptionsDataContext.Provider>
                </FrameworkContext.Provider>
            </JsObjectPropertiesViewConfigContext.Provider>
        </div>
    );
};
