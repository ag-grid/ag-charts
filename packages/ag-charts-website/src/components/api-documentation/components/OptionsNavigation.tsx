import { Icon } from '@ag-website-shared/components/icon/Icon';
import { scrollIntoView, scrollIntoViewById } from '@ag-website-shared/utils/navigation';
import type {
    ApiReferenceNode,
    ApiReferenceType,
    MemberNode,
    TypeNode,
} from '@generate-code-reference-plugin/doc-interfaces/types';
import { useToggle } from '@utils/hooks/useToggle';
import classnames from 'classnames';
import Flexsearch from 'flexsearch';
import {
    type AllHTMLAttributes,
    type CSSProperties,
    type Dispatch,
    type MouseEventHandler,
    type ReactNode,
    type SetStateAction,
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
} from 'react';

import {
    INDEXED_SEARCH_FIELD,
    type NavigationData,
    type NavigationPath,
    type SearchIndex,
    type SearchIndexDatum,
    buildTypeArgumentsFromGenericsMap,
    cleanupName,
    extractSearchData,
    getAliasedUnionVariants,
    getDetailsId,
    getMemberType,
    getNavigationDataFromPath,
    getVariantDiscriminator,
    isInterfaceHidden,
    isStringLiteralType,
    normalizeType,
    processMembers,
} from '../apiReferenceHelpers';
import { navigateToSelection, useApiReferenceLocation } from '../apiReferenceRouting';
import { ApiReferenceConfigContext, ApiReferenceContext } from './ApiReference';
import styles from './OptionsNavigation.module.scss';
import { SearchBox } from './SearchBox';

