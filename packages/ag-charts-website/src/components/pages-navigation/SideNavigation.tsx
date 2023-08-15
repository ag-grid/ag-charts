import type { FunctionComponent } from 'react';
import classnames from 'classnames';
import styles from './SideNavigation.module.scss';
import type { MarkdownHeading } from 'astro';
import { addNonBreakingSpaceBetweenLastWords } from '@utils/addNonBreakingSpaceBetweenLastWords';
import { smoothScrollIntoView } from '@utils/smoothScrollIntoView';

interface Props {
    title: string;
    headings: MarkdownHeading[];
}

export const SideNavigation: FunctionComponent<Props> = ({ title, headings }) => {
    return (
        <nav id="side-menu" className={classnames(styles.sideNav, 'font-size-responsive')}>
            <div>
                {headings.length > 0 && (
                    <ul className="list-style-none">
                        <li className={styles.level1}>
                            <a
                                href="#top"
                                className={classnames(styles.topLink, 'nav-link')}
                                onClick={(e) => {
                                    e.preventDefault();
                                    smoothScrollIntoView('#top');
                                }}
                            >
                                {title}
                            </a>
                        </li>

                        {headings.map((heading) => {
                            const href = `#${heading.slug}`;
                            return (
                                <li key={`${title}_${heading.slug}`} className={styles[`level${heading.depth}`]}>
                                    <a
                                        className="nav-link"
                                        href={href}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            smoothScrollIntoView(href);
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
