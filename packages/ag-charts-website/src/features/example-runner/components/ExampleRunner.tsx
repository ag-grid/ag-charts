import type { InternalFramework } from '@ag-grid-types';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import { OpenInCTA } from '@ag-website-shared/components/open-in-cta/OpenInCTA';
import type { ExampleType, FileContents } from '@features/example-generator/types';
import classnames from 'classnames';
import { type FunctionComponent, type ReactElement, useState } from 'react';

import { CodeViewer } from './CodeViewer';
import { ExampleIFrame } from './ExampleIFrame';
import styles from './ExampleRunner.module.scss';
// Charts specific example runner styles
import chartsStyles from './LegacyExampleRunner.module.scss';

interface Props {
    id: string;
    title: string;
    exampleUrl?: string;
    exampleRunnerExampleUrl?: string;
    exampleType?: ExampleType;
    hideCode?: boolean;
    initialShowCode?: boolean;
    externalLinks?: ReactElement;
    hideExternalLinks?: boolean;
    exampleHeight?: number;
    exampleWidth?: number;
    exampleFiles?: FileContents;
    initialSelectedFile?: string;
    internalFramework: InternalFramework;
    hideInternalFrameworkSelection?: boolean;
    loadingIFrameId: string;
    footerChildren?: ReactElement;
}

const DEFAULT_HEIGHT = 500;

export const ExampleRunner: FunctionComponent<Props> = ({
    id,
    title,
    exampleUrl,
    exampleRunnerExampleUrl,
    exampleType,
    hideCode,
    initialShowCode,
    externalLinks,
    hideExternalLinks,
    exampleHeight = DEFAULT_HEIGHT,
    exampleFiles,
    initialSelectedFile,
    internalFramework,
    hideInternalFrameworkSelection,
    loadingIFrameId,
    footerChildren,
}) => {
    const [showCode, setShowCode] = useState(initialShowCode);

    return (
        <div id={id} className={styles.exampleOuter}>
            <div className={styles.tabsContainer}>
                <div
                    className={classnames(chartsStyles.content, styles.content)}
                    role="tabpanel"
                    aria-labelledby={`${showCode ? 'Preview' : 'Code'} tab`}
                    style={{ height: exampleHeight }}
                >
                    <ExampleIFrame
                        title={title}
                        isHidden={showCode}
                        url={exampleRunnerExampleUrl!}
                        loadingIFrameId={loadingIFrameId}
                    />
                    {exampleFiles && !hideCode && (
                        <CodeViewer
                            id={id}
                            isActive={showCode}
                            files={exampleFiles}
                            initialSelectedFile={initialSelectedFile!}
                            exampleType={exampleType!}
                            internalFramework={internalFramework}
                            hideInternalFrameworkSelection={hideInternalFrameworkSelection}
                        />
                    )}
                </div>
                <footer className={styles.footer}>
                    {!hideCode && (
                        <button
                            className={classnames(styles.previewCodeToggle, 'button-secondary')}
                            onClick={(e) => {
                                setShowCode(!showCode);
                            }}
                        >
                            {showCode && (
                                <span>
                                    <Icon name="eye" /> Preview
                                </span>
                            )}
                            {!showCode && (
                                <span>
                                    <Icon name="code" /> Code
                                </span>
                            )}
                        </button>
                    )}

                    {!hideExternalLinks && (
                        <ul className={classnames('list-style-none', styles.externalLinks)}>
                            <li>
                                <OpenInCTA type="newTab" href={exampleUrl!} />
                            </li>
                            {externalLinks}
                        </ul>
                    )}

                    {footerChildren}
                </footer>
            </div>
        </div>
    );
};
