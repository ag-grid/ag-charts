import { GRID_URL } from '@constants';
import classnames from 'classnames';
import React from 'react';

import styles from './license-pricing.module.scss';

const IS_SSR = typeof window === 'undefined';

export const LicensePricing = () => {
    return (
        <>
            {!IS_SSR && (
                <div className={classnames('page-margin', styles.container)}>
                    <iframe
                        style={{ height: '100%', width: '100%' }}
                        frameBorder="0"
                        scrolling="no"
                        src={`${GRID_URL}/license-pricing-bare/`}
                    ></iframe>
                </div>
            )}
        </>
    );
};
