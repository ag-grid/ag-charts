import type { Framework } from '@ag-grid-types';
import fwLogos from '@ag-website-shared/images/fw-logos';
import { FRAMEWORKS } from '@constants';
import { urlWithPrefix } from '@utils/urlWithPrefix';

import type { CustomCellRendererProps } from 'ag-grid-react';

import styles from '../DocsExamples.module.scss';

function FrameworkLink({ framework, link }: { framework: Framework; link: string }) {
    return (
        <a href={link} target="_blank">
            <img src={fwLogos[framework]} alt={framework} className={styles.frameworkLogo} />
        </a>
    );
}

export function ExampleNameCellRenderer(props: CustomCellRendererProps) {
    const { value, data, node } = props;
    const isPage = node.group;
    const pageName = isPage ? value : data.pageName;
    const exampleName = data?.exampleName;

    return (
        <div className={styles.exampleNameContainer}>
            <span>{value}</span>
            <span className={styles.frameworkLinks}>
                {FRAMEWORKS.map((framework: Framework) => {
                    const url = isPage ? `./${pageName}` : `./${pageName}#example-${exampleName}`;
                    const link = urlWithPrefix({
                        framework,
                        url,
                    });
                    return <FrameworkLink key={framework} framework={framework} link={link} />;
                })}
            </span>
        </div>
    );
}
