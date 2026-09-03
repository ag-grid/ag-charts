import Code from '@ag-website-shared/components/code/Code';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import styles from '@ag-website-shared/components/reference-documentation/ApiReference.module.scss';
import { scrollIntoViewById } from '@ag-website-shared/utils/navigation';
import type {
    InterfaceNode,
    MemberNode,
    NodeTypes,
    TypeLiteralNode,
    TypeNode,
} from '@generate-code-reference-plugin/doc-interfaces/types';
import { fetchInterfacesReference } from '@utils/client/fetchInterfacesReference';
import { useToggle } from '@utils/hooks/useToggle';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import classnames from 'classnames';
import {
    type AllHTMLAttributes,
    type CSSProperties,
    Children,
    createContext,
    isValidElement,
    useContext,
    useEffect,
    useMemo,
} from 'react';
import Markdown, { type Components } from 'react-markdown';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import remarkBreaks from 'remark-breaks';

import {
    type SpecialTypesMap,
    buildTypeArguments,
    buildTypeArgumentsFromGenericsMap,
    cleanupName,
    formatTypeToCode,
    formatUnionSignature,
    getDetailsId,
    getMemberType,
    getReferencedTypeName,
    getVariantDiscriminator,
    isArrayNode,
    isInterfaceHidden,
    isUnionTypeAlias,
    mergeGenericsMaps,
    normalizeType,
    parseJsDocs,
    processMembers,
    resolveAliasedUnion,
    resolveReferenceType,
} from '../apiReferenceHelpers';
import { navigateToSelection, useApiReferenceLocation } from '../apiReferenceRouting';
import { SelectionContext } from './OptionsNavigation';
import { type CollapsibleType, PropertyTitle, PropertyType } from './Properties';

export const ApiReferenceContext = createContext<Map<string, NodeTypes> | undefined>(undefined);
export const ApiReferenceConfigContext = createContext<ApiReferenceConfig>({});
type ReferenceMap = Map<string, NodeTypes>;
interface UnionVariant {
    anchorSegment: string;
    node: InterfaceNode;
    typeArguments?: string[];
    discriminator?: { key: string; value: string };
}
interface UnionTypesDetails {
    kind: 'unionTypes';
    variants: UnionVariant[];
    genericsMap?: Record<string, TypeNode>;
    // Type signature shown for mixed unions, preserving the members the variant rows omit. Undefined
    // for pure interface-only unions (see formatUnionSignature).
    signature?: string;
}
type MemberAdditionalDetails = NodeTypes | NodeTypes[] | UnionTypesDetails | undefined;

// NOTE: Not on the layout level, as that is generated at build time, and queryClient needs to be
// loaded on the client side
export const queryClient = new QueryClient();

export const queryOptions = {
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
};

export interface ApiReferenceConfig {
    prioritise?: string[];
    include?: string[];
    exclude?: string[];
    hideHeader?: boolean;
    hideRequired?: boolean;
    specialTypes?: SpecialTypesMap;
    keepExpanded?: string[];
    noExpand?: string[];
}

interface ApiReferenceOptions {
    id: string;
    anchorId?: string;
    className?: string;
    isInline?: boolean;
}

interface ApiReferenceRowOptions {
    member: MemberNode;
    anchorId: string;
    prefixPath?: string[];
    isExpanded?: boolean;
    nestedPath?: string;
    typeArguments?: string[];
    genericsMap?: Record<string, TypeNode>;
    onDetailsToggle?: () => void;
    isSignatureExpanded?: boolean;
    onSignatureToggle?: () => void;
}

export function ApiReferenceWithContext({
    prioritise,
    include,
    exclude,
    hideHeader,
    hideRequired,
    noExpand,
    ...props
}: ApiReferenceOptions & ApiReferenceConfig) {
    return (
        <QueryClientProvider client={queryClient}>
            <ApiReferenceConfigContext.Provider
                value={{ prioritise, include, exclude, hideHeader, hideRequired, noExpand }}
            >
                <ApiReferenceWithReferenceContext {...props} />
            </ApiReferenceConfigContext.Provider>
        </QueryClientProvider>
    );
}

