import { useScrollSpy } from '@components/pages-navigation/useScrollSpy';
import { addNonBreakingSpaceBetweenLastWords } from '@utils/addNonBreakingSpaceBetweenLastWords';
import { navigate, scrollIntoViewById } from '@utils/navigation';
import type { MarkdownHeading } from 'astro';
import classnames from 'classnames';

import styles from './SideNavigation.module.scss';

interface Props {
    headings: MarkdownHeading[];
}

export function SideNavigation({ headings }: Props) {
    const menuRef = useScrollSpy({ headings });

    if (headings.length < 2) {
        return null;
    }

    return (
        <nav ref={menuRef} className={classnames(styles.sideNav, 'font-size-responsive')}>
            <div>
                <ul>
                    {headings.map(({ slug, depth, text }) => (
                        <li key={slug} className={styles[`level${depth}`]}>
                            <a
                                href={`#${slug}`}
                                className="nav-link"
                                onClick={(event) => {
                                    event.preventDefault();
                                    scrollIntoViewById(slug);
                                    navigate({ hash: slug });
                                }}
                            >
                                {addNonBreakingSpaceBetweenLastWords(text)}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}
