import { Icon } from '@components/icon/Icon';
import { SITE_BASE_URL } from '@constants';
import { useToggle } from '@utils/hooks/useToggle';
import classnames from 'classnames';
import type { To } from 'history';
import type { AllHTMLAttributes, CSSProperties, Dispatch, MouseEventHandler, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useEffect, useRef } from 'react';

import type { MemberNode } from '../api-reference-types';
import { extractSearchData, getMemberType } from '../utils/apiReferenceHelpers';
import { navigate, scrollIntoView } from '../utils/navigation';
import { ApiReferenceContext } from './ApiReference';
import styles from './OptionsNavigation.module.scss';
import { SearchBox } from './SearchBox';

export const SelectionContext = createContext<{
    selection: Selection;
    setSelection: Dispatch<SetStateAction<Selection>>;
} | null>(null);

export interface NavPageTitle {
    memberName: string;
    type: string;
}

export interface Selection {
    pageInterface?: string;
    pageTitle?: NavPageTitle;
    anchorId?: string;
}

export function OptionsNavigation({
    basePath,
    breadcrumbs,
    rootInterface,
}: {
    basePath: string;
    breadcrumbs: string[];
    rootInterface: string;
}) {
    const elementRef = useRef<HTMLDivElement>(null);
    const selection = useContext(SelectionContext);
    const reference = useContext(ApiReferenceContext);
    const interfaceRef = reference?.get(rootInterface);

    const handleClick = (navigateTo: To, newSelection: Selection) => {
        selection?.setSelection(newSelection);
        navigate(navigateTo);
    };

    useEffect(() => {
        scrollIntoView(elementRef.current?.querySelector('.highlight'), { behavior: 'auto', block: 'center' });
    }, []);

    if (!reference || !interfaceRef) {
        return null;
    }

    return (
        <div ref={elementRef} className={styles.expandableSnippet} role="presentation">
            <header>
                <h3>Options Reference</h3>
                <p className="text-secondary font-size-small">
                    A comprehensive interactive explorer for the <b>AgChartOptions</b> structure.
                </p>
                <SearchBox searchData={extractSearchData(reference, interfaceRef)} />
            </header>

            <pre className={classnames('code', styles.navContainer)}>
                <code className="language-ts">
                    <NavBreadcrumb breadcrumbs={breadcrumbs} rootInterface={rootInterface} basePath={basePath}>
                        {interfaceRef.kind === 'interface' && (
                            <NavGroup depth={breadcrumbs?.length ?? 0}>
                                {interfaceRef.members.map((member) => (
                                    <NavProperty
                                        key={member.name}
                                        member={member}
                                        depth={breadcrumbs?.length ?? 0}
                                        pageInterface={rootInterface}
                                        pathname={`${SITE_BASE_URL}${basePath}`}
                                        anchorId={`reference-${rootInterface}-${member.name}`}
                                        onClick={handleClick}
                                    />
                                ))}
                            </NavGroup>
                        )}
                    </NavBreadcrumb>
                </code>
            </pre>
        </div>
    );
}

function NavGroup({ depth = 0, className, ...props }: { depth?: number } & AllHTMLAttributes<HTMLDivElement>) {
    return (
        <div
            {...props}
            style={{ '--options-nav-depth': depth } as CSSProperties}
            className={classnames(styles.navGroup, depth > 1 && styles.groupWhiskers, className)}
        />
    );
}

