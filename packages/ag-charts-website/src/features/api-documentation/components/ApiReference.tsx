import Code from '@components/Code';
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
    include?: string[];
    exclude?: string[];
    noHeader?: boolean;
    displayFirst?: string[];
}

export function ApiReference({ id, reference, displayFirst, include, exclude, noHeader }: ApiReferenceOptions) {
    if (!reference.has(id)) {
        return null;
    }

    const interfaceRef = reference.get(id)!;
    const interfaceMembers = processMembers(interfaceRef.members, { displayFirst, include, exclude });

    return (
        <ApiReferenceContext.Provider value={reference}>
            <div className={styles.apiReferenceOuter}>
                {!noHeader &&
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
        </ApiReferenceContext.Provider>
    );
}

function NodeFactory({ member, parentId, prefixPath = [] }) {
    const reference = useContext(ApiReferenceContext)!;
    const [isExpanded, toggleExpanded] = useToggle();

    const interfaceRef = getMemberAdditionalDetails(reference, member);

    return (
        <>
            <ApiReferenceRow
                member={member}
                parentId={parentId}
                prefixPath={prefixPath}
                isExpanded={isExpanded}
                toggleExpanded={toggleExpanded}
            />
            {isExpanded &&
                interfaceRef?.members?.map((childMember) => (
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

function ApiReferenceRow({ member, parentId, prefixPath, isExpanded, toggleExpanded }) {
    return (
        <tr>
            <td role="presentation" className={styles.leftColumn}>
                <MemberName member={member} parentId={parentId} prefixPath={prefixPath} />
                <MemberType member={member} />
            </td>
            <td className={styles.rightColumn}>
                <MemberDescription member={member} />
                <MemberActions member={member} isExpanded={isExpanded} toggleExpanded={toggleExpanded} />
            </td>
        </tr>
    );
}

function MemberName({
    member,
    parentId,
    prefixPath,
}: {
    member: { name: string; optional: boolean };
    parentId: string;
    prefixPath: string[];
}) {
    const anchorId = `reference-${parentId}-${member.name}`;
    return (
        <h6 id={anchorId} className={classnames(styles.name, 'side-menu-exclude')}>
            {prefixPath?.length > 0 && (
                <PropertyName className={styles.parentProperties}>{`${prefixPath.join('.')}.`}</PropertyName>
            )}
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
            {member.defaultValue && (
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Default</span>
                    <span className={styles.metaValue}>{member.defaultValue}</span>
                </div>
            )}
        </div>
    );
}

function MemberDescription({ member }: { member: { type: string | object; docs?: string[] } }) {
    return (
        <div role="presentation" className={styles.description}>
            <Markdown>{member.docs?.join('\n')}</Markdown>
        </div>
    );
}

function MemberActions({ member, isExpanded, toggleExpanded }: { member: { type: string | object; docs?: string[] } }) {
    const reference = useContext(ApiReferenceContext);

    if (reference === null) {
        return null;
    }

    const additionalDetails = getMemberAdditionalDetails(reference, member);

    return (
        <div className={styles.actions}>
            {additionalDetails && <ToggleDetails isOpen={isExpanded} onToggle={toggleExpanded} />}
            {additionalDetails && !additionalDetails.members && isExpanded && (
                <TypeAdditionalDetails interfaceRef={additionalDetails} />
            )}
        </div>
    );
}

function TypeAdditionalDetails({ interfaceRef }) {
    const reference = useContext(ApiReferenceContext);
    const codeSample = formatTypeCode(interfaceRef, reference);

    if (!codeSample) {
        console.warn('Unknown interface', interfaceRef);
        return null;
    }
    return <Code code={codeSample} keepMarkup />;
}

function formatTypeCode(interfaceRef, reference) {
    if (interfaceRef.kind === 'interface') {
        return `interface ${interfaceRef.name} {\n    ${interfaceRef.members
            .map((member) => `${member.name}: ${normalizeType(member.type)};`)
            .join('\n    ')}\n}`;
    }
    if (interfaceRef.type.kind === 'union') {
        const codeSample = `type ${interfaceRef.name} = ${interfaceRef.type.type.map(normalizeType).join(' | ')};`;
        return codeSample;
    }
    if (interfaceRef.type.kind === 'function') {
        const additionalTypes = interfaceRef.type.params
            .map((param) => param.type)
            .concat(interfaceRef.type.returnType)
            .flatMap(function mapAdditionalType(type) {
                if (typeof type === 'string') {
                    return reference.get(type);
                }
                if (type.kind === 'typeRef') {
                    return reference.get(type.type);
                }
                if (type.kind === 'union') {
                    return type.type.map(mapAdditionalType);
                }
                console.warn('Unknown type', type);
            })
            .filter(Boolean);
        const codeSample = `function ${interfaceRef.name}(${interfaceRef.type.params
            .map((param) => `${param.name}: ${normalizeType(param.type)}`)
            .join(', ')}): ${normalizeType(interfaceRef.type.returnType)};`;
        console.log(additionalTypes);
        return additionalTypes
            ? [codeSample].concat(additionalTypes.map((type) => formatTypeCode(type, reference))).join('\n\n')
            : codeSample;
    }
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
        case 'intersection':
            return refType.type.map((subType) => normalizeType(subType)).join(' & ');
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
    if (memberType === 'function') {
        return member;
    }
    if (reference?.has(memberType) && !hiddenInterfaces.includes(memberType)) {
        return reference.get(memberType);
    }
}

function processMembers(
    members,
    {
        displayFirst,
        include,
        exclude,
    }: { displayFirst?: string[]; include?: string[]; exclude?: string[]; noHeader?: boolean }
) {
    if (include?.length || exclude?.length) {
        members = members.filter(
            (member) => !exclude?.includes(member.name) && (include?.includes(member.name) ?? true)
        );
    }
    if (displayFirst) {
        return members.sort((a, b) => (displayFirst.includes(a.name) ? -1 : displayFirst.includes(b.name) ? 1 : 0));
    }
    return members;
}
