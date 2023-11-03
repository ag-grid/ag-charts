import Code from '@components/Code';
import { Icon } from '@components/icon/Icon';
import { useToggle } from '@utils/hooks/useToggle';
import { navigate, scrollIntoViewById, useLocation } from '@utils/navigation';
import classnames from 'classnames';
import type { AllHTMLAttributes } from 'react';
import { createContext, useContext, useEffect } from 'react';
import Markdown from 'react-markdown';

import type { ApiReferenceNode, ApiReferenceType, MemberNode, TypeAliasNode } from '../api-reference-types';
import type { SpecialTypesMap } from '../apiReferenceHelpers';
import { cleanupName, formatTypeToCode, getMemberType, isInterfaceHidden, normalizeType } from '../apiReferenceHelpers';
import styles from './ApiReference.module.scss';
import { SelectionContext } from './OptionsNavigation';
import { PropertyTitle, PropertyType } from './Properies';

export const ApiReferenceContext = createContext<ApiReferenceType | undefined>(undefined);
export const ApiReferenceConfigContext = createContext<ApiReferenceConfig>({});

export interface ApiReferenceConfig {
    prioritise?: string[];
    include?: string[];
    exclude?: string[];
    hideHeader?: boolean;
    hideRequired?: boolean;
    specialTypes?: SpecialTypesMap;
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
    reference,
    prioritise,
    include,
    exclude,
    hideHeader,
    hideRequired,
    ...props
}: ApiReferenceOptions & ApiReferenceConfig & { reference: ApiReferenceType }) {
    return (
        <ApiReferenceContext.Provider value={reference}>
            <ApiReferenceConfigContext.Provider value={{ prioritise, include, exclude, hideHeader, hideRequired }}>
                <ApiReference {...props} />
            </ApiReferenceConfigContext.Provider>
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
                    <p>
                        Properties available on the <code>{id}</code> interface.
                    </p>
                ))}
            <table className={classnames(styles.reference, styles.apiReference, 'no-zebra')}>
                <tbody>
                    {processMembers(interfaceRef.members, config).map((member) => (
                        <NodeFactory key={member.name} member={member} anchorId={`reference-${id}-${member.name}`} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function NodeFactory({ member, anchorId, prefixPath = [], ...props }: ApiReferenceRowOptions) {
    const [isExpanded, toggleExpanded, setExpanded] = useToggle();
    const interfaceRef = useMemberAdditionalDetails(member);
    const config = useContext(ApiReferenceConfigContext);
    const location = useLocation();

    const hasMembers = interfaceRef && 'members' in interfaceRef;
    const hasNestedPages = config?.specialTypes?.[getMemberType(member)] === 'NestedPage';

    useEffect(() => {
        const hash = location?.hash.substring(1);
        if (hash === anchorId) {
            scrollIntoViewById(anchorId);
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
                interfaceRef.members.map((childMember) => (
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
        <tr id={anchorId}>
            <td className={styles.leftColumn}>
                <PropertyTitle
                    name={memberName}
                    anchorId={anchorId}
                    prefixPath={prefixPath}
                    required={!config.hideRequired && !member.optional}
                />
                <PropertyType type={memberType} defaultValue={member.defaultValue} />
            </td>
            <td className={styles.rightColumn}>
                <div role="presentation" className={styles.description}>
                    <Markdown>{member.docs?.join('\n')}</Markdown>
                </div>
                {nestedPath ? (
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
                        See property details
                    </a>
                ) : (
                    <MemberActions member={member} isExpanded={isExpanded} onDetailsToggle={onDetailsToggle} />
                )}
            </td>
        </tr>
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
                    moreText={hasMembers ? 'Expand interface' : 'More details'}
                    lessText={hasMembers ? 'Collapse interface' : 'Hide details'}
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
        <button className={classnames(styles.seeMore, 'button-as-link')} role="presentation" onClick={onToggle}>
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

function processMembers(members: MemberNode[], config: ApiReferenceConfig) {
    const { prioritise, include, exclude } = config;
    if (include?.length || exclude?.length) {
        members = members.filter(
            (member) => !exclude?.includes(member.name) && (include?.includes(member.name) ?? true)
        );
    }
    if (prioritise) {
        return members.sort((a, b) => (prioritise.includes(a.name) ? -1 : prioritise.includes(b.name) ? 1 : 0));
    }
    return members;
}
