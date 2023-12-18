import classNames from 'classnames';
import { type FunctionComponent, useEffect, useState } from 'react';

import { type BaseThemeName, useTheme } from '../../../utils/hooks/useTheme';
import { getPlainExampleImageUrl } from '../utils/urlPaths';
import styles from './GalleryExampleImage.module.scss';

interface Props {
    label: string;
    exampleName: string;
    className?: string;
    themeName?: BaseThemeName;
}

export const GalleryExampleImage: FunctionComponent<Props> = ({ label, exampleName, className }) => {
    const [theme] = useTheme();
    const [style, setStyle] = useState<Record<string, string>>();

    useEffect(() => {
        setStyle({
            '--image-webp': `url(${getPlainExampleImageUrl({ exampleName, theme, ext: 'webp' })})`,
            '--image-png': `url(${getPlainExampleImageUrl({ exampleName, theme, ext: 'png' })})`,
            '--image-webp-dark': `url(${getPlainExampleImageUrl({
                exampleName,
                theme: `${theme}-dark`,
                ext: 'webp',
            })})`,
            '--image-png-dark': `url(${getPlainExampleImageUrl({ exampleName, theme: `${theme}-dark`, ext: 'png' })})`,
        });
    }, [theme]);

    return <div className={classNames(styles.image, className)} aria-label={label} style={style} />;
};
