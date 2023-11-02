import classNames from 'classnames';
import type { CSSProperties } from 'react';
import { useContext, useState } from 'react';
import Markdown from 'react-markdown';
import { useLocation } from 'src/features/api-documentation/utils/navigation';

import type { ApiReferenceType, InterfaceNode } from '../api-reference-types';
import { ApiReference, ApiReferenceConfigContext, ApiReferenceContext } from './ApiReference';
import styles from './ApiReferencePage.module.scss';
import type { NavPageTitle, Selection } from './OptionsNavigation';
import { OptionsNavigation, SelectionContext } from './OptionsNavigation';
import { PropertyType } from './Properies';

interface ApiReferencePageOptions {
    reference: ApiReferenceType;
    rootInterface: string;
    pageInterface?: string;
    breadcrumbs: string[];
    pageTitle?: NavPageTitle;
    basePath: string;
    specialTypes?: Record<string, string>;
}

export function ApiReferencePage({
    rootInterface,
    pageInterface,
    breadcrumbs,
    pageTitle,
    basePath,
    reference,
    specialTypes,
}: ApiReferencePageOptions) {
    const location = useLocation();
    const [selection, setSelection] = useState<Selection>({
        pageInterface: pageInterface ?? rootInterface,
        anchorId: location?.hash.substring(1),
        pageTitle,
    });
    const pageRef = selection.pageInterface ? reference.get(selection.pageInterface) : null;
    const rootRef = reference.get(rootInterface);

    if (rootRef?.kind !== 'interface' || (pageRef && pageRef.kind !== 'interface')) {
        return null;
    }

    return (
        <ApiReferenceContext.Provider value={reference}>
            <ApiReferenceConfigContext.Provider value={{ hideHeader: true, specialTypes }}>
                <SelectionContext.Provider value={{ selection, setSelection }}>
                    <div className={styles.container}>
                        <div className={styles.objectViewOuter}>
                            <OptionsNavigation
                                basePath={basePath}
                                breadcrumbs={breadcrumbs}
                                rootInterface={rootInterface}
                            />
                        </div>
                        <ApiReferencePageContent
                            pageId={selection.pageInterface ?? rootInterface}
                            pageRef={pageRef ?? rootRef}
                            pageTitle={selection?.pageTitle}
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
    pageTitle?: NavPageTitle;
}) {
    const selection = useContext(SelectionContext);
    const [headerHeight, setHeaderHeight] = useState(0);
    return (
        <div className={classNames(styles.referenceOuter, 'font-size-responsive')}>
            <header ref={(ref) => setHeaderHeight(ref?.clientHeight ?? 0)}>
                <h1 className="font-size-gigantic">
                    {pageTitle?.type ? (
                        <>
                            {pageTitle.memberName}[type = '
                            <span className={styles.unionDiscriminator}>{pageTitle.type}</span>']
                        </>
                    ) : (
                        pageTitle?.memberName ?? pageRef.name
                    )}
                </h1>
                <Markdown>{pageRef.docs?.join('\n')}</Markdown>
                <PropertyType type={pageRef.name} />
            </header>
            <ApiReference
                id={pageId}
                anchorId={`reference-${selection?.selection.pageInterface ?? pageRef.name}`}
                style={{ '--anchor-offset': `${headerHeight}px` } as CSSProperties}
            />
        </div>
    );
}
