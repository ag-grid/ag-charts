import { SITE_BASE_URL } from '@constants';
import { ReactComponent as LogoType } from '@images/inline-svgs/ag-charts-logotype.svg';
import type { FunctionComponent } from 'react';
import { useState } from 'react';

import LogoMark from '../logo/LogoMark';
import styles from './SiteHeader.module.scss';

export const SiteLogo: FunctionComponent = () => {
    const [isLogoHover, setIsLogoHover] = useState(false);

    return (
        <a
            href={SITE_BASE_URL}
            aria-label="Home"
            className={styles.headerLogo}
            onMouseEnter={() => {
                setIsLogoHover(true);
            }}
            onMouseLeave={() => {
                setIsLogoHover(false);
            }}
        >
            <LogoType />
            <LogoMark bounce={isLogoHover} />
        </a>
    );
};
