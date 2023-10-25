import { LinkIcon } from '@components/link-icon/LinkIcon';
import { useToggle } from '@utils/hooks/useToggle';
import classnames from 'classnames';
import { createContext, useContext } from 'react';
import Markdown from 'react-markdown';

import type { ApiReferenceType } from '../api-reference-types';
import styles from './ApiDocumentation.module.scss';
import { PropertyName } from './PropertyName';
import { ToggleDetails } from './ToggleDetails';

export const ApiReferenceContext = createContext<ApiReferenceType | null>(null);

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

interface ApiReferenceOptions {
    id: string;
    reference: ApiReferenceType;
}

export function ApiReference({ id, reference }: ApiReferenceOptions) {
    if (!reference.has(id)) {
        return null;
    }

    const interfaceRef = reference.get(id)!;

    console.log(
        interfaceRef.members.reduce((result, member) => {
            const memberType = getMemberType(member);
            if (!hiddenInterfaces.includes(memberType) && reference.has(memberType)) {
                result[member.name] = reference.get(memberType);
            }
            return result;
        }, {})
    );

    return (
        <ApiReferenceContext.Provider value={reference}>
            <div className={styles.apiReferenceOuter}>
                {interfaceRef.docs?.join('\n') ?? (
                    <p>
                        Properties available on the <code>{id}</code> interface.
                    </p>
                )}
                <table className={classnames(styles.reference, styles.apiReference, 'no-zebra')}>
                    <tbody>
                        {interfaceRef.members.map((member) => (
                            <ApiReferenceRow key={member.name} member={member} parentId={id} />
                        ))}
                    </tbody>
                </table>
            </div>
        </ApiReferenceContext.Provider>
    );
}

function ApiReferenceRow({ member, parentId }) {
    return (
        <tr>
            <td role="presentation" className={styles.leftColumn}>
                <MemberName member={member} parentId={parentId} />
                <MemberType member={member} />
            </td>
            <td className={styles.rightColumn}>
                <MemberDescription member={member} />
                <MemberActions member={member} />
            </td>
        </tr>
    );
}

function MemberName({ member, parentId }: { member: { name: string; optional: boolean }; parentId: string }) {
    const anchorId = `reference-${parentId}-${member.name}`;
    return (
        <h6 id={anchorId} className={classnames(styles.name, 'side-menu-exclude')}>
            <PropertyName isRequired={!member.optional}>{member.name}</PropertyName>
            <LinkIcon href={`#${anchorId}`} />
        </h6>
    );
}

function MemberType({ member }: { member: { type: string | object } }) {
    return (
        <div className={styles.metaList}>
            <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Type</span>
                <PropertyName className={styles.metaValue}>{normalizeType(member.type)}</PropertyName>
            </div>
        </div>
    );
}

function MemberDescription({ member }: { member: { type: string | object; docs?: string[] } }) {
    return (
        <div role="presentation" className={styles.description}>
            <Markdown>{member.docs?.join('\n') ?? normalizeType(member.type)}</Markdown>
        </div>
    );
}

function MemberActions({ member }: { member: { type: string | object; docs?: string[] } }) {
    const [isExpanded, toggleExpanded] = useToggle();
    const reference = useContext(ApiReferenceContext);

    if (reference === null) {
        return null;
    }

    const additionalDetails = getMemberAdditionalDetails(reference, member);

    return (
        <div className={styles.actions}>
            {additionalDetails && <ToggleDetails isOpen={isExpanded} onToggle={toggleExpanded} />}
        </div>
    );
}

function normalizeType(refType, includeGenerics?: boolean): string {
    if (typeof refType === 'string') {
        return refType;
    }
    switch (refType.kind) {
        case 'array':
            return `${normalizeType(refType.type, includeGenerics)}[]`;
        case 'typeRef':
            return refType.type;
        case 'union':
            return refType.type.map((subType) => normalizeType(subType)).join(' | ');
        case 'function':
            return 'Function';
        default:
            console.log(refType);
            return '';
    }
}

function getMemberType(member) {
    return typeof member.type === 'object' ? member.type.type ?? member.type.kind : member.type;
}

function getMemberAdditionalDetails(reference: ApiReferenceType, member) {
    const memberType = getMemberType(member);
    if (reference?.has(memberType) && !hiddenInterfaces.includes(memberType)) {
        // console.log(member);
        return true;
    }
}