export function ApiReferenceWithReferenceContext(props: ApiReferenceOptions & ApiReferenceConfig) {
    const { data: reference } = useQuery(['resolved-interfaces'], fetchInterfacesReference, queryOptions);
    return (
        <ApiReferenceContext.Provider value={reference}>
            <ApiReference {...props} />
        </ApiReferenceContext.Provider>
    );
}

const docsMarkdownComponents: Components = {
    a({ children, href, ...props }) {
        const hasCode = Children.toArray(children).some((child) => isValidElement(child) && child.type === 'code');
        return (
            // Safari omits links from the tab order without an explicit tabindex.
            <a tabIndex={0} href={href} className={hasCode ? 'meta-link' : undefined} {...props}>
                {children}
            </a>
        );
    },
};

export function ChildPropertiesButton({
    name,
    isExpanded,
    onClick,
}: {
    name: string;
    isExpanded?: boolean;
    onClick?: () => void;
    collapsibleType?: CollapsibleType;
}) {
    return (
        <button
            type="button"
            // Safari omits buttons from the tab order without an explicit tabindex.
            tabIndex={0}
            className={classnames(styles.childButton, 'button-as-link', {
                [styles.isExpanded]: isExpanded,
            })}
            onClick={onClick}
            aria-expanded={Boolean(isExpanded)}
            aria-label={`${isExpanded ? 'Hide' : 'See'} child properties of ${name}`}
        >
            <Icon svgClasses={styles.childChevron} name="chevronRight" />
            <span>{isExpanded ? 'Hide' : 'See'} child properties</span>
        </button>
    );
}

function UnionTypesButton({ name, isExpanded, onClick }: { name: string; isExpanded?: boolean; onClick?: () => void }) {
    return (
        <button
            type="button"
            // Safari omits buttons from the tab order without an explicit tabindex.
            tabIndex={0}
            className={classnames(styles.unionTypesButton, 'button-as-link', {
                [styles.isExpanded]: isExpanded,
            })}
            onClick={onClick}
            aria-expanded={Boolean(isExpanded)}
            aria-label={`${isExpanded ? 'Hide' : 'See'} available interfaces of ${name}`}
        >
            <Icon svgClasses={styles.childChevron} name="chevronRight" />
            <span>{isExpanded ? 'Hide' : 'See'} available interfaces</span>
        </button>
    );
}

