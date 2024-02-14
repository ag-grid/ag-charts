import { GRID_URL } from '@constants';
import styles from '@design-system/modules/license-pricing.module.scss';
import { useDarkmode } from '@utils/hooks/useDarkmode';
import classnames from 'classnames';
import { useEffect, useState } from 'react';

const IS_SSR = typeof window === 'undefined';

export type LicenseTab = 'grid' | 'charts';

const getPricingPageUrl = ({ darkMode, tab }: { darkMode: boolean; tab: LicenseTab }) =>
    `${GRID_URL}/license-pricing-bare?darkMode=${darkMode}&tab=${tab}`;

export const LicensePricing = () => {
    const [darkMode] = useDarkmode();
    const [tab, setTab] = useState<LicenseTab>('charts');
    const [windowHeight, setWindowHeight] = useState('100%');
    const [pricingPageUrl, setPricingPageUrl] = useState(
        getPricingPageUrl({
            darkMode: darkMode!,
            tab,
        })
    );

    useEffect(() => {
        function receiveMessage(event: MessageEvent) {
            if (event.origin === GRID_URL) {
                const { type, tab, windowHeight } = event.data;
                if (type === 'tabChange') {
                    setTab(tab);
                    setWindowHeight(windowHeight);
                }
            }
        }
        window.addEventListener('message', receiveMessage, false);

        return () => window.removeEventListener('message', receiveMessage);
    }, []);

    // Only update URL if `darkMode` changes
    // NOTE: Not updating in `message` event, otherwise there will be an infinite loop of reloading
    useEffect(() => {
        setPricingPageUrl(
            getPricingPageUrl({
                darkMode: darkMode!,
                tab,
            })
        );
    }, [darkMode]);

    return (
        <>
            {!IS_SSR && (
                <div className={classnames(styles.chartsPricingOuter)}>
                    <iframe
                        style={{ height: windowHeight, width: '100%' }}
                        frameBorder="0"
                        scrolling="no"
                        src={pricingPageUrl}
                    ></iframe>
                </div>
            )}
        </>
    );
};
