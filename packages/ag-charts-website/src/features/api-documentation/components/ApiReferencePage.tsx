import { navigate, useHistory, useLocation } from '@utils/navigation';
import classNames from 'classnames';
import type { CSSProperties } from 'react';
import { useContext, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { SITE_BASE_URL } from 'src/constants';

import type { ApiReferenceType, InterfaceNode } from '../api-reference-types';
import type { PageTitle } from '../apiReferenceHelpers';
import type { NavigationData, SpecialTypesMap } from '../apiReferenceHelpers';
import { ApiReference, ApiReferenceConfigContext, ApiReferenceContext } from './ApiReference';
import styles from './ApiReferencePage.module.scss';
import { OptionsNavigation, SelectionContext } from './OptionsNavigation';
import { PropertyType } from './Properies';

interface ApiReferencePageOptions {
    reference: ApiReferenceType;
    rootInterface: string;
    pageInterface?: string;
    breadcrumbs: string[];
    pageTitle?: PageTitle;
    basePath: string;
    specialTypes?: SpecialTypesMap;
    keepExpanded?: string[];
}

export function ApiReferencePage({
    rootInterface,
    pageInterface,
    breadcrumbs,
    pageTitle,
    basePath,
    reference,
    specialTypes,
    keepExpanded,
}: ApiReferencePageOptions) {
    const location = useLocation();
    const [selection, setSelection] = useState<NavigationData>({
        pageInterface: pageInterface ?? rootInterface,
        pathname: location?.pathname ?? basePath,
        hash: location?.hash.substring(1) ?? '',
        pageTitle: pageTitle ?? { name: rootInterface },
    });
    const pageRef = selection.pageInterface ? reference.get(selection.pageInterface) : null;
    const rootRef = reference.get(rootInterface);

    useEffect(() => {
        navigate({ pathname: location?.pathname, hash: location?.hash }, { state: selection, replace: true });
    }, []);

    useHistory(({ location, action }) => {
        if (action === 'POP' && location.state) {
            setSelection(location.state as NavigationData);
        }
    });

    if (rootRef?.kind !== 'interface' || (pageRef && pageRef.kind !== 'interface')) {
        return null;
    }

    return (
        <ApiReferenceContext.Provider value={reference}>
            <ApiReferenceConfigContext.Provider value={{ hideHeader: true, specialTypes, keepExpanded }}>
                <SelectionContext.Provider value={{ selection, setSelection }}>
                    <div className={styles.container}>
                        <div className={styles.objectViewOuter}>
                            <OptionsNavigation
                                basePath={`${SITE_BASE_URL}${basePath}/`}
                                breadcrumbs={breadcrumbs}
                                rootInterface={rootInterface}
                            />
                        </div>
                        <ApiReferencePageContent
                            pageId={selection.pageInterface}
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
    pageTitle?: PageTitle;
}) {
    const selection = useContext(SelectionContext);
    const [headerHeight, setHeaderHeight] = useState(0);
    return (
        <div className={classNames(styles.referenceOuter, 'font-size-responsive')}>
            <header ref={(ref) => setHeaderHeight(ref?.clientHeight ?? 0)}>
                <h1 className="font-size-gigantic">
                    {pageTitle?.type ? (
                        <>
                            {pageTitle.name}[type = '<span className={styles.unionDiscriminator}>{pageTitle.type}</span>
                            ']
                        </>
                    ) : (
                        pageTitle?.name ?? pageRef.name
                    )}
                </h1>
                <Markdown>{pageRef.docs?.join('\n')}</Markdown>
                <PropertyType type={pageRef.name} />
            </header>
            <ApiReference
                id={pageId}
                anchorId={`reference-${selection?.selection.pageInterface ?? pageRef.name}`}
                style={{ '--anchor-offset': `${headerHeight - 1}px` } as CSSProperties}
            />
        </div>
    );
}