function UnionVariantNode({
    variant,
    anchorId,
    prefixPath,
}: {
    variant: UnionVariant;
    anchorId: string;
    prefixPath: string[];
}) {
    const [isExpanded, toggleExpanded, setExpanded] = useToggle();
    const config = useContext(ApiReferenceConfigContext);
    const location = useApiReferenceLocation();
    const docs = parseJsDocs(variant.node.docs);
    const { discriminator } = variant;
    const displayName = discriminator ? `[${discriminator.key}='${discriminator.value}']` : variant.anchorSegment;

    useEffect(() => {
        const hash = location?.hash.substring(1);
        if (hash === anchorId) {
            scrollToAndHighlightById(anchorId);
        } else if (hash?.startsWith(`${anchorId}-`)) {
            setExpanded(true);
        }
    }, [location?.hash, anchorId, setExpanded]);

    return (
        <>
            <div
                id={anchorId}
                className={classnames(
                    'property-row',
                    styles.propertyRow,
                    styles.isChildProp,
                    isExpanded && styles.expandedChildProps
                )}
                style={{ '--nested-path-depth': prefixPath.length } as CSSProperties}
            >
                <div className={styles.leftColumn}>
                    <PropertyTitle
                        name={displayName}
                        anchorId={anchorId}
                        prefixPath={prefixPath}
                        nameSeparator={discriminator ? '' : undefined}
                        hasChildProps
                        childPropsOnClick={toggleExpanded}
                    />
                    <PropertyType
                        name={variant.anchorSegment}
                        type={variant.node.name}
                        collapsibleType="childrenProperties"
                        isExpanded={isExpanded}
                        onCollapseClick={toggleExpanded}
                    />
                </div>
                <div className={styles.rightColumn}>
                    <div role="presentation" className={styles.description}>
                        {docs && (
                            <Markdown
                                remarkPlugins={[remarkBreaks]}
                                urlTransform={(url: string) => urlWithBaseUrl(url)}
                                components={docsMarkdownComponents}
                            >
                                {docs}
                            </Markdown>
                        )}
                        <ChildPropertiesButton
                            name={variant.anchorSegment}
                            isExpanded={isExpanded}
                            onClick={toggleExpanded}
                        />
                    </div>
                </div>
            </div>
            {isExpanded && (
                <div className={styles.childPropsList}>
                    {processMembers(variant.node, config, variant.typeArguments).map((childMember) => (
                        <NodeFactory
                            key={childMember.name}
                            member={childMember}
                            anchorId={`${anchorId}-${cleanupName(childMember.name)}`}
                            prefixPath={prefixPath.concat(displayName)}
                            genericsMap={variant.node.genericsMap}
                        />
                    ))}
                </div>
            )}
        </>
    );
}

export function ApiReference({
    id,
    anchorId,
    className,
    isInline,
    ...props
}: ApiReferenceOptions & AllHTMLAttributes<Element>) {
    const reference = useContext(ApiReferenceContext);
    const config = useContext(ApiReferenceConfigContext);
    const interfaceRef = reference?.get(id);
    const location = useApiReferenceLocation();

    // include / exclude / prioritise scope the top-level interface only; nested interfaces
    // and union variants must render their full member set.
    const nestedConfig = useMemo(
        () => ({ ...config, include: undefined, exclude: undefined, prioritise: undefined }),
        [config]
    );

    useEffect(() => {
        const hash = location?.hash.substring(1);
        if (typeof anchorId === 'string' && hash === anchorId) {
            scrollIntoViewById(anchorId);
        }
    }, [location?.hash]);

    if (interfaceRef?.kind !== 'interface') {
        return null;
    }

    return (
        <div
            {...props}
            className={classnames(styles.apiReferenceOuter, className, {
                [styles.isInline]: isInline,
            })}
        >
            {anchorId && <a id={anchorId} />}
            {!config.hideHeader &&
                (parseJsDocs(interfaceRef.docs) ?? (
                    <p className={styles.propertyDescription}>
                        Properties available on the <code>{id}</code> interface.
                    </p>
                ))}

            <div className={classnames(styles.reference, styles.apiReference, 'no-zebra')}>
                <ApiReferenceConfigContext.Provider value={nestedConfig}>
                    {processMembers(interfaceRef, config).map((member) => (
                        <NodeFactory
                            key={member.name}
                            member={member}
                            anchorId={`reference-${id}-${member.name}`}
                            genericsMap={interfaceRef.genericsMap}
                        />
                    ))}
                </ApiReferenceConfigContext.Provider>
            </div>
        </div>
    );
}

