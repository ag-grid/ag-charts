import type { Framework } from '@ag-grid-types';
import { VersionsSelector } from '@ag-website-shared/components/dev-tools/VersionsSelector';
import { Select } from '@ag-website-shared/components/select/Select';
import fwLogos from '@ag-website-shared/images/fw-logos';
import { getPageNameFromPath } from '@components/docs/utils/urlPaths';
import { FRAMEWORKS, URL_CONFIG } from '@constants';
import { getIsArchive } from '@utils/env';
import { getFrameworkDisplayText } from '@utils/framework';
import { useStoreSsr } from '@utils/hooks/useStoreSsr';
import { pathJoin } from '@utils/pathJoin';
import { urlWithPrefix } from '@utils/urlWithPrefix';
import classNames from 'classnames';
import purify from 'dompurify';
import { type FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';

import styles from './ExampleDevToolbar.module.scss';
import { $openLinksInNewTab } from './stores/devToolsStore';

interface Props {
    framework: Framework;
    exampleName: string;
}

type UrlConfigValue = (typeof URL_CONFIG)[string];

function EnvLink({
    env,
    config,
    framework,
    exampleName,
}: {
    env: string;
    config: { hosts: string[]; baseUrl?: string };
    framework: Framework;
    exampleName: string;
}) {
    const openLinksInNewTab = useStoreSsr($openLinksInNewTab, false);
    const [isEnv, setIsEnv] = useState(false);
    const [url, setUrl] = useState('');
    const target = openLinksInNewTab ? '_blank' : '_self';

    const siteHostBaseUrl = config.baseUrl ? pathJoin(config.hosts[0], config.baseUrl) : config.hosts[0];

    useEffect(() => {
        setIsEnv(config.hosts.includes(window.location.host) && !getIsArchive());

        const pageName = getPageNameFromPath(window.location.pathname);
        const url = pathJoin(
            `https://${siteHostBaseUrl}`,
            urlWithPrefix({
                framework,
                url: `./${pageName}`,
                siteBaseUrl: '/', // Gets added by `siteHostBaseUrl`
            }),
            `#example-${exampleName}`
        );
        setUrl(url);
    }, []);

    return (
        <li key={env} className={classNames(styles.exampleLink)}>
            {isEnv ? (
                <>{env}</>
            ) : (
                <a href={url && purify.sanitize(url)} target={target}>
                    {env}{' '}
                </a>
            )}
        </li>
    );
}

export const ExampleDevToolbar: FunctionComponent<Props> = ({ framework, exampleName }) => {
    const openLinksInNewTab = useStoreSsr($openLinksInNewTab, false);
    const frameworkOptions = useMemo(() => {
        return FRAMEWORKS.map((fw) => ({
            label: getFrameworkDisplayText(fw),
            value: fw,
        }));
    }, []);
    const frameworkOption = useMemo(
        () => frameworkOptions.find((o: { value: string }) => o.value === framework) || frameworkOptions[0],
        [frameworkOptions, framework]
    );
    const handleFrameworkChange = useCallback(
        (selectedFramework: Framework) => {
            const target = openLinksInNewTab ? '_blank' : '_self';
            const pageName = getPageNameFromPath(window.location.pathname);
            const newUrl = pathJoin(
                window.location.origin,
                urlWithPrefix({
                    framework: selectedFramework,
                    url: `./${pageName}`,
                }),
                `#example-${exampleName}`
            );

            window.open(newUrl, target);
        },
        [framework, exampleName, openLinksInNewTab]
    );

    return (
        <div className={styles.exampleLinksContainer}>
            <ul className={`list-style-none ${styles.exampleLinks}`}>
                {Object.entries(URL_CONFIG).map(([env, config]: [string, UrlConfigValue]) => {
                    return (
                        <EnvLink key={env} env={env} config={config} framework={framework} exampleName={exampleName} />
                    );
                })}
                <VersionsSelector framework={framework} exampleName={exampleName} />
                <Select
                    isPopper
                    options={frameworkOptions}
                    value={frameworkOption}
                    onChange={(newValue) => handleFrameworkChange(newValue.value as Framework)}
                    renderItem={(o) => {
                        return (
                            <span className={styles.frameworkItem}>
                                <img src={fwLogos[o.value]} alt={`${o.value} logo`} className={styles.frameworkLogo} />
                                {o.label}
                            </span>
                        );
                    }}
                />
            </ul>
        </div>
    );
};
