import { Icon } from '@components/icon/Icon';
import { useToggle } from '@utils/hooks/useToggle';
import classnames from 'classnames';
import type { AllHTMLAttributes, CSSProperties, MouseEventHandler, ReactNode } from 'react';
import { useContext } from 'react';

import type { ApiReferenceNode, MemberNode } from '../api-reference-types';
import { extractSearchData, getMemberType } from '../utils/apiReferenceHelpers';
import { ApiReferenceContext } from './ApiReference';
import styles from './OptionsNavigation.module.scss';
import { SearchBox } from './SearchBox';

export function OptionsNavigation({ breadcrumbs, rootInterface }: { breadcrumbs: string[]; rootInterface: string }) {
    const reference = useContext(ApiReferenceContext);
    const interfaceRef = reference?.get(rootInterface);

    if (!reference || !interfaceRef) {
        return null;
    }

    return (
        <div className={styles.expandableSnippet} role="presentation">
            <header>
                <h3>Options Reference</h3>
                <p className="text-secondary font-size-small">
                    A comprehensive interactive explorer for the <b>AgChartOptions</b> structure.
                </p>
                <SearchBox searchData={extractSearchData(reference, interfaceRef)} />
            </header>

            <pre className={classnames('code', styles.navContainer)}>
                <code className="language-ts">
                    <NavBreadcrumb breadcrumbs={breadcrumbs}>
                        {interfaceRef.kind === 'interface' && (
                            <NavGroup depth={breadcrumbs?.length ?? 0}>
                                {interfaceRef.members.map((member) => (
                                    <NavProperty key={member.name} member={member} depth={breadcrumbs?.length ?? 0} />
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
    onClick,
}: {
    member: MemberNode;
    depth?: number;
    onClick?: MouseEventHandler;
}) {
    const reference = useContext(ApiReferenceContext);
    const [isExpanded, toggleExpanded] = useToggle();
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
            <div className={styles.navItem} onDoubleClick={toggleExpanded}>
                <span
                    className={classnames(
                        styles.propertyName,
                        depth > 1 && styles.propertyWhisker,
                        expandable && styles.propertyExpandable
                    )}
                >
                    {expandable && <PropertyExpander isExpanded={isExpanded} onClick={toggleExpanded} />}
                    <span onClick={onClick}>{member.name}</span>
                    {expandable && (
                        <OpeningBrackets
                            isOpen={isExpanded}
                            isArray={isInterfaceArray}
                            onClick={!isExpanded ? toggleExpanded : undefined}
                        />
                    )}
                </span>
            </div>
            {expandable && isExpanded && (
                <>
                    <NavGroup depth={depth + 1}>
                        {isInterface
                            ? interfaceRef.members.map((member) => (
                                  <NavProperty key={member.name} depth={depth + 1} member={member} />
                              ))
                            : getInterfaceArrayTypes().map((typeName) => (
                                  <NavTypedUnionProperty
                                      key={typeName}
                                      depth={depth + 1}
                                      interfaceRef={reference?.get(typeName)}
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
    interfaceRef,
    depth = 0,
    onClick,
}: {
    interfaceRef?: ApiReferenceNode;
    depth?: number;
    onClick?: MouseEventHandler;
}) {
    if (interfaceRef?.kind !== 'interface') {
        return null;
    }

    const [isExpanded, toggleExpanded] = useToggle();
    const typeMember = interfaceRef.members.find((member) => member.name === 'type');
    const interfaceTypeValue = typeof typeMember?.type === 'string' ? typeMember.type : null;

    return (
        <>
            <div className={styles.navItem} onDoubleClick={toggleExpanded}>
                <span
                    className={classnames(
                        styles.propertyName,
                        styles.propertyExpandable,
                        depth > 1 && styles.propertyWhisker
                    )}
                >
                    <PropertyExpander isExpanded={isExpanded} onClick={toggleExpanded} />
                    <span onClick={onClick}>
                        {isExpanded ? (
                            <span className={styles.punctuation}>{'{'}</span>
                        ) : (
                            <span onClick={onClick}>
                                <span className={styles.punctuation}>{'{'}</span>
                                {' type = '}
                                <span className={styles.unionDiscriminator}>{interfaceTypeValue}</span>
                                <span className={styles.punctuation} onClick={toggleExpanded}>
                                    {' ... }'}
                                </span>
                            </span>
                        )}
                    </span>
                </span>
            </div>
            {isExpanded && (
                <>
                    <NavGroup depth={depth + 1}>
                        {interfaceRef.members.map((member) => (
                            <NavProperty key={member.name} member={member} depth={depth + 1} />
                        ))}
                    </NavGroup>
                    <ClosingBrackets depth={depth} />
                </>
            )}
        </>
    );
}

function NavBreadcrumb({ breadcrumbs, children }: { depth?: number; breadcrumbs?: string[]; children: ReactNode }) {
    return (
        <>
            {breadcrumbs?.map((breadcrumb, index) => (
                <NavGroup key={index} depth={index}>
                    {index > 0 && <div className={styles.navItem}>...</div>}
                    <div className={classnames(styles.navItem, !index && styles.highlight)}>
                        <span className={classnames(styles.propertyName)}>
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
        <span className={styles.punctuation} onClick={onClick}>
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