function NodeFactory({ member, anchorId, genericsMap, prefixPath = [], ...props }: ApiReferenceRowOptions) {
    const [isExpanded, toggleExpanded, setExpanded] = useToggle();
    const [isSignatureExpanded, toggleSignature, setSignatureExpanded] = useToggle();
    const interfaceRef = useMemberAdditionalDetails(member);
    const config = useContext(ApiReferenceConfigContext);
    const location = useApiReferenceLocation();

    const hasMembers = hasMembersNode(interfaceRef);
    const hasNestedPages = config.specialTypes?.[getMemberType(member)] === 'NestedPage';
    const canExpand = hasMembers || isUnionTypesDetails(interfaceRef);

    const typeArguments = hasMembers ? buildTypeArguments(member, genericsMap) : undefined;

    useEffect(() => {
        const hash = location?.hash.substring(1);
        if (hash === anchorId) {
            scrollToAndHighlightById(anchorId);
        } else if (hash === getDetailsId(anchorId)) {
            // The nav's primitive-union link targets the signature code block, not the variant list.
            scrollToAndHighlightById(anchorId);
            setSignatureExpanded(true);
        } else if (canExpand && hash?.startsWith(`${anchorId}-`)) {
            setExpanded(true);
        }
    }, [location?.hash, anchorId, canExpand, setExpanded, setSignatureExpanded]);

    return (
        <>
            <ApiReferenceRow
                {...props}
                member={member}
                anchorId={anchorId}
                prefixPath={prefixPath}
                isExpanded={isExpanded}
                onDetailsToggle={toggleExpanded}
                isSignatureExpanded={isSignatureExpanded}
                onSignatureToggle={toggleSignature}
            />
            {hasMembers && isExpanded && (
                <div className={styles.childPropsList}>
                    {processMembers(interfaceRef, config, typeArguments).map((childMember) => (
                        <NodeFactory
                            key={childMember.name}
                            member={childMember}
                            anchorId={`${anchorId}-${cleanupName(childMember.name)}`}
                            prefixPath={prefixPath.concat(member.name)}
                            genericsMap={isInterfaceNode(interfaceRef) ? interfaceRef.genericsMap : undefined}
                            nestedPath={
                                hasNestedPages
                                    ? `${location?.pathname}/${member.name}/${cleanupName(childMember.name)}`
                                    : undefined
                            }
                        />
                    ))}
                </div>
            )}
            {isUnionTypesDetails(interfaceRef) && isExpanded && (
                <div className={styles.childPropsList}>
                    {interfaceRef.variants.map((variant) => (
                        <UnionVariantNode
                            key={variant.anchorSegment}
                            variant={variant}
                            anchorId={`${anchorId}-${variant.anchorSegment}`}
                            prefixPath={prefixPath.concat(cleanupName(member.name))}
                        />
                    ))}
                </div>
            )}
        </>
    );
}

