import { Icon } from '@ag-website-shared/components/icon/Icon';
import { navigate, scrollIntoViewById, useLocation } from '@ag-website-shared/utils/navigation';
import Code from '@components/Code';
import type {
    ApiReferenceNode,
    ApiReferenceType,
    MemberNode,
    TypeAliasNode,
} from '@generate-code-reference-plugin/doc-interfaces/types';
import { fetchInterfacesReference } from '@utils/client/fetchInterfacesReference';
import { useToggle } from '@utils/hooks/useToggle';
import classnames from 'classnames';
import type { AllHTMLAttributes, CSSProperties } from 'react';
import { createContext, useContext, useEffect } from 'react';
import Markdown from 'react-markdown';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import remarkBreaks from 'remark-breaks';

import type { SpecialTypesMap } from '../apiReferenceHelpers';
import {
    cleanupName,
    formatTypeToCode,
    getMemberType,
    isInterfaceHidden,
    normalizeType,
    processMembers,
} from '../apiReferenceHelpers';
import styles from './ApiReference.module.scss';
import { SelectionContext } from './OptionsNavigation';
import { PropertyTitle, PropertyType } from './Properies';

export const ApiReferenceContext = createContext<ApiReferenceType | undefined>(undefined);
export const ApiReferenceConfigContext = createContext<ApiReferenceConfig>({});

// NOTE: Not on the layout level, as that is generated at build time, and queryClient needs to be
// loaded on the client side
const queryClient = new QueryClient();

const queryOptions = {
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
}

interface ApiReferenceOptions {
    id: string;
    anchorId?: string;
    className?: string;
}

interface ApiReferenceRowOptions {
    member: MemberNode;
    anchorId: string;
    prefixPath?: string[];
    isExpanded?: boolean;
    nestedPath?: string;
    onDetailsToggle?: () => void;
}

export function ApiReferenceWithContext({
    prioritise,
    include,
    exclude,
    hideHeader,
    hideRequired,
    ...props
}: ApiReferenceOptions & ApiReferenceConfig) {
    return (
        <QueryClientProvider client={queryClient}>
            <ApiReferenceConfigContext.Provider value={{ prioritise, include, exclude, hideHeader, hideRequired }}>
                <ApiReferenceWithReferenceContext {...props} />
            </ApiReferenceConfigContext.Provider>
        </QueryClientProvider>
    );
}

export function ApiReferenceWithReferenceContext(props: ApiReferenceOptions & ApiReferenceConfig) {
    const { data: reference } = useQuery(
        ['resolved-interfaces'],
        async () => {
            const data = await fetchInterfacesReference();
            return data;
        },
        queryOptions
    );

    return (
        <ApiReferenceContext.Provider value={reference}>
            <ApiReference {...props} />
        </ApiReferenceContext.Provider>
    );
}

