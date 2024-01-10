import styles from '@design-system/modules/GalleryExampleImage.module.scss';
import classNames from 'classnames';
import { type FunctionComponent, useEffect, useState } from 'react';

import { type BaseThemeName, useTheme } from '../../../utils/hooks/useTheme';
import { getExampleImageUrl } from '../utils/urlPaths';

interface Props {
    label: string;
    exampleName: string;
    className?: string;
    themeName?: BaseThemeName;
}

export const GalleryExampleImage: FunctionComponent<Props> = ({ label, exampleName, className }) => {
    const [theme] = useTheme();
    const [style, setStyle] = useState<Record<string, string>>();

    const urlFor = (dpi: 1 | 2, ext: 'png' | 'webp') => {
        const url = getExampleImageUrl({ exampleName, theme, dpi, ext });
        return `url(${JSON.stringify(url)})`;
    };

    useEffect(() => {
        setStyle({
            '--image-webp': urlFor(1, 'webp'),
            '--image-webp-2x': urlFor(2, 'webp'),
            '--image-png': urlFor(1, 'png'),
            '--image-png-2x': urlFor(2, 'png'),
            '--image-webp-dark': urlFor(1, 'webp'),
            '--image-webp-dark-2x': urlFor(2, 'webp'),
            '--image-png-dark': urlFor(1, 'png'),
            '--image-png-dark-2x': urlFor(2, 'png'),
        });
    }, [theme]);

    return <div className={classNames(styles.image, className)} aria-label={label} style={style} />;
};