function NavProperty({
    member,
    depth = 0,
    pathname,
    anchorId,
    pageTitle,
    pageInterface,
    onClick,
}: {
    member: MemberNode;
    depth?: number;
    pathname: string;
    anchorId: string;
    pageTitle?: NavPageTitle;
    pageInterface?: string;
    onClick?: (uri: To, selection: Selection) => void;
}) {
    const selection = useContext(SelectionContext);
    const reference = useContext(ApiReferenceContext);

    const memberType = getMemberType(member);
    const interfaceRef = reference?.get(memberType);
    const isInterface = interfaceRef?.kind === 'interface';
    const isInterfaceArray =
        typeof member.type === 'object' &&
        member.type.kind === 'array' &&
        interfaceRef?.kind === 'typeAlias' &&
        typeof interfaceRef.type === 'object' &&
        interfaceRef.type.kind === 'union' &&
        interfaceRef.type.type.every((type): type is string => typeof type === 'string');
    const expandable = isInterface || isInterfaceArray;

    const [isExpanded, toggleExpanded] = useToggle(
        isInterfaceArray
            ? typeof selection?.selection.pageInterface === 'string' &&
                  getInterfaceArrayTypes().includes(selection?.selection.pageInterface)
            : selection?.selection.pageInterface === pageInterface &&
                  selection?.selection.anchorId?.startsWith(anchorId) &&
                  selection?.selection.anchorId !== anchorId
    );

    const isSelected =
        selection?.selection.pageInterface === pageInterface && selection?.selection.anchorId === anchorId;
    const handleClick = () => onClick?.({ pathname, hash: anchorId }, { pageInterface, pageTitle, anchorId });

    function getInterfaceArrayTypes(): string[] {
        if (
            interfaceRef?.kind === 'typeAlias' &&
            typeof interfaceRef.type === 'object' &&
            interfaceRef.type.kind === 'union' &&
            interfaceRef.type.type.every((type): type is string => typeof type === 'string')
        ) {
            return interfaceRef.type.type;
        }
        return [];
    }

    return (
        <>
            <div className={classnames(styles.navItem, isSelected && 'highlight')} onDoubleClick={toggleExpanded}>
                <span
                    className={classnames(
                        styles.propertyName,
                        depth > 1 && styles.propertyWhisker,
                        expandable && styles.propertyExpandable
                    )}
                >
                    {expandable && <PropertyExpander isExpanded={isExpanded} onClick={toggleExpanded} />}
                    <span onClick={handleClick}>
                        {member.name === 'type' && anchorId.split('-').length === 3 ? (
                            <>
                                type <span className={styles.punctuation}>= '</span>
                                <span className={styles.unionDiscriminator}>
                                    {getMemberType(member).replaceAll("'", '')}
                                </span>
                                '
                            </>
                        ) : (
                            member.name
                        )}
                    </span>
                    {expandable && (
                        <OpeningBrackets isOpen={isExpanded} isArray={isInterfaceArray} onClick={toggleExpanded} />
                    )}
                </span>
            </div>
            {expandable && isExpanded && (
                <>
                    <NavGroup depth={depth + 1}>
                        {isInterface
                            ? interfaceRef.members.map((member) => (
                                  <NavProperty
                                      key={member.name}
                                      depth={depth + 1}
                                      member={member}
                                      pathname={pathname}
                                      anchorId={`${anchorId}-${member.name}`}
                                      pageInterface={pageInterface}
                                      pageTitle={pageTitle}
                                      onClick={onClick}
                                  />
                              ))
                            : getInterfaceArrayTypes().map((typeName) => (
                                  <NavTypedUnionProperty
                                      key={typeName}
                                      depth={depth + 1}
                                      pathname={`${pathname}/${member.name}`}
                                      pageInterface={typeName}
                                      memberName={member.name}
                                      onClick={onClick}
                                  />
                              ))}
                    </NavGroup>
                    <ClosingBrackets depth={depth} isArray={isInterfaceArray} />
                </>
            )}
        </>
    );
}

