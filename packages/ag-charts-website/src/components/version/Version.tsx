import styles from '@design-system/modules/Version.module.scss';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';

const parseVersion = (version: string) => {
    const [major, minor, patch] = version.split('.').map(Number);
    return { major, minor, patch, isMajor: !minor };
};

type VersionProps = {
    date: string;
    version: string;
    blogUrl?: string;
    highlights?: Array<{ text: string; url: string }>;
    buttonURL?: string;
    majorMinor?: boolean;
};

export const Version = ({ date, version, blogUrl, highlights, buttonURL, majorMinor }: VersionProps) => {
    const { major, minor, isMajor } = parseVersion(version);
    const blogHref =
        blogUrl || `https://blog.ag-grid.com/whats-new-in-ag-charts-${minor ? `${major}-${minor}` : major}/`;

    return (
        <div className={styles.version}>
            <div>
                <header className={styles.topHeader}>
                    <div className={styles.flex}>
                        <span className="text-secondary text-sm">{date}</span>

                        <div className={styles.flex}>
                            {version === '9.1.0' && <span className={styles['latest-tag']}>Latest</span>}
                            {majorMinor && <span className={styles['major-text']}>Major</span>}
                        </div>
                    </div>
                    <div className={styles.flex}>
                        <b className="text-lg">Version {version}</b>
                        <a href={blogHref}>Read more →</a>
                    </div>
                    <span className={styles.line}></span>
                </header>

                <p className={styles.featuresLabel}>Feature Highlights</p>

                {highlights && highlights.length > 0 && (
                    <ul>
                        {highlights.map((highlight, i) => (
                            <li key={highlight.text + i}>
                                <a href={highlight.url}>{highlight.text}</a>
                            </li>
                        ))}
                    </ul>
                )}

                {buttonURL && (
                    <a
                        className={`${styles.buttonSecondary} button-secondary`}
                        href={urlWithBaseUrl(buttonURL)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        See migration guide
                    </a>
                )}
            </div>

            <a
                className={`${styles.buttonSecondary} button-secondary`}
                href={urlWithBaseUrl(`/changelog/?fixVersion=${version}`)}
                target="_blank"
                rel="noopener noreferrer"
            >
                See all changes
            </a>
        </div>
    );
};