function ApiReferenceRow({
    member,
    anchorId,
    prefixPath,
    isExpanded,
    nestedPath,
    onDetailsToggle,
    isSignatureExpanded,
    onSignatureToggle,
}: ApiReferenceRowOptions) {
    const config = useContext(ApiReferenceConfigContext);
    const selection = useContext(SelectionContext);
    const memberName = cleanupName(member.name);
    const memberType = normalizeType(member.type);
    const additionalDetails = useMemberAdditionalDetails(member);
    const collapsibleType = getCollapsibleType(additionalDetails, nestedPath);
    const hasChildProps = collapsibleType === 'childrenProperties';
    const isUnionTypes = collapsibleType === 'unionTypes';
    const signature = isUnionTypesDetails(additionalDetails) ? additionalDetails.signature : undefined;
    const isSpecialType = Boolean(config.specialTypes?.[getMemberType(member)]);

    return (
        <div
            id={anchorId}
            className={classnames(
                'property-row',
                styles.propertyRow,
                prefixPath && prefixPath.length > 0 && styles.isChildProp,
                isExpanded && hasChildProps && styles.expandedChildProps,
                isExpanded && isUnionTypes && styles.expandedUnionTypes
            )}
            style={{ '--nested-path-depth': prefixPath?.length ?? 0 } as CSSProperties}
        >
            <div className={styles.leftColumn}>
                <PropertyTitle
                    name={memberName}
                    anchorId={anchorId}
                    prefixPath={prefixPath}
                    required={!config.hideRequired && !member.optional}
                    hasChildProps={hasChildProps}
                    isExpandable={isUnionTypes}
                    childPropsOnClick={onDetailsToggle}
                />
                <PropertyType
                    name={memberName}
                    type={memberType}
                    defaultValue={member.defaultValue}
                    collapsibleType={collapsibleType}
                    isExpanded={isExpanded}
                    onCollapseClick={onDetailsToggle}
                    hasSignature={Boolean(signature)}
                    isSignatureExpanded={isSignatureExpanded}
                    onSignatureToggle={onSignatureToggle}
                />
            </div>
            <div className={styles.rightColumn}>
                <div role="presentation" className={styles.description}>
                    <Markdown
                        remarkPlugins={[remarkBreaks]}
                        urlTransform={(url: string) => urlWithBaseUrl(url)}
                        components={docsMarkdownComponents}
                    >
                        {parseJsDocs(member.docs)}
                    </Markdown>
                    {hasChildProps && (
                        <ChildPropertiesButton name={memberName} isExpanded={isExpanded} onClick={onDetailsToggle} />
                    )}
                    {isUnionTypes && (
                        <UnionTypesButton name={memberName} isExpanded={isExpanded} onClick={onDetailsToggle} />
                    )}
                </div>
                {nestedPath && (
                    <div className={styles.actions}>
                        <a
                            tabIndex={0}
                            href={nestedPath}
                            onClick={(event) => {
                                event.preventDefault();
                                const selectionState = {
                                    pathname: nestedPath,
                                    hash: `reference-${memberType}`,
                                    pageInterface: memberType,
                                    pageTitle: { name: memberName },
                                };
                                selection?.setSelection(selectionState);
                                navigateToSelection(selectionState);
                            }}
                        >
                            See property details <Icon name="arrowRight" />
                        </a>
                    </div>
                )}
            </div>

            {collapsibleType === 'code' && isExpanded && (
                <div id={getDetailsId(anchorId)} className={classnames(styles.expandedContent)}>
                    <TypeCodeBlock
                        apiNode={additionalDetails as NodeTypes | NodeTypes[]}
                        member={member}
                        expandReferences={!isSpecialType}
                    />
                </div>
            )}

            {signature && isSignatureExpanded && (
                <div id={getDetailsId(anchorId)} className={styles.expandedContent}>
                    <Code code={signature} />
                </div>
            )}
        </div>
    );
}

export function TypeCodeBlock({
    apiNode,
    member,
    expandReferences = true,
}: {
    apiNode: NodeTypes | NodeTypes[];
    member: MemberNode;
    expandReferences?: boolean;
}) {
    const reference = useContext(ApiReferenceContext);

    if (!reference) {
        return null;
    }

    const seen = new Set<string>();
    const codeSample = Array.isArray(apiNode)
        ? apiNode.map((arrayApiNode) =>
              formatTypeToCode(arrayApiNode, member, reference, seen, member.name, expandReferences)
          )
        : formatTypeToCode(apiNode, member, reference, seen, member.name, expandReferences);

    if (!codeSample?.length) {
        // eslint-disable-next-line no-console
        console.warn('Unknown API node', apiNode);
        return null;
    }

    return <Code code={codeSample} />;
}

function getCollapsibleType(additionalDetails: MemberAdditionalDetails, nestedPath?: string): CollapsibleType {
    if (hasMembersNode(additionalDetails)) {
        return 'childrenProperties';
    }
    // A nested-page member keeps its "See property details" link and is never hijacked into inline content.
    if (nestedPath) {
        return 'none';
    }
    if (isUnionTypesDetails(additionalDetails)) {
        return 'unionTypes';
    }
    if (additionalDetails) {
        return 'code';
    }
    return 'none';
}

