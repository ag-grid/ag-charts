import Code from '@components/Code';
import { useToggle } from '@utils/hooks/useToggle';
import classnames from 'classnames';
import { createContext, useContext } from 'react';
import Markdown from 'react-markdown';

import type { ApiReferenceNode, ApiReferenceType, InterfaceNode, MemberNode } from '../api-reference-types';
import { formatTypeToCode, getMemberType } from '../utils/apiReferenceHelpers';
import styles from './ApiDocumentation.module.scss';
import { PropertyTitle, PropertyType } from './Properies';
import { ToggleDetails } from './ToggleDetails';

export const ApiReferenceContext = createContext<ApiReferenceType | null>(null);
export const ApiReferenceConfigContext = createContext<ApiReferenceConfig>({});

const hiddenInterfaces = [
    'CssColor',
    'FontStyle',
    'FontWeight',
    'FontSize',
    'FontFamily',
    'Opacity',
    'PixelSize',
    'Ratio',
];

interface ApiReferenceConfig {
    prioritise?: string[];
    include?: string[];
    exclude?: string[];
    hideHeader?: boolean;
    hideRequired?: boolean;
}

interface ApiReferenceOptions {
    id: string;
    className?: string;
}

interface ApiReferenceRowOptions {
    member: MemberNode;
    parentId: string;
    prefixPath?: string[];
    isExpanded?: boolean;
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

export function ApiReference({ id, className }: ApiReferenceOptions) {
    const reference = useContext(ApiReferenceContext);
    const config = useContext(ApiReferenceConfigContext);
    const interfaceRef = reference?.get(id);

    if (interfaceRef?.kind !== 'interface') {
        return null;
    }

    const interfaceMembers = processMembers(interfaceRef.members, config);

    return (
        <div className={classnames(styles.apiReferenceOuter, className)}>
            {!config.hideHeader &&
                (interfaceRef.docs?.join('\n') ?? (
                    <p>
                        Properties available on the <code>{id}</code> interface.
                    </p>
                ))}
            <table className={classnames(styles.reference, styles.apiReference, 'no-zebra')}>
                <tbody>
                    {interfaceMembers.map((member) => (
                        <NodeFactory key={member.name} member={member} parentId={id} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function NodeFactory({ member, parentId, prefixPath = [] }: ApiReferenceRowOptions) {
    const [isExpanded, toggleExpanded] = useToggle();
    const interfaceRef = useMemberAdditionalDetails(member);
    const shouldExpand = isExpanded && interfaceRef && 'members' in interfaceRef;

    return (
        <>
            <ApiReferenceRow
                member={member}
                parentId={parentId}
                prefixPath={prefixPath}
                isExpanded={isExpanded}
                onDetailsToggle={toggleExpanded}
            />
            {shouldExpand &&
                interfaceRef.members.map((childMember) => (
                    <NodeFactory
                        key={childMember.name}
                        member={childMember}
                        parentId={parentId}
                        prefixPath={prefixPath.concat(member.name)}
                    />
                ))}
        </>
    );
}

function ApiReferenceRow({ member, parentId, prefixPath, isExpanded, onDetailsToggle }: ApiReferenceRowOptions) {
    const config = useContext(ApiReferenceConfigContext);

    return (
        <tr>
            <td role="presentation" className={styles.leftColumn}>
                <PropertyTitle
                    name={member.name}
                    parentId={parentId}
                    prefixPath={prefixPath}
                    required={!config.hideRequired && !member.optional}
                />
                <PropertyType type={member.type} defaultValue={member.defaultValue} />
            </td>
            <td className={styles.rightColumn}>
                <div role="presentation" className={styles.description}>
                    <Markdown>{member.docs?.join('\n')}</Markdown>
                </div>
                <MemberActions member={member} isExpanded={isExpanded} onDetailsToggle={onDetailsToggle} />
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
    const shouldExpand = isExpanded && additionalDetails && !('members' in additionalDetails);

    // if (additionalDetails == null) {
    //     return null;
    // }

    return (
        <div className={styles.actions}>
            {additionalDetails && <ToggleDetails isOpen={isExpanded} onToggle={onDetailsToggle} />}
            {shouldExpand && <TypeCodeBlock apiNode={additionalDetails} />}
        </div>
    );
}

export function TypeCodeBlock({ apiNode }: { apiNode: ApiReferenceNode | MemberNode }) {
    const reference = useContext(ApiReferenceContext);

    if (!reference) {
        return null;
    }

    const codeSample = formatTypeToCode(apiNode, reference);

    if (!codeSample) {
        // eslint-disable-next-line no-console
        console.warn('Unknown API node', apiNode);
        return null;
    }

    return <Code code={codeSample} keepMarkup />;
}

function useMemberAdditionalDetails(member: MemberNode) {
    const memberType = getMemberType(member);
    if (memberType === 'function') {
        return member;
    }
    const reference = useContext(ApiReferenceContext);
    if (reference?.has(memberType) && !hiddenInterfaces.includes(memberType)) {
        return reference.get(memberType);
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