export const SelectionContext = createContext<{
    selection: NavigationData;
    setSelection: Dispatch<SetStateAction<NavigationData>>;
    rootInterface: string;
    basePath: string;
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
    const location = useApiReferenceLocation();
    const elementRef = useRef<HTMLDivElement>(null);
    const selection = useContext(SelectionContext);
    const reference = useContext(ApiReferenceContext);
    const config = useContext(ApiReferenceConfigContext);
    const interfaceRef = reference?.get(rootInterface);

    const searchData = useMemo(
        () => extractSearchData(reference, interfaceRef, [{ name: basePath, type: rootInterface }]),
        []
    );

    const searchDataIndex = useMemo<SearchIndex>(() => {
        const index = new Flexsearch.Document<SearchIndexDatum>({
            tokenize: 'forward',
            document: {
                id: 'id',
                index: [INDEXED_SEARCH_FIELD],
            },
        });

        searchData.forEach((entry, indexId) => {
            index.add({
                ...entry,
                id: indexId,
            });
        });

        return index;
    }, [searchData]);

    const handleClick = (navData: NavigationData) => {
        if (location?.pathname === navData.pathname && location.hash.substring(1) === navData.hash) {
            scrollIntoViewById(navData.hash);
            selection?.setSelection(navData);
        } else {
            selection?.setSelection(navData);
            navigateToSelection(navData);
        }
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
                <SearchBox
                    searchData={searchData}
                    searchDataIndex={searchDataIndex}
                    onItemClick={(data) => {
                        const navData = getNavigationDataFromPath(data.navPath, config.specialTypes);
                        selection?.setSelection(navData);
                        navigateToSelection(navData);
                    }}
                />
            </header>

            <pre className={classnames('code', styles.navContainer)}>
                <code className="language-ts">
                    <NavBreadcrumb breadcrumbs={breadcrumbs} rootInterface={rootInterface} basePath={basePath}>
                        {interfaceRef.kind === 'interface' && (
                            <NavGroup depth={breadcrumbs?.length ?? 0}>
                                {processMembers(interfaceRef, config).map((member) => (
                                    <NavProperty
                                        key={member.name}
                                        member={member}
                                        depth={breadcrumbs?.length ?? 0}
                                        genericsMap={interfaceRef.genericsMap}
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
    genericsMap,
    path,
    onClick,
}: {
    member: MemberNode;
    depth?: number;
    genericsMap?: Record<string, string>;
    path: { name: string; type: string }[];
    onClick?: (navData: NavigationData) => void;
}) {
    const selection = useContext(SelectionContext);
    const reference = useContext(ApiReferenceContext);
    const config = useContext(ApiReferenceConfigContext);
    const location = useApiReferenceLocation();

    const memberType = getMemberType(member);
    const interfaceRef = reference?.get(memberType);
    const isInterface = interfaceRef?.kind === 'interface';
    const isInterfaceArray = config.specialTypes?.[memberType] === 'InterfaceArray';
    const isInterfaceRecord = config.specialTypes?.[memberType] === 'InterfaceRecord';
    const hasNestedPages = config.specialTypes?.[memberType] === 'NestedPage';
    // Expand union members into their discriminated variants, covering both a direct union alias and an
    // empty interface whose heritage is one; special-type members navigate to their own pages instead.
    const unionVariants =
        !isInterfaceArray && !isInterfaceRecord && !hasNestedPages
            ? getAliasedUnionVariants(interfaceRef, reference)
            : undefined;
    const isTypedUnion = Boolean(unionVariants);
    const noExpand = config.noExpand?.includes(cleanupName(member.name));
    const expandable = !noExpand && (isInterface || isInterfaceArray || isInterfaceRecord || isTypedUnion);
    const isObjectArray =
        !isInterfaceArray &&
        !isInterfaceRecord &&
        typeof member.type === 'object' &&
        member.type.kind === 'array' &&
        reference?.has(memberType) &&
        !isInterfaceHidden(memberType);
    // A discriminated-union array renders like `series`: a plain array of `{ type=... }` branches,
    // not an array wrapping a single object literal (`[{ }]`).
    const isUnionArray = isTypedUnion && isObjectArray;
    // A union whose interface variants arrive through an array member (e.g. `text: TextOrSegments`,
    // where the segments are `ContentSegment[]`) renders as `[{ ... }]`.
    const isObjectArrayBrackets =
        (isObjectArray === true && !isUnionArray) || (isTypedUnion && unionVariants?.isArray === true);

    const navData = getNavigationDataFromPath(path, config.specialTypes);

    const [isExpanded, toggleExpanded] = useAutoExpand(() => {
        if (config.keepExpanded?.includes(member.name)) {
            return true;
        }
        if (isInterfaceArray || isInterfaceRecord) {
            return (
                typeof selection?.selection.pageInterface === 'string' &&
                getInterfaceArrayTypes(reference, interfaceRef).some(
                    (item) => item.type === selection?.selection.pageInterface
                )
            );
        }
        if (hasNestedPages) {
            return (
                interfaceRef?.kind === 'interface' &&
                interfaceRef.members.some(
                    (interfaceMember) => interfaceMember.type === selection?.selection.pageInterface
                )
            );
        }
        if (
            selection?.selection.pageInterface === navData.pageInterface &&
            selection?.selection.hash?.startsWith(navData.hash) &&
            selection?.selection.hash !== navData.hash
        ) {
            return true;
        }
        const baseHash = `reference-${selection?.rootInterface}`;
        if (navData.hash.startsWith(baseHash)) {
            const prePath = navData.hash
                .slice(baseHash.length + 1)
                .split('-')
                .filter(Boolean);
            if (selection?.selection.pathname.startsWith(selection?.basePath + prePath.join('/'))) {
                return true;
            }
        }
        return false;
    });

    const isSelected =
        location?.pathname === navData.pathname &&
        selection?.selection.pageInterface === navData.pageInterface &&
        selection?.selection.hash === navData.hash;

    let skip: string[] | undefined;
    if (member.omit && reference?.has(member.omit)) {
        const omitType = reference.get(member.omit)!;
        if (omitType.kind === 'typeAlias' && typeof omitType.type === 'object' && omitType.type.kind === 'union') {
            skip = omitType.type.type.map((type) => normalizeType(type).replace(/^'(.*)'$/, '$1'));
        }
    }

    let typeArguments: string[] | undefined;
    const hasMembers = interfaceRef && 'members' in interfaceRef;
    if (hasMembers && typeof member.type === 'object' && member.type.kind === 'typeRef') {
        typeArguments = member.type.typeArguments?.map((genericType) =>
            normalizeType(genericsMap?.[genericType as any] ?? genericType)
        );
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
                    <span onClick={() => onClick?.(navData)}>
                        {isStringLiteralType(memberType) ? (
                            <>
                                {member.name} <span className={styles.punctuation}>= '</span>
                                <span className={styles.unionDiscriminator}>{cleanupName(memberType)}</span>'
                            </>
                        ) : (
                            cleanupName(member.name)
                        )}
                        {isInterfaceRecord ? (
                            <>
                                .<span className={styles.recordAlias}>key</span>
                            </>
                        ) : (
                            ''
                        )}
                    </span>
                    {expandable && (
                        <OpeningBrackets
                            isOpen={isExpanded}
                            isArray={isInterfaceArray || isUnionArray}
                            isObjectArray={isObjectArrayBrackets}
                            onClick={toggleExpanded}
                        />
                    )}
                </span>
            </div>
            {expandable && isExpanded && (
                <>
                    <NavGroup depth={depth + 1}>
                        {isTypedUnion && unionVariants?.primitive && (
                            <NavUnionPrimitive
                                depth={depth + 1}
                                name={cleanupName(member.name)}
                                typeName={normalizeType(member.type)}
                                navData={{ ...navData, hash: getDetailsId(navData.hash) }}
                                onClick={onClick}
                            />
                        )}
                        {isInterface && !isTypedUnion
                            ? processMembers(interfaceRef, config, typeArguments)
                                  .filter((childMember) => !skip?.includes(childMember.name))
                                  .map((childMember) => (
                                      <NavProperty
                                          key={childMember.name}
                                          depth={depth + 1}
                                          genericsMap={interfaceRef.genericsMap}
                                          member={childMember}
                                          path={path.concat({
                                              name: cleanupName(childMember.name),
                                              type: getMemberType(childMember),
                                          })}
                                          onClick={onClick}
                                      />
                                  ))
                            : (unionVariants?.variants ?? getInterfaceArrayTypes(reference, interfaceRef)).map(
                                  ({ name, type }) => (
                                      <NavTypedUnionProperty
                                          key={type}
                                          depth={depth + 1}
                                          path={path.concat({ name, type })}
                                          isRecordUnion={isInterfaceRecord}
                                          genericsMap={unionVariants?.genericsMap}
                                          onClick={onClick}
                                      />
                                  )
                              )}
                    </NavGroup>
                    <ClosingBrackets
                        depth={depth}
                        isArray={isInterfaceArray || isUnionArray}
                        isObjectArray={isObjectArrayBrackets}
                    />
                </>
            )}
        </>
    );
}

function NavTypedUnionProperty({
    depth = 0,
    path,
    isRecordUnion,
    genericsMap,
    onClick,
}: {
    depth?: number;
    path: NavigationPath[];
    isRecordUnion: boolean;
    genericsMap?: Record<string, TypeNode>;
    onClick?: (navData: NavigationData) => void;
}) {
    const selection = useContext(SelectionContext);
    const reference = useContext(ApiReferenceContext);
    const config = useContext(ApiReferenceConfigContext);
    const navData = getNavigationDataFromPath(path, config.specialTypes);
    // `navData.pageInterface` only advances to the variant for InterfaceArray/Record special types;
    // for an inline aliased union it still points at the page's root interface.
    const variantType = path[path.length - 1].type;
    const interfaceRef = reference?.get(variantType);
    // An inline aliased-union variant shares its page with the root interface, so it must match on its own
    // subtree rather than the page, or any selection on that page auto-expands it.
    const isInlineUnion = navData.pageInterface !== variantType;

    const [isExpanded, toggleExpanded] = useAutoExpand(() => {
        const isWithinPage =
            selection?.selection.pageInterface === navData.pageInterface &&
            Boolean(selection?.selection.hash) &&
            selection?.selection.hash !== navData.hash;
        if (!isWithinPage) {
            return false;
        }
        return isInlineUnion ? Boolean(selection?.selection.hash?.startsWith(navData.hash)) : true;
    });

    if (interfaceRef?.kind !== 'interface') {
        return null;
    }

    const isSelected =
        !isExpanded &&
        selection?.selection.pageInterface === navData.pageInterface &&
        selection?.selection.hash === navData.hash;

    const typeArguments = buildTypeArgumentsFromGenericsMap(interfaceRef, genericsMap);
    const discriminatorKey = getVariantDiscriminator(interfaceRef)?.key ?? 'type';

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
                        {isRecordUnion ? <span className={styles.unionPipe}>| </span> : ''}
                        {isExpanded ? (
                            <span className={styles.punctuation}>{'{'}</span>
                        ) : (
                            <>
                                <span onClick={() => onClick?.(navData)}>
                                    <span className={styles.punctuation}>{'{ '}</span>
                                    {discriminatorKey}
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
                        {processMembers(interfaceRef, config, typeArguments).map((member) => (
                            <NavProperty
                                key={member.name}
                                member={member}
                                depth={depth + 1}
                                genericsMap={interfaceRef.genericsMap}
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

function NavUnionPrimitive({
    depth = 0,
    name,
    typeName,
    navData,
    onClick,
}: {
    depth?: number;
    name: string;
    typeName: string;
    navData: NavigationData;
    onClick?: (navData: NavigationData) => void;
}) {
    const selection = useContext(SelectionContext);
    const isSelected =
        selection?.selection.pageInterface === navData.pageInterface && selection?.selection.hash === navData.hash;

    return (
        <div className={classnames(styles.navItem, isSelected && 'highlight')}>
            <span className={classnames(styles.propertyName, depth > 1 && styles.propertyWhisker)}>
                <span onClick={() => onClick?.(navData)}>
                    {name}
                    <span className={styles.punctuation}>: </span>
                    <span className={styles.primitiveType}>{typeName}</span>
                </span>
            </span>
        </div>
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
        navigateToSelection(navData);
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
    isObjectArray,
    onClick,
}: {
    isOpen?: boolean;
    isArray?: boolean;
    isObjectArray?: boolean;
    onClick?: MouseEventHandler;
}) {
    let bracketString = ' ';
    if (isOpen) {
        if (isObjectArray) {
            bracketString += '[{';
        } else if (isArray) {
            bracketString += '[';
        } else {
            bracketString += '{';
        }
    } else if (isObjectArray) {
        bracketString += '[{ ... }]';
    } else if (isArray) {
        bracketString += '[ ... ]';
    } else {
        bracketString += '{ ... }';
    }

    return (
        <span className={styles.punctuation} onClick={isOpen ? undefined : onClick}>
            {bracketString}
        </span>
    );
}

function ClosingBrackets({
    depth,
    isArray,
    isObjectArray,
}: {
    depth: number;
    isArray?: boolean;
    isObjectArray?: boolean;
}) {
    let bracket = '}';
    if (isObjectArray) {
        bracket = '}]';
    } else if (isArray) {
        bracket = ']';
    }

    return (
        <div className={classnames(styles.punctuation, styles.navItem, depth > 1 && styles.propertyWhisker)}>
            {bracket}
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
    const location = useApiReferenceLocation();

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
        interfaceRef.type.kind === 'union'
    ) {
        return interfaceRef.type.type
            .map((type) => {
                const nodeType = normalizeType(type);
                const innerInterfaceRef = reference?.get(nodeType);
                const discriminator = getVariantDiscriminator(innerInterfaceRef);
                if (discriminator) {
                    return { name: discriminator.value, type: nodeType };
                }
            })
            .filter((item): item is NavigationPath => item != null);
    }
    return [];
}
