import classNames from 'classnames';
import { type FunctionComponent, useEffect, useState } from 'react';

import { SITE_BASE_URL, SITE_URL } from '../../../constants';
import type { ThemeName } from '../../../stores/themeStore';
import { useTheme } from '../../../utils/hooks/useTheme';
import { getPlainExampleImageUrl } from '../utils/urlPaths';
import styles from './GalleryExampleImage.module.scss';

interface Props {
    label: string;
    exampleName: string;
    className?: string;
    themeName?: ThemeName;
}

const blankGif = `${SITE_URL}${SITE_BASE_URL ?? ''}images/blank.png`;

export const GalleryExampleImage: FunctionComponent<Props> = ({ label, exampleName, className, themeName }) => {
    let webpImageUrl;
    let pngImageUrl;

    if (themeName) {
        webpImageUrl = getPlainExampleImageUrl({ exampleName, theme: themeName, ext: 'webp' });
        pngImageUrl = getPlainExampleImageUrl({ exampleName, theme: themeName, ext: 'png' });
    } else {
        // Hide broken images until we can resolve the theme, but occupy space as-if the image was
        // present.
        const [webpImageUrlVal, setWebpImageUrl] = useState<string>(blankGif);
        const [pngImageUrlVal, setPngImageUrl] = useState<string>(blankGif);
        const { theme } = useTheme();

        useEffect(() => {
            setWebpImageUrl(getPlainExampleImageUrl({ exampleName, theme, ext: 'webp' }));
            setPngImageUrl(getPlainExampleImageUrl({ exampleName, theme, ext: 'png' }));
        }, [theme]);

        [webpImageUrl, pngImageUrl] = [webpImageUrlVal, pngImageUrlVal];
    }

    return (
        <picture>
            <source srcSet={webpImageUrl} type="image/webp" />
            <img
                srcSet={pngImageUrl}
                className={classNames(styles.image, className)}
                alt={label}
                // Set explicit width and height so the layout doesn't jump around as the page is loading
                width={600}
                height={375}
            />
        </picture>
    );
};
