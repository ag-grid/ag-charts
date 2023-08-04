import classnames from 'classnames';
import styles from './PagesNavigation.module.scss';
import type { DocsPage } from '@utils/pages';
import { SITE_BASE_URL } from '@constants';

export function PagesNavigation({ pages, framework }: { pages: DocsPage[]; framework: string }) {
    const urlPrefix = `${SITE_BASE_URL}${framework}`;

    // TODO: Do something better than just alpha sorting - but this should improve productivity
    // in the meantime.
    const sortedPages = [...pages];
    sortedPages.sort((a, b) => a.data.title.localeCompare(b.data.title));

    return (
        <aside className={styles.nav}>
            <ul className={classnames('list-style-none', styles.navInner)}>
                {sortedPages.map(({ slug, data }: any) => {
                    const url = `${urlPrefix}/${slug}`;
                    return (
                        <li key={url} className={styles.navGroup}>
                            <a href={url}>{data.title}</a>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
}
