import classnames from 'classnames';
import type { JSX, ReactElement, ReactNode } from 'react';

import styles from './JsObjectView.module.scss';
import { SearchBox } from './SearchBox';

const BASE_INDENT = 16;
const NEST_INDENT = 24;

export function OptionsNavigation({ breadcrumbs }: { breadcrumbs: string[] }) {
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
                    {breadcrumbs.length > 0 && (
                        <NavBreadcrumb breadcrumbs={breadcrumbs}>
                            <span>Testing</span>
                        </NavBreadcrumb>
                    )}
                </code>
            </pre>
        </div>
    );
}

function NavRow({ depth = 0, children }: { depth?: number; children: ReactNode }) {
    return (
        <div role="presentation" style={{ paddingLeft: depth * NEST_INDENT + BASE_INDENT }}>
            {children}
        </div>
    );
}

function NavBreadcrumb({
    depth = 0,
    breadcrumbs,
    children,
}: {
    depth?: number;
    breadcrumbs?: string[];
    children: JSX.Element;
}) {
    breadcrumbs = breadcrumbs?.slice();

    return breadcrumbs?.length ? (
        <>
            <NavRow depth={depth}>
                <span className={classnames(styles.topBreadcrumb, styles.highlight)}>{breadcrumbs.shift()}</span>
                {`: {`}
            </NavRow>
            {breadcrumbs.length > 0 ? (
                <>
                    <NavRow depth={depth + 1}>...</NavRow>
                    <NavBreadcrumb depth={depth + 1} breadcrumbs={breadcrumbs}>
                        {children}
                    </NavBreadcrumb>
                </>
            ) : (
                children
            )}
            <NavRow depth={depth}>{`}`}</NavRow>
        </>
    ) : (
        children
    );
}
