import type { FunctionComponent } from 'react';
import { getExampleImageUrl, getPageUrl } from '../utils/urlPaths';
import styles from './DemoExampleLink.module.scss';

interface Props {
    label: string;
    exampleName: string;
}

export const DemoExampleLink: FunctionComponent<Props> = ({ label, exampleName }) => {
    const imageUrl = getExampleImageUrl({
        exampleName,
    });

    return (
        <a className={styles.link} href={getPageUrl(exampleName)}>
            <img src={imageUrl} alt={label} />
            <span>{label}</span>
        </a>
    );
};
