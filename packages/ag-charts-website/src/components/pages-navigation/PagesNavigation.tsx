import classnames from "classnames";
import styles from "./PagesNavigation.module.scss";

export function PagesNavigation({
    pages,
    framework,
}: {
    pages: any;
    framework: string;
}) {
    const urlPrefix = `/${framework}`;

    return (
        <aside className={styles.nav}>
            <ul className={classnames("list-style-none", styles.navInner)}>
                {pages.map(({ slug, data }: any) => {
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
