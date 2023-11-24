import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';

import styles from './Version.module.scss';

const parseVersion = (version: string) => {
    const [major, minor, patch] = version.split('.').map(Number);
    return { major, minor, patch, isMajor: !minor };
};

type VersionProps = {
    date: string;
    version: string;
    blogUrl?: string;
    highlights?: Array<{ text: string; url: string }>;
};

export const Version = ({ date, version, blogUrl, highlights }: VersionProps) => {
    const { major, minor, isMajor } = parseVersion(version);
    const blogHref = blogUrl || `https://blog.ag-grid.com/whats-new-in-ag-grid-${minor ? `${major}-${minor}` : major}/`;

    return (
        <div className={styles.version}>
            <div className={styles.topheader}>
                <header>
                    <span className={`${styles['text-secondary']} ${styles['font-size-small']}`}>{date}</span>
                    <div className={styles.flex}>
                        <b className={styles['font-size-large']}>Version {version}</b>
                        <a className={styles.bloglink} href={blogHref}>
                            What's new →
                        </a>
                    </div>
                    <span class={styles.line}></span>
                </header>

                <p className={styles['font-size-small']}>
                    {isMajor ? 'Major' : 'Minor'} release with new features and bug fixes.
                </p>

                {highlights && highlights.length > 0 && (
                    <ul className={styles['list-style-none']}>
                        {highlights.map((highlight, i) => (
                            <li key={highlight.text + i}>
                                <a href={highlight.url}>{highlight.text}</a>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <a
                className={`${styles.changelog} button-secondary`}
                href={urlWithBaseUrl(`/changelog/?fixVersion=${version}`)}
                target="_blank"
                rel="noopener noreferrer"
            >
                See all changes
            </a>
        </div>
    );
};
