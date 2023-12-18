import { GRID_URL } from '@constants';
import styles from '@design-system/modules/license-pricing.module.scss';
import { useDarkmode } from '@utils/hooks/useDarkmode';
import classnames from 'classnames';
import React from 'react';

const IS_SSR = typeof window === 'undefined';

export const LicensePricing = () => {
    const [darkMode] = useDarkmode();

    return (
        <>
            {!IS_SSR && (
                <div className={classnames(styles.container)}>
                    <iframe
                        style={{ height: '100%', width: '100%' }}
                        frameBorder="0"
                        scrolling="no"
                        src={`${GRID_URL}/license-pricing-bare?darkMode=${darkMode}`}
                    ></iframe>
                </div>
            )}
        </>
    );
};
