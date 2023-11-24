import { useTheme } from '@utils/hooks/useTheme';
import classNames from 'classnames';
import { type FunctionComponent, useEffect, useState } from 'react';

import { getPlainExampleImageUrl } from '../utils/urlPaths';
import styles from './GalleryExampleImage.module.scss';

interface Props {
    label: string;
    exampleName: string;
    className?: string;
}

export const GalleryExampleImage: FunctionComponent<Props> = ({ label, exampleName, className }) => {
    const { theme } = useTheme();

    const [webpImageUrl, setWebpImageUrl] = useState<string>();
    const [pngImageUrl, setPngImageUrl] = useState<string>();

    useEffect(() => {
        setWebpImageUrl(getPlainExampleImageUrl({ exampleName, theme, ext: 'webp' }));
        setPngImageUrl(getPlainExampleImageUrl({ exampleName, theme, ext: 'png' }));
    }, [theme]);

    return (
        <picture>
            <source srcSet={webpImageUrl} type="image/webp" />
            <img
                src={pngImageUrl}
                className={classNames(styles.image, className)}
                alt={label}
                // Set explicit width and height so the layout doesn't jump around as the page is loading
                width={600}
                height={375}
            />
        </picture>
    );
};