function useMemberAdditionalDetails(member: MemberNode): MemberAdditionalDetails {
    const reference = useContext(ApiReferenceContext);
    const config = useContext(ApiReferenceConfigContext);
    const memberType = getMemberType(member);

    // A member with its own dedicated page (e.g. `theme`) renders as a plain, non-expandable row.
    if (config.noExpand?.includes(cleanupName(member.name))) {
        return undefined;
    }

    if (memberType === 'function') {
        return member;
    }

    const resolvedDetails = resolveReferenceType(reference, memberType);

    // Members registered as special types navigate to their own pages (series, axes, mini-chart
    // series, annotations); they must keep that behaviour rather than expand inline as unions.
    const specialType = config.specialTypes?.[memberType];
    if (specialType === 'InterfaceArray' || specialType === 'InterfaceRecord' || specialType === 'NestedPage') {
        return resolvedDetails;
    }

    // Expand a union of named interfaces into its variants; primitive members are dropped from the list.
    const aliasedUnion = resolveAliasedUnion(
        resolvedDetails && !Array.isArray(resolvedDetails) ? resolvedDetails : undefined,
        reference
    );
    if (aliasedUnion) {
        const variants = collectUnionVariants(aliasedUnion.unionType.type, reference, aliasedUnion.genericsMap);
        if (variants.length) {
            return {
                kind: 'unionTypes',
                variants,
                genericsMap: aliasedUnion.genericsMap,
                signature: reference ? formatUnionSignature(aliasedUnion.unionType, memberType, reference) : undefined,
            };
        }
    }

    if (resolvedDetails) {
        return resolvedDetails;
    }

    // Inline union (not declared through a named alias): same treatment as the aliased union above.
    if (typeof member.type === 'object' && member.type.kind === 'union') {
        const variants = collectUnionVariants(member.type.type, reference);
        if (variants.length) {
            return {
                kind: 'unionTypes',
                variants,
                signature: reference ? formatUnionSignature(member.type, undefined, reference) : undefined,
            };
        }
    }
}

function collectUnionVariants(
    unionTypes: TypeNode[],
    reference: ReferenceMap | undefined,
    genericsMap?: Record<string, TypeNode>
): UnionVariant[] {
    return unionTypes.flatMap((unionType) => {
        // Unwrap array members (e.g. `ContentSegment[]`) to their element type.
        const elementType = isArrayNode(unionType) ? unionType.type : unionType;
        const typeName = getReferencedTypeName(elementType);
        const node = typeName ? reference?.get(typeName) : undefined;
        // A member that is itself a named union alias (e.g.
        // `ContentSegment = TextSegment | ImageSegment`) expands into its own variants.
        if (isUnionTypeAlias(node)) {
            return collectUnionVariants(node.type.type, reference, mergeGenericsMaps(node.genericsMap, genericsMap));
        }
        const variant = toUnionVariant(node, genericsMap);
        return variant ? [variant] : [];
    });
}

function toUnionVariant(node: NodeTypes | undefined, genericsMap?: Record<string, TypeNode>): UnionVariant | null {
    if (node?.kind !== 'interface' || isInterfaceHidden(node.name)) {
        return null;
    }
    const discriminator = getVariantDiscriminator(node);
    return {
        anchorSegment: discriminator?.value ?? cleanupName(node.name),
        node,
        typeArguments: buildTypeArgumentsFromGenericsMap(node, genericsMap),
        discriminator,
    };
}

function hasMembersNode(node?: MemberAdditionalDetails): node is InterfaceNode | TypeLiteralNode {
    return Boolean(node && !Array.isArray(node) && 'members' in node);
}

function isUnionTypesDetails(node?: MemberAdditionalDetails): node is UnionTypesDetails {
    return Boolean(node && !Array.isArray(node) && 'kind' in node && node.kind === 'unionTypes');
}

function isInterfaceNode(node?: MemberAdditionalDetails): node is InterfaceNode {
    return Boolean(node && !Array.isArray(node) && 'kind' in node && node.kind === 'interface');
}

function scrollToAndHighlightById(id: string) {
    scrollIntoViewById(id);
    const element = document.getElementById(id);
    element?.classList.add(styles.highlightAnimate);
    element?.addEventListener('animationend', () => {
        element.classList.remove(styles.highlightAnimate);
    });
}
