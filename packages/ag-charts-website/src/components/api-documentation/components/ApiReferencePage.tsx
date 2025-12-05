import { navigate, useHistory, useLocation } from '@ag-website-shared/utils/navigation';
import type { InterfaceNode, NodeTypes } from '@generate-code-reference-plugin/doc-interfaces/types';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import classNames from 'classnames';
import { Action } from 'history';
import { type CSSProperties, useContext, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

import { type NavigationData, type PageTitle, type SpecialTypesMap, parseJsDocs } from '../apiReferenceHelpers';
import { ApiReference, ApiReferenceConfigContext, ApiReferenceContext } from './ApiReference';
import styles from './ApiReferencePage.module.scss';
import { OptionsNavigation, SelectionContext } from './OptionsNavigation';
import { PropertyType } from './Properties';

interface ApiReferencePageOptions {
    reference: Map<string, NodeTypes>;
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

    useHistory(({ location: historyLocation, action }) => {
        if (action === Action.Pop && historyLocation.state) {
            setSelection(historyLocation.state as NavigationData);
        }
    });

    if (rootRef?.kind !== 'interface' || (pageRef && pageRef.kind !== 'interface')) {
        return null;
    }

    basePath = `${urlWithBaseUrl(`/${basePath}`)}/`;

    return (
        <ApiReferenceContext.Provider value={reference}>
            <ApiReferenceConfigContext.Provider value={{ hideHeader: true, specialTypes, keepExpanded }}>
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
                        pageTitle?.name ?? pageRef.name
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
