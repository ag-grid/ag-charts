import type { InterfaceNode } from '@generate-code-reference-plugin/doc-interfaces/types';
import { fetchInterfacesReference } from '@utils/client/fetchInterfacesReference';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import classNames from 'classnames';
import { type CSSProperties, useContext, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { QueryClientProvider, useQuery } from 'react-query';
import remarkBreaks from 'remark-breaks';

import { type NavigationData, type PageTitle, type SpecialTypesMap, parseJsDocs } from '../apiReferenceHelpers';
import { readSelection, seedSelection, useApiReferenceLocation } from '../apiReferenceRouting';
import {
    ApiReference,
    ApiReferenceConfigContext,
    ApiReferenceContext,
    queryClient,
    queryOptions,
} from './ApiReference';
import styles from './ApiReferencePage.module.scss';
import { OptionsNavigation, SelectionContext } from './OptionsNavigation';
import { PropertyType } from './Properties';

interface ApiReferencePageOptions {
    rootInterface: string;
    pageInterface?: string;
    breadcrumbs: string[];
    pageTitle?: PageTitle;
    basePath: string;
    specialTypes?: SpecialTypesMap;
    keepExpanded?: string[];
    noExpand?: string[];
}

export function ApiReferencePage(props: ApiReferencePageOptions) {
    return (
        <QueryClientProvider client={queryClient}>
            <ApiReferencePageInner {...props} />
        </QueryClientProvider>
    );
}

function ApiReferencePageInner({
    rootInterface,
    pageInterface,
    breadcrumbs,
    pageTitle,
    basePath,
    specialTypes,
    keepExpanded,
    noExpand,
}: ApiReferencePageOptions) {
    const { data: reference } = useQuery(['resolved-interfaces'], fetchInterfacesReference, queryOptions);
    const location = useApiReferenceLocation();
    const [selection, setSelection] = useState<NavigationData>(
        () =>
            readSelection() ?? {
                pageInterface: pageInterface ?? rootInterface,
                pathname: location?.pathname ?? basePath,
                hash: location?.hash.substring(1) ?? '',
                pageTitle: pageTitle ?? { name: rootInterface },
            }
    );

    useEffect(() => {
        seedSelection(selection);
    }, []);

    /*
        The island is persisted across Astro navigations, so props stay at whatever the first-loaded
        page supplied. Every entry this app creates carries its selection in Astro's history state,
        which makes that state — not props — the thing to follow on back/forward.
    */
    useEffect(() => {
        const restored = readSelection();
        if (restored) {
            setSelection(restored);
        }
    }, [location]);

    if (!reference) return null;

    const pageRef = selection.pageInterface ? reference.get(selection.pageInterface) : null;
    const rootRef = reference.get(rootInterface);

    if (rootRef?.kind !== 'interface' || (pageRef && pageRef.kind !== 'interface')) {
        return null;
    }

    basePath = `${urlWithBaseUrl(`/${basePath}`)}/`;

    return (
        <ApiReferenceContext.Provider value={reference}>
            <ApiReferenceConfigContext.Provider value={{ hideHeader: true, specialTypes, keepExpanded, noExpand }}>
                <SelectionContext.Provider value={{ selection, setSelection, rootInterface, basePath }}>
                    <div className={classNames(styles.container, 'layout-grid')}>
                        <div className={styles.objectViewOuter}>
                            <OptionsNavigation
                                basePath={basePath}
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
        <div className={styles.referenceOuter}>
            <header ref={(ref) => setHeaderHeight(ref?.clientHeight ?? 0)}>
                <h1 className="text-3xl">
                    {pageTitle?.type ? (
                        <>
                            {pageTitle.name}
                            {pageTitle.name === 'axes' ? <span className={styles.recordAlias}>.key</span> : ''}[type = '
                            <span className={styles.unionDiscriminator}>{pageTitle.type}</span>
                            ']
                        </>
                    ) : (
                        (pageTitle?.name ?? pageRef.name)
                    )}
                </h1>
                <Markdown remarkPlugins={[remarkBreaks]}>{parseJsDocs(pageRef.docs)}</Markdown>
                <PropertyType type={pageRef.name} />
            </header>
            <ApiReference
                id={pageId}
                key={pageId}
                anchorId={`reference-${selection?.selection.pageInterface ?? pageRef.name}`}
                style={{ '--anchor-offset': `${headerHeight - 1}px` } as CSSProperties}
            />
        </div>
    );
}
