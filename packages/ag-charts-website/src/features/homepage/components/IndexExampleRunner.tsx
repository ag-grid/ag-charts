import type { InternalFramework } from '@ag-grid-types';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import { OpenInCTA } from '@ag-website-shared/components/open-in-cta/OpenInCTA';
import type { ExampleType, FileContents } from '@features/example-generator/types';
import classnames from 'classnames';
import { type FunctionComponent, type ReactElement, useState } from 'react';

import { CodeViewer } from './IndexCodeViewer';
import { ExampleIFrame } from './IndexExampleIFrame';
import styles from './IndexExampleRunner.module.scss';
// Charts specific example runner styles
import chartsStyles from './IndexLegacyExampleRunner.module.scss';

interface Props {
    id: string;
    title: string;
    exampleUrl?: string;
    exampleRunnerExampleUrl?: string;
    exampleType?: ExampleType;
    initialShowCode?: boolean;
    externalLinks?: ReactElement;
    exampleHeight?: number;
    exampleWidth?: number;
    exampleFiles?: FileContents;
    initialSelectedFile?: string;
    internalFramework: InternalFramework;
    hideInternalFrameworkSelection?: boolean;
    loadingIFrameId: string;
}

const DEFAULT_HEIGHT = 500;

export const ExampleRunner: FunctionComponent<Props> = ({
    id,
    title,
    exampleUrl,
    exampleRunnerExampleUrl,
    exampleType,
    initialShowCode,
    externalLinks,
    exampleHeight = DEFAULT_HEIGHT,
    exampleFiles,
    initialSelectedFile,
    internalFramework,
    hideInternalFrameworkSelection,
    loadingIFrameId,
}) => {
    const [showCode, setShowCode] = useState(initialShowCode);

    return (
        <div id={id} className={styles.exampleOuter}>
            <div className={styles.tabsContainer}>
                <div
                    className={classnames(chartsStyles.content, styles.content)}
                    role="tabpanel"
                    style={{ height: exampleHeight, minHeight: 0 }}
                >
                    <ExampleIFrame title={title} url={exampleRunnerExampleUrl!} loadingIFrameId={loadingIFrameId} />
                </div>
            </div>
        </div>
    );
};
