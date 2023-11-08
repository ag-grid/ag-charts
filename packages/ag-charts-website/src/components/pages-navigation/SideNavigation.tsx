import { addNonBreakingSpaceBetweenLastWords } from '@utils/addNonBreakingSpaceBetweenLastWords';
import { navigate } from '@utils/navigation';
import { smoothScrollIntoView } from '@utils/smoothScrollIntoView';
import type { MarkdownHeading } from 'astro';
import classnames from 'classnames';
import type { FunctionComponent } from 'react';

import styles from './SideNavigation.module.scss';
import { useSideNavigationScrolling } from './useSideNavigationScrolling';

interface Props {
    title: string;
    pageHeadings: MarkdownHeading[];
}

export const SideNavigation: FunctionComponent<Props> = ({ title, pageHeadings }) => {
    const hasHeadings = pageHeadings.length > 0;
    const topHeading = {
        slug: 'top',
        depth: 1,
        text: title,
    };
    const headings = [topHeading].concat(pageHeadings);

    useSideNavigationScrolling({ headings });

    return (
        <nav id="side-menu" className={classnames(styles.sideNav, 'font-size-responsive')}>
            <div>
                {hasHeadings && (
                    <ul className="list-style-none">
                        {headings.map((heading) => {
                            const id = heading.slug;
                            const href = `#${id}`;
                            return (
                                <li key={`${title}_${id}`} className={styles[`level${heading.depth}`]}>
                                    <a
                                        className="nav-link"
                                        href={href}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            smoothScrollIntoView({ id });
                                            navigate(`#${id}`);
                                        }}
                                    >
                                        {addNonBreakingSpaceBetweenLastWords(heading.text)}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </nav>
    );
};
