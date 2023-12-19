import { SITE_BASE_URL } from '@constants';
import gridStyles from '@design-system/modules/SiteHeader.module.scss';
import LogoType from '@images/inline-svgs/ag-charts-logotype.svg?react';
import type { FunctionComponent } from 'react';
import { useState } from 'react';

import LogoMark from '../logo/LogoMark';

export const SiteLogo: FunctionComponent = () => {
    const [isLogoHover, setIsLogoHover] = useState(false);

    return (
        <a
            href={SITE_BASE_URL}
            aria-label="Home"
            className={gridStyles.headerLogo}
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
