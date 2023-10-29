import { Icon } from '@components/icon/Icon';
import { useToggle } from '@utils/hooks/useToggle';
import classnames from 'classnames';
import type { AllHTMLAttributes, CSSProperties, MouseEventHandler, ReactNode } from 'react';
import { Fragment, useContext } from 'react';

import type { MemberNode } from '../api-reference-types';
import { getMemberType } from '../utils/apiReferenceHelpers';
import { ApiReferenceContext } from './ApiReference';
import styles from './OptionsNavigation.module.scss';
import { SearchBox } from './SearchBox';

export function OptionsNavigation({ breadcrumbs, rootInterface }: { breadcrumbs: string[]; rootInterface: string }) {
    const reference = useContext(ApiReferenceContext);
    const interfaceRef = reference?.get(rootInterface);

    return (
        <div className={styles.expandableSnippet} role="presentation">
            <header>
                <h3>Options Reference</h3>
                <p className="text-secondary font-size-small">
                    A comprehensive interactive explorer for the <b>AgChartOptions</b> structure.
                </p>
                <SearchBox searchData={[]} />
            </header>

            <pre className={classnames('code', styles.navContainer)}>
                <code className="language-ts">
                    <NavBreadcrumb breadcrumbs={breadcrumbs}>
                        {interfaceRef?.kind === 'interface' && (
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
    // const isInterfaceArray =
    //     typeof member.type === 'object' &&
    //     member.type.kind === 'array' &&
    //     interfaceRef?.kind === 'typeAlias' &&
    //     typeof interfaceRef.type === 'object' &&
    //     interfaceRef.type.kind === 'union';
    const isInterfaceArray = false;
    // const expandable = isInterface || (isInterfaceArray && interfaceRef);
    const expandable = isInterface;

    // if (isInterfaceArray) {
    //     console.log(
    //         memberType,
    //         interfaceRef,
    //         interfaceRef?.kind === 'typeAlias' &&
    //             typeof interfaceRef.type === 'object' &&
    //             interfaceRef.type.kind === 'union'
    //     );
    // }

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
                    {expandable && (
                        <Icon
                            name="chevronRight"
                            svgClasses={classnames(styles.propertyExpander, isExpanded && styles.active)}
                            onClick={toggleExpanded}
                        />
                    )}
                    <span onClick={onClick}>{member.name}</span>
                    {expandable && (
                        <span className={styles.punctuation} onClick={!isExpanded ? toggleExpanded : undefined}>
                            {isExpanded ? ' {' : isInterfaceArray ? ' [ ... ]' : ' { ... }'}
                        </span>
                    )}
                </span>
            </div>
            {expandable && isExpanded && (
                <>
                    <NavGroup depth={depth + 1}>
                        {interfaceRef.members.map((member) => (
                            <NavProperty key={member.name} member={member} depth={depth + 1} />
                        ))}
                    </NavGroup>
                    <div
                        className={classnames(styles.punctuation, styles.navItem, depth > 1 && styles.propertyWhisker)}
                    >
                        {'}'}
                    </div>
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
                            {index > 0 && (
                                <Icon
                                    name="chevronRight"
                                    svgClasses={classnames(styles.propertyExpander, styles.active)}
                                />
                            )}
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
