import classNames from 'classnames';
import type { CSSProperties, Dispatch, SetStateAction } from 'react';
import { createContext, useState } from 'react';
import Markdown from 'react-markdown';

import type { ApiReferenceType, InterfaceNode } from '../api-reference-types';
import { ApiReference, ApiReferenceConfigContext, ApiReferenceContext } from './ApiReference';
import styles from './ApiReferencePage.module.scss';
import { OptionsNavigation } from './OptionsNavigation';
import { PropertyType } from './Properies';

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
}

export function ApiReferencePage({ rootInterface, breadcrumbs, reference }: ApiReferencePageOptions) {
    const [headerHeight, setHeaderHeight] = useState(0);
    const [selection, setSelection] = useState({
        root: reference.get(rootInterface) as InterfaceNode,
    });

    return (
        <ApiReferenceContext.Provider value={reference}>
            <ApiReferenceConfigContext.Provider value={{ hideHeader: true }}>
                <SelectionContext.Provider value={{ selection, setSelection }}>
                    <div className={styles.container}>
                        <div className={styles.objectViewOuter}>
                            <OptionsNavigation breadcrumbs={breadcrumbs} rootInterface={rootInterface} />
                        </div>
                        <div className={classNames(styles.referenceOuter, 'font-size-responsive')}>
                            <header ref={(ref) => setHeaderHeight(ref?.clientHeight ?? 0)}>
                                <h1 className="font-size-gigantic">
                                    {/*<PropertyNamePrefix as="span" prefixPath={prefixPath} />*/}
                                    {selection.root.name}
                                </h1>
                                <Markdown>{selection.root.docs?.join('\n')}</Markdown>
                                <PropertyType type={selection.root.name} />
                            </header>

                            <ApiReference
                                id={rootInterface}
                                style={{ '--anchor-offset': `${headerHeight}px` } as CSSProperties}
                            />
                        </div>
                    </div>
                </SelectionContext.Provider>
            </ApiReferenceConfigContext.Provider>
        </ApiReferenceContext.Provider>
    );
}
