import { useStore } from '@nanostores/react';
import { $theme } from '@stores/themeStore';
import classnames from 'classnames';
import { type FunctionComponent, useEffect, useState } from 'react';

import { getPageUrl, getPlainExampleImageUrl } from '../utils/urlPaths';
import styles from './GalleryExampleLink.module.scss';

interface Props {
    label: string;
    exampleName: string;
    className?: string;
}

export const GalleryExampleLink: FunctionComponent<Props> = ({ label, exampleName, className }) => {
    const theme = useStore($theme);
    const [imageUrl, setImageUrl] = useState<string>();
    const [isDarkTheme, setIsDarkTheme] = useState<boolean>();

    useEffect(() => {
        setImageUrl(
            getPlainExampleImageUrl({
                exampleName,
                theme,
            })
        );
        setIsDarkTheme(theme.indexOf('dark') > -1);
    }, [theme]);

    const darkLinkStyle = {
        backgroundColor: '#15181c',
        borderTop: '1px solid rgb(88, 88, 88)',
    };
    const darkSpanStyle = {
        color: 'rgb(200, 200, 200)',
    };

    const linkStyle = isDarkTheme ? darkLinkStyle : {};
    const spanStyle = isDarkTheme ? darkSpanStyle : {};

    return (
        <a
            className={classnames(styles.link, className, 'font-size-responsive', 'font-size-small', 'text-secondary')}
            href={getPageUrl(exampleName)}
            style={linkStyle}
        >
            <img src={imageUrl} alt={label} />
            <span style={spanStyle}>{label}</span>
        </a>
    );
};
