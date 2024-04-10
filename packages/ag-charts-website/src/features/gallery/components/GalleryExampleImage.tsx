import styles from '@legacy-design-system/modules/GalleryExampleImage.module.scss';
import classNames from 'classnames';
import { type FunctionComponent, useEffect, useState } from 'react';

import { type BaseThemeName, useTheme } from '../../../utils/hooks/useTheme';
import { getExampleImageUrl } from '../utils/urlPaths';

interface Props {
    label: string;
    exampleName: string;
    className?: string;
    themeName?: BaseThemeName;
    enableDprScaling: boolean;
}

export const GalleryExampleImage: FunctionComponent<Props> = ({ label, exampleName, className, enableDprScaling }) => {
    const [theme] = useTheme();
    const [style, setStyle] = useState<Record<string, string>>();

    const urlFor = (variant: 'light' | 'dark', dpi: 1 | 2, ext: 'png' | 'webp') => {
        const url = getExampleImageUrl({ exampleName, theme: variant === 'dark' ? `${theme}-dark` : theme, dpi, ext });
        return `url(${JSON.stringify(url)})`;
    };

    useEffect(() => {
        const dprFor2x = enableDprScaling ? 2 : 1;
        setStyle({
            '--image-webp': urlFor('light', 1, 'webp'),
            '--image-webp-2x': urlFor('light', dprFor2x, 'webp'),
            '--image-png': urlFor('light', 1, 'png'),
            '--image-png-2x': urlFor('light', dprFor2x, 'png'),
            '--image-webp-dark': urlFor('dark', 1, 'webp'),
            '--image-webp-dark-2x': urlFor('dark', dprFor2x, 'webp'),
            '--image-png-dark': urlFor('dark', 1, 'png'),
            '--image-png-dark-2x': urlFor('dark', dprFor2x, 'png'),
        });
    }, [theme]);

    return <div className={classNames(styles.image, className)} aria-label={label} style={style} />;
};
