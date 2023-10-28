import classNames from 'classnames';
import type { Dispatch, SetStateAction } from 'react';
import { createContext, useState } from 'react';
import Markdown from 'react-markdown';

import type { ApiReferenceType, InterfaceNode } from '../api-reference-types';
import { ApiReference, ApiReferenceConfigContext, ApiReferenceContext } from './ApiReference';
import styles from './ApiReferencePage.module.scss';
import { OptionsNavigation } from './OptionsNavigation';
import { PropertyNamePrefix, PropertyType } from './Properies';

const SelectionContext = createContext<{
    selection: Selection;
    setSelection: Dispatch<SetStateAction<Selection>>;
} | null>(null);

interface Selection {
    root: InterfaceNode;
}

interface ApiReferencePageOptions {
    reference: ApiReferenceType;
    rootInterface: string;
    breadcrumbs: string[];
    additionalData: object;
}

export function ApiReferencePage({ rootInterface, breadcrumbs, reference }: ApiReferencePageOptions) {
    const [selection, setSelection] = useState({
        root: reference.get(rootInterface) as InterfaceNode,
    });

    if (rootInterface === 'AgChartOptions') {
        rootInterface = 'AgCartesianChartOptions';
    }

    return (
        <ApiReferenceContext.Provider value={reference}>
            <ApiReferenceConfigContext.Provider value={{ hideHeader: true }}>
                <SelectionContext.Provider value={{ selection, setSelection }}>
                    <div className={styles.container}>
                        <div className={styles.objectViewOuter}>
                            <OptionsNavigation breadcrumbs={breadcrumbs} rootInterface={rootInterface} />
                        </div>
                        <div className={classNames(styles.referenceOuter, 'font-size-responsive')}>
                            <PageHeader selection={selection.root} />
                            <ApiReference id={rootInterface} />
                        </div>
                    </div>
                </SelectionContext.Provider>
            </ApiReferenceConfigContext.Provider>
        </ApiReferenceContext.Provider>
    );
}

function PageHeader({ selection, prefixPath }: { selection: InterfaceNode; prefixPath?: string[] }) {
    return (
        <header>
            <h1 className="font-size-gigantic">
                <PropertyNamePrefix as="span" prefixPath={prefixPath} />
                {selection.name}
            </h1>
            <Markdown>{selection.docs?.join('\n')}</Markdown>
            <PropertyType type={selection.name} />
        </header>
    );
}