export function ApiReference({ id, anchorId, className, ...props }: ApiReferenceOptions & AllHTMLAttributes<Element>) {
    const reference = useContext(ApiReferenceContext);
    const config = useContext(ApiReferenceConfigContext);
    const interfaceRef = reference?.get(id);
    const location = useLocation();

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
        <div {...props} className={classnames(styles.apiReferenceOuter, className)}>
            {anchorId && <a id={anchorId} />}
            {!config.hideHeader &&
                (interfaceRef.docs?.join('\n') ?? (
                    <p className={styles.propertyDescription}>
                        Properties available on the <code>{id}</code> interface.
                    </p>
                ))}
            <div className={classnames(styles.reference, styles.apiReference, 'no-zebra')}>
                <div>
                    {processMembers(interfaceRef, config).map((member) => (
                        <NodeFactory key={member.name} member={member} anchorId={`reference-${id}-${member.name}`} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function NodeFactory({ member, anchorId, prefixPath = [], ...props }: ApiReferenceRowOptions) {
    const [isExpanded, toggleExpanded, setExpanded] = useToggle();
    const interfaceRef = useMemberAdditionalDetails(member);
    const config = useContext(ApiReferenceConfigContext);
    const location = useLocation();

    const hasMembers = interfaceRef && 'members' in interfaceRef;
    const hasNestedPages = config.specialTypes?.[getMemberType(member)] === 'NestedPage';

    useEffect(() => {
        const hash = location?.hash.substring(1);
        if (hash === anchorId) {
            scrollToAndHighlightById(anchorId);
        } else if (hasMembers && hash?.startsWith(`${anchorId}-`)) {
            setExpanded(true);
        }
    }, [location?.hash]);

    return (
        <>
            <ApiReferenceRow
                {...props}
                member={member}
                anchorId={anchorId}
                prefixPath={prefixPath}
                isExpanded={isExpanded}
                onDetailsToggle={toggleExpanded}
            />
            {hasMembers &&
                isExpanded &&
                processMembers(interfaceRef, config).map((childMember) => (
                    <NodeFactory
                        key={childMember.name}
                        member={childMember}
                        anchorId={`${anchorId}-${cleanupName(childMember.name)}`}
                        prefixPath={prefixPath.concat(member.name)}
                        nestedPath={
                            hasNestedPages
                                ? `${location?.pathname}/${member.name}/${cleanupName(childMember.name)}`
                                : undefined
                        }
                    />
                ))}
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
}: ApiReferenceRowOptions) {
    const config = useContext(ApiReferenceConfigContext);
    const selection = useContext(SelectionContext);
    const memberName = cleanupName(member.name);
    const memberType = normalizeType(member.type);

    return (
        <div
            id={anchorId}
            className={classnames(styles.propertyRow, prefixPath && prefixPath.length > 0 && styles.isChildProp)}
            style={{ '--nested-path-depth': prefixPath?.length ?? 0 } as CSSProperties}
        >
            <div className={styles.leftColumn}>
                <PropertyTitle
                    name={memberName}
                    anchorId={anchorId}
                    prefixPath={prefixPath}
                    required={!config.hideRequired && !member.optional}
                />
                <PropertyType type={memberType} defaultValue={member.defaultValue} />
            </div>
            <div className={styles.rightColumn}>
                <div role="presentation" className={styles.description}>
                    <Markdown remarkPlugins={[remarkBreaks]}>{member.docs?.join('\n')}</Markdown>
                </div>
                {nestedPath ? (
                    <div className={styles.actions}>
                        <a
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
                                navigate(selectionState, { state: selectionState });
                            }}
                        >
                            See property details <Icon name="arrowRight" />
                        </a>
                    </div>
                ) : (
                    <MemberActions member={member} isExpanded={isExpanded} onDetailsToggle={onDetailsToggle} />
                )}
            </div>
        </div>
    );
}

function MemberActions({
    member,
    isExpanded,
    onDetailsToggle,
}: {
    member: MemberNode;
    isExpanded?: boolean;
    onDetailsToggle?: () => void;
}) {
    const additionalDetails = useMemberAdditionalDetails(member);
    const hasMembers = additionalDetails && 'members' in additionalDetails;
    const shouldExpand = isExpanded && additionalDetails && !hasMembers;

    if (additionalDetails == null) {
        return null;
    }

    return (
        <div className={styles.actions}>
            {additionalDetails && (
                <ToggleDetails
                    isOpen={isExpanded}
                    moreText={hasMembers ? 'See child properties' : 'More details'}
                    lessText={hasMembers ? 'Hide child properties' : 'Hide details'}
                    onToggle={onDetailsToggle}
                />
            )}
            {shouldExpand && <TypeCodeBlock apiNode={additionalDetails} />}
        </div>
    );
}

type ApiNode = ApiReferenceNode | MemberNode;

export function TypeCodeBlock({ apiNode }: { apiNode: ApiNode | ApiNode[] }) {
    const reference = useContext(ApiReferenceContext);

    if (!reference) {
        return null;
    }

    const codeSample = Array.isArray(apiNode)
        ? apiNode.map((apiNode) => formatTypeToCode(apiNode, reference))
        : formatTypeToCode(apiNode, reference);

    if (!codeSample?.length) {
        // eslint-disable-next-line no-console
        console.warn('Unknown API node', apiNode);
        return null;
    }

    return <Code code={codeSample} />;
}

function ToggleDetails({
    isOpen,
    moreText = 'More details',
    lessText = 'Hide details',
    onToggle,
}: {
    isOpen?: boolean;
    moreText?: string;
    lessText?: string;
    onToggle?: () => void;
}) {
    return (
        <button className={classnames(styles.seeMore, 'button-as-link')} onClick={onToggle}>
            {!isOpen ? moreText : lessText} <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} />
        </button>
    );
}

function useMemberAdditionalDetails(member: MemberNode) {
    const memberType = getMemberType(member);
    if (memberType === 'function') {
        return member;
    }
    const reference = useContext(ApiReferenceContext);
    if (reference?.has(memberType) && !isInterfaceHidden(memberType)) {
        return reference.get(memberType);
    }
    if (typeof member.type === 'object' && member.type.kind === 'union') {
        const unionTypes = member.type.type
            .map((unionType) => typeof unionType === 'string' && reference?.get(unionType))
            .filter((apiNode): apiNode is TypeAliasNode => typeof apiNode === 'object' && apiNode.kind === 'typeAlias');
        if (unionTypes.length) {
            return unionTypes;
        }
    }
}

function scrollToAndHighlightById(id: string) {
    scrollIntoViewById(id);
    const element = document.getElementById(id);
    element?.classList.add(styles.highlightAnimate);
    element?.addEventListener('animationend', () => {
        element.classList.remove(styles.highlightAnimate);
    });
}