function NavTypedUnionProperty({
    pageInterface,
    depth = 0,
    pathname,
    memberName,
    onClick,
}: {
    pageInterface: string;
    depth?: number;
    pathname: string;
    memberName: string;
    onClick?: (uri: To, selection: Selection) => void;
}) {
    const selection = useContext(SelectionContext);
    const reference = useContext(ApiReferenceContext);
    const interfaceRef = reference?.get(pageInterface);
    const defaultAnchorId = `reference-${pageInterface}-type`;

    if (interfaceRef?.kind !== 'interface') {
        return null;
    }

    const [isExpanded, toggleExpanded] = useToggle(
        selection?.selection.pageInterface === pageInterface &&
            Boolean(selection?.selection.anchorId) &&
            selection?.selection.anchorId !== defaultAnchorId
    );
    const typeMember = interfaceRef.members.find((member) => member.name === 'type');
    const isSelected =
        !isExpanded &&
        selection?.selection.pageInterface === pageInterface &&
        selection?.selection.anchorId === defaultAnchorId;

    if (typeof typeMember?.type !== 'string') {
        return null;
    }

    const normalizedType = typeMember.type.replaceAll("'", '');
    const pageTitle = { memberName, type: normalizedType };
    const handleClick = () =>
        onClick?.(
            { pathname: `${pathname}/${normalizedType}`, hash: defaultAnchorId },
            { pageInterface, pageTitle, anchorId: defaultAnchorId }
        );

    return (
        <>
            <div className={classnames(styles.navItem, isSelected && 'highlight')} onDoubleClick={toggleExpanded}>
                <span
                    className={classnames(
                        styles.propertyName,
                        styles.propertyExpandable,
                        depth > 1 && styles.propertyWhisker
                    )}
                >
                    <PropertyExpander isExpanded={isExpanded} onClick={toggleExpanded} />
                    <>
                        {isExpanded ? (
                            <span className={styles.punctuation}>{'{'}</span>
                        ) : (
                            <>
                                <span onClick={handleClick}>
                                    <span className={styles.punctuation}>{'{ '}</span>
                                    type
                                    <span className={styles.punctuation}> = '</span>
                                    <span className={styles.unionDiscriminator}>{normalizedType}</span>
                                    <span className={styles.punctuation}>'</span>
                                </span>
                                <span className={styles.punctuation} onClick={toggleExpanded}>
                                    {' ... }'}
                                </span>
                            </>
                        )}
                    </>
                </span>
            </div>
            {isExpanded && (
                <>
                    <NavGroup depth={depth + 1}>
                        {interfaceRef.members.map((member) => (
                            <NavProperty
                                key={member.name}
                                member={member}
                                depth={depth + 1}
                                pathname={`${pathname}/${normalizedType}`}
                                anchorId={`reference-${pageInterface}-${member.name}`}
                                pageInterface={pageInterface}
                                pageTitle={pageTitle}
                                onClick={onClick}
                            />
                        ))}
                    </NavGroup>
                    <ClosingBrackets depth={depth} />
                </>
            )}
        </>
    );
}

function NavBreadcrumb({
    breadcrumbs,
    rootInterface,
    basePath,
    children,
}: {
    breadcrumbs?: string[];
    rootInterface: string;
    basePath: string;
    children: ReactNode;
}) {
    const selection = useContext(SelectionContext);
    const isSelected = selection?.selection.pageInterface === rootInterface && !selection?.selection.anchorId;
    const handleClick = () => {
        selection?.setSelection({ pageInterface: rootInterface });
        window.scrollTo({ behavior: 'smooth', top: 0 });
        navigate(`${SITE_BASE_URL}${basePath}`);
    };

    return (
        <>
            {breadcrumbs?.map((breadcrumb, index) => (
                <NavGroup key={index} depth={index}>
                    {index > 0 && <div className={styles.navItem}>...</div>}
                    <div
                        className={classnames(
                            styles.navItem,
                            isSelected && index + 1 === breadcrumbs.length && 'highlight'
                        )}
                    >
                        <span className={classnames(styles.propertyName)} onClick={handleClick}>
                            {index > 0 && <PropertyExpander isExpanded />}
                            {breadcrumb}
                        </span>
                        {': {'}
                    </div>
                </NavGroup>
            ))}
            {children}
            {breadcrumbs?.map((_, index) => (
                <NavGroup key={index} depth={breadcrumbs.length - index - 1}>
                    <div className={styles.navItem}>{'}'}</div>
                </NavGroup>
            ))}
        </>
    );
}

function OpeningBrackets({
    isOpen,
    isArray,
    onClick,
}: {
    isOpen?: boolean;
    isArray?: boolean;
    onClick?: MouseEventHandler;
}) {
    let bracketString = ' ';
    if (isOpen) {
        bracketString += isArray ? '[' : '{';
    } else {
        bracketString += isArray ? '[ ... ]' : '{ ... }';
    }
    return (
        <span className={styles.punctuation} onClick={!isOpen ? onClick : undefined}>
            {bracketString}
        </span>
    );
}

function ClosingBrackets({ depth, isArray }: { depth: number; isArray?: boolean }) {
    return (
        <div className={classnames(styles.punctuation, styles.navItem, depth > 1 && styles.propertyWhisker)}>
            {isArray ? ']' : '}'}
        </div>
    );
}

function PropertyExpander({ isExpanded, onClick }: { isExpanded?: boolean; onClick?: () => void }) {
    return (
        <Icon
            name="chevronRight"
            svgClasses={classnames(styles.propertyExpander, isExpanded && styles.active)}
            onClick={onClick}
        />
    );
}
