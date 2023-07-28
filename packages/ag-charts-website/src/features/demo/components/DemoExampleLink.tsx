import type { FunctionComponent } from 'react';
import { getExampleUrl, getPageUrl } from '../utils/urlPaths';
import { ExampleIFrame } from '../../example-runner/components/ExampleIFrame';
import styles from './DemoExampleLink.module.scss';

interface Props {
    label: string;
    exampleName: string;
}

export const DemoExampleLink: FunctionComponent<Props> = ({ label, exampleName }) => {
    const exampleUrl = getExampleUrl({
        exampleName,
    });

    return (
        <a className={styles.link} href={getPageUrl(exampleName)}>
            <ExampleIFrame url={exampleUrl} />
            <span>{label}</span>
        </a>
    );
};
