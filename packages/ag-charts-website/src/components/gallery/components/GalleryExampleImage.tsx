import { useDarkmode } from '@utils/hooks/useDarkmode';
import classNames from 'classnames';
import { type FunctionComponent, useEffect, useState } from 'react';

import { type BaseThemeName, useTheme } from '../../../utils/hooks/useTheme';
import { getExampleImageUrl } from '../utils/urlPaths';
import styles from './GalleryExampleImage.module.scss';

interface Props {
    label: string;
    exampleName: string;
    className?: string;
    themeName?: BaseThemeName;
    enableDprScaling: boolean;
}

const optimizeAltTextForSeo = (label: string): string => {
    if (label.toLowerCase().endsWith('chart')) {
        return label;
    }

    if (label.toLowerCase().includes('with')) {
        return label.replace(/with/i, 'Chart with');
    }

    return `${label} Chart`;
};

export const GalleryExampleImage: FunctionComponent<Props> = ({ label, exampleName, className, enableDprScaling }) => {
    const [theme] = useTheme();
    const [darkMode] = useDarkmode();
    const [src, setSrc] = useState<string>('');
    const [srcSet, setSrcSet] = useState<string>('');

    const urlFor = (variant: 'light' | 'dark', dpi: 1 | 2, ext: 'png' | 'webp') => {
        const url = getExampleImageUrl({ exampleName, theme: variant === 'dark' ? `${theme}-dark` : theme, dpi, ext });
        return url;
    };

    useEffect(() => {
        const dprFor2x = enableDprScaling ? 2 : 1;

        const srcSetLight = `
            ${urlFor('light', 1, 'webp')} 1x, 
            ${urlFor('light', dprFor2x, 'webp')} 2x,
        `;

        const srcSetDark = `
            ${urlFor('dark', 1, 'webp')} 1x, 
            ${urlFor('dark', dprFor2x, 'webp')} 2x,
        `;

        setSrc(urlFor('light', 1, 'png'));
        setSrcSet(darkMode ? srcSetDark : srcSetLight);
    }, [darkMode, theme]);

    return (
        <div className={styles.imageWrapper}>
            {srcSet && (
                <img
                    src={src}
                    srcSet={srcSet}
                    alt={optimizeAltTextForSeo(label)}
                    className={classNames(styles.image, className)}
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                />
            )}
        </div>
    );
};
