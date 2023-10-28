import { Icon } from '@components/icon/Icon';
import { useToggle } from '@utils/hooks/useToggle';
import classnames from 'classnames';
import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';
import { Fragment, useContext } from 'react';

import type { MemberNode } from '../api-reference-types';
import { getMemberType } from '../utils/apiReferenceHelpers';
import { ApiReferenceContext } from './ApiReference';
import styles from './JsObjectView.module.scss';
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
                <SearchBox />
            </header>

            <pre className={classnames('code', 'language-ts', styles.navContainer)}>
                <code className="language-ts">
                    <NavBreadcrumb breadcrumbs={breadcrumbs}>
                        {interfaceRef?.kind === 'interface' &&
                            interfaceRef.members.map((member) => (
                                <NavProperty key={member.name} member={member} depth={breadcrumbs?.length ?? 0} />
                            ))}
                    </NavBreadcrumb>
                </code>
            </pre>
        </div>
    );
}

function NavGroup({ depth = 0, children }: { depth?: number; children: ReactNode }) {
    return (
        <div className={styles.navGroup} style={{ '--options-nav-depth': depth } as CSSProperties}>
            {children}
        </div>
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
    const expandable = interfaceRef?.kind === 'interface';

    if (interfaceRef?.kind === 'typeAlias' && typeof interfaceRef.type === 'object') {
        console.log(memberType, interfaceRef);
    }

    return (
        <Fragment>
            <NavGroup depth={depth}>
                <div onDoubleClick={toggleExpanded}>
                    <span className={styles.propertyName}>
                        {expandable && (
                            <Icon
                                name="chevronRight"
                                svgClasses={classnames(styles.expander, isExpanded && styles.active)}
                                onClick={toggleExpanded}
                            />
                        )}
                        <span onClick={onClick}>{member.name}</span>
                        {expandable && (
                            <span className={styles.punctuation} onClick={!isExpanded ? toggleExpanded : undefined}>
                                {isExpanded ? ' {' : ' { ... }'}
                            </span>
                        )}
                    </span>
                </div>
            </NavGroup>
            {expandable && isExpanded && (
                <>
                    {interfaceRef.members.map((member) => (
                        <NavProperty key={member.name} member={member} depth={depth + 1} />
                    ))}
                    <NavGroup depth={depth}>
                        <div className={styles.punctuation}>{'}'}</div>
                    </NavGroup>
                </>
            )}
        </Fragment>
    );
}

function NavBreadcrumb({ breadcrumbs, children }: { depth?: number; breadcrumbs?: string[]; children: ReactNode }) {
    return (
        <>
            {breadcrumbs?.map((breadcrumb, index) => (
                <NavGroup key={index} depth={index}>
                    {index > 0 && <div>...</div>}
                    <div className={styles.highlight}>
                        <span className={classnames(styles.topBreadcrumb)}>{breadcrumb}</span>
                        {': {'}
                    </div>
                </NavGroup>
            ))}
            {children}
            {breadcrumbs?.map((_, index) => (
                <NavGroup key={index} depth={breadcrumbs.length - index - 1}>
                    <div>{'}'}</div>
                </NavGroup>
            ))}
        </>
    );
}
