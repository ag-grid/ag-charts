import { Icon } from '@components/icon/Icon';
import { useToggle } from '@utils/hooks/useToggle';
import { navigate, scrollIntoView, useLocation } from '@utils/navigation';
import classnames from 'classnames';
import type { AllHTMLAttributes, CSSProperties, Dispatch, MouseEventHandler, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';

import type { ApiReferenceNode, ApiReferenceType, MemberNode } from '../api-reference-types';
import type { NavigationData, NavigationPath } from '../apiReferenceHelpers';
import { cleanupName, extractSearchData, getMemberType, getNavigationDataFromPath } from '../apiReferenceHelpers';
import { ApiReferenceConfigContext, ApiReferenceContext } from './ApiReference';
import styles from './OptionsNavigation.module.scss';
import { SearchBox } from './SearchBox';

export const SelectionContext = createContext<{
    selection: NavigationData;
    setSelection: Dispatch<SetStateAction<NavigationData>>;
} | null>(null);

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
    const config = useContext(ApiReferenceConfigContext);
    const interfaceRef = reference?.get(rootInterface);

    const searchData = useMemo(
        () => extractSearchData(reference, interfaceRef, [{ name: basePath, type: rootInterface }]),
        []
    );

    const handleClick = (navData: NavigationData) => {
        selection?.setSelection(navData);
        navigate(navData, { state: navData });
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
                    A comprehensive interactive explorer for the <strong>{rootInterface}</strong> structure.
                </p>
                <SearchBox
                    searchData={searchData}
                    onItemClick={(data) => {
                        const navData = getNavigationDataFromPath(data.navPath, config.specialTypes);
                        selection?.setSelection(navData);
                        navigate(navData, { state: navData });
                    }}
                />
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
                                        path={[
                                            { name: basePath, type: rootInterface },
                                            { name: member.name, type: getMemberType(member) },
                                        ]}
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
    path,
    onClick,
}: {
    member: MemberNode;
    depth?: number;
    path: { name: string; type: string }[];
    onClick?: (navData: NavigationData) => void;
}) {
    const selection = useContext(SelectionContext);
    const reference = useContext(ApiReferenceContext);
    const config = useContext(ApiReferenceConfigContext);
    const location = useLocation();

    const memberType = getMemberType(member);
    const interfaceRef = reference?.get(memberType);
    const isInterface = interfaceRef?.kind === 'interface';
    const isInterfaceArray = config?.specialTypes?.[memberType] === 'InterfaceArray';
    const hasNestedPages = config?.specialTypes?.[memberType] === 'NestedPage';
    const expandable = isInterface || isInterfaceArray;

    const navData = getNavigationDataFromPath(path, config?.specialTypes);

    const [isExpanded, toggleExpanded] = useAutoExpand(() =>
        isInterfaceArray
            ? typeof selection?.selection.pageInterface === 'string' &&
              getInterfaceArrayTypes(reference, interfaceRef).some(
                  (item) => item.type === selection?.selection.pageInterface
              )
            : hasNestedPages
            ? interfaceRef?.kind === 'interface' &&
              interfaceRef.members.some((member) => member.type === selection?.selection.pageInterface)
            : (selection?.selection.pageInterface === navData.pageInterface &&
                  selection?.selection.hash?.startsWith(navData.hash) &&
                  selection?.selection.hash !== navData.hash) ??
              false
    );

    const isSelected =
        location?.pathname === navData.pathname &&
        selection?.selection.pageInterface === navData.pageInterface &&
        selection?.selection.hash === navData.hash;

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
                    <span onClick={() => onClick?.(navData)}>
                        {member.name === 'type' && memberType.match(/^'\S+'$/) ? (
                            <>
                                type <span className={styles.punctuation}>= '</span>
                                <span className={styles.unionDiscriminator}>{cleanupName(memberType)}</span>'
                            </>
                        ) : (
                            cleanupName(member.name)
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
                            ? interfaceRef.members.map((childMember) => (
                                  <NavProperty
                                      key={childMember.name}
                                      depth={depth + 1}
                                      member={childMember}
                                      path={path.concat({
                                          name: cleanupName(childMember.name),
                                          type: getMemberType(childMember),
                                      })}
                                      onClick={onClick}
                                  />
                              ))
                            : getInterfaceArrayTypes(reference, interfaceRef).map(({ name, type }) => (
                                  <NavTypedUnionProperty
                                      key={type}
                                      depth={depth + 1}
                                      path={path.concat({ name, type })}
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
    depth = 0,
    path,
    onClick,
}: {
    depth?: number;
    path: NavigationPath[];
    onClick?: (navData: NavigationData) => void;
}) {
    const selection = useContext(SelectionContext);
    const reference = useContext(ApiReferenceContext);
    const config = useContext(ApiReferenceConfigContext);
    const navData = getNavigationDataFromPath(path, config?.specialTypes);
    const interfaceRef = reference?.get(navData.pageInterface);

    const [isExpanded, toggleExpanded] = useAutoExpand(
        () =>
            selection?.selection.pageInterface === navData.pageInterface &&
            Boolean(selection?.selection.hash) &&
            selection?.selection.hash !== navData.hash
    );

    if (interfaceRef?.kind !== 'interface') {
        return null;
    }

    const isSelected =
        !isExpanded &&
        selection?.selection.pageInterface === navData.pageInterface &&
        selection?.selection.hash === navData.hash;

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
                                <span onClick={() => onClick?.(navData)}>
                                    <span className={styles.punctuation}>{'{ '}</span>
                                    type
                                    <span className={styles.punctuation}> = '</span>
                                    <span className={styles.unionDiscriminator}>{path[path.length - 1].name}</span>
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
                                path={path.concat({ name: member.name, type: getMemberType(member) })}
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
    const isSelected = selection?.selection.pageInterface === rootInterface && !selection?.selection.hash;
    const handleClick = () => {
        const navData = {
            pathname: basePath,
            hash: '',
            pageInterface: rootInterface,
            pageTitle: { name: rootInterface },
        };
        selection?.setSelection(navData);
        window.scrollTo({ behavior: 'smooth', top: 0 });
        navigate(navData, { state: navData });
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

function useAutoExpand(shouldExpand: () => boolean): [boolean, () => void] {
    const [isExpanded, toggleExpanded, setExpanded] = useToggle(shouldExpand);
    const location = useLocation();

    useEffect(() => {
        if (!isExpanded) {
            setExpanded(shouldExpand());
        }
    }, [location?.pathname, location?.hash]);

    return [isExpanded, toggleExpanded];
}

function getInterfaceArrayTypes(reference?: ApiReferenceType, interfaceRef?: ApiReferenceNode) {
    if (
        interfaceRef?.kind === 'typeAlias' &&
        typeof interfaceRef.type === 'object' &&
        interfaceRef.type.kind === 'union' &&
        interfaceRef.type.type.every((type): type is string => typeof type === 'string')
    ) {
        return interfaceRef.type.type
            .map((type) => {
                const interfaceRef = reference?.get(type);
                if (interfaceRef?.kind === 'interface') {
                    const typeMember = interfaceRef.members.find((member) => member.name === 'type');
                    if (typeof typeMember?.type === 'string') {
                        return { name: cleanupName(typeMember.type), type };
                    }
                }
            })
            .filter((item): item is NavigationPath => item != null);
    }
    return [];
}
