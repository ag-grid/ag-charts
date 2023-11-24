import { useTheme } from '@utils/hooks/useTheme';
import classNames from 'classnames';
import { type FunctionComponent } from 'react';

import { getPlainExampleImageUrl } from '../utils/urlPaths';
import styles from './GalleryExampleImage.module.scss';

interface Props {
    label: string;
    exampleName: string;
    className?: string;
}

export const GalleryExampleImage: FunctionComponent<Props> = ({ label, exampleName, className }) => {
    const { themeName: theme } = useTheme();

    const style: any = {
        '--image-webp': `url(${getPlainExampleImageUrl({ exampleName, theme, ext: 'webp' })})`,
        '--image-png': `url(${getPlainExampleImageUrl({ exampleName, theme, ext: 'png' })})`,
        '--image-webp-dark': `url(${getPlainExampleImageUrl({ exampleName, theme: `${theme}-dark`, ext: 'webp' })})`,
        '--image-png-dark': `url(${getPlainExampleImageUrl({ exampleName, theme: `${theme}-dark`, ext: 'png' })})`,
    };

    return <div className={classNames(styles.image, className)} aria-label={label} style={style} />;
};
