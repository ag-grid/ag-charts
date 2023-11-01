import classNames from 'classnames';
import type { CSSProperties, Dispatch, SetStateAction } from 'react';
import { createContext, useState } from 'react';
import Markdown from 'react-markdown';
import { useLocation } from 'src/features/api-documentation/utils/navigation';

import type { ApiReferenceNode, ApiReferenceType, InterfaceNode } from '../api-reference-types';
import { ApiReference, ApiReferenceConfigContext, ApiReferenceContext } from './ApiReference';
import styles from './ApiReferencePage.module.scss';
import { OptionsNavigation } from './OptionsNavigation';
import { PropertyType } from './Properies';

const SelectionContext = createContext<{
    selection: Selection;
    setSelection: Dispatch<SetStateAction<Selection>>;
} | null>(null);

interface Selection {
    pageInterface: string;
}

interface ApiReferencePageOptions {
    reference: ApiReferenceType;
    rootInterface: string;
    pageInterface?: string;
    breadcrumbs: string[];
    pageTitle?: {
        memberName: string;
        type: string;
    };
}

export function ApiReferencePage({
    rootInterface,
    pageInterface,
    breadcrumbs,
    pageTitle,
    reference,
}: ApiReferencePageOptions) {
    const [selection, setSelection] = useState({ pageInterface: pageInterface ?? rootInterface });
    const pageRef = pageInterface ? reference.get(pageInterface) : null;
    const rootRef = reference.get(rootInterface);

    if (rootRef?.kind !== 'interface' || (pageRef && pageRef.kind !== 'interface')) {
        return null;
    }

    console.log(import.meta.env.PUBLIC_BASE_URL);

    return (
        <ApiReferenceContext.Provider value={reference}>
            <ApiReferenceConfigContext.Provider value={{ hideHeader: true }}>
                <SelectionContext.Provider value={{ selection, setSelection }}>
                    <div className={styles.container}>
                        <div className={styles.objectViewOuter}>
                            <OptionsNavigation breadcrumbs={breadcrumbs} rootInterface={rootInterface} />
                        </div>
                        <ApiReferencePageContent
                            pageId={pageInterface ?? rootInterface}
                            pageRef={pageRef ?? rootRef}
                            pageTitle={pageTitle}
                        />
                    </div>
                </SelectionContext.Provider>
            </ApiReferenceConfigContext.Provider>
        </ApiReferenceContext.Provider>
    );
}

function ApiReferencePageContent({
    pageId,
    pageRef,
    pageTitle,
}: {
    pageId: string;
    pageRef: InterfaceNode;
    pageTitle?: {
        memberName: string;
        type: string;
    };
}) {
    const [headerHeight, setHeaderHeight] = useState(0);
    return (
        <div className={classNames(styles.referenceOuter, 'font-size-responsive')}>
            <header ref={(ref) => setHeaderHeight(ref?.clientHeight ?? 0)}>
                <h1 className="font-size-gigantic">
                    {pageTitle ? (
                        <>
                            {pageTitle.memberName}[type = '
                            <span className={styles.unionDiscriminator}>{pageTitle.type}</span>']
                        </>
                    ) : (
                        pageRef.name
                    )}
                </h1>
                <Markdown>{pageRef.docs?.join('\n')}</Markdown>
                <PropertyType type={pageRef.name} />
            </header>
            <ApiReference id={pageId} style={{ '--anchor-offset': `${headerHeight}px` } as CSSProperties} />
        </div>
    );
}
