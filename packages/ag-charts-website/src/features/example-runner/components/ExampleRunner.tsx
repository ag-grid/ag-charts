import type { InternalFramework } from '@ag-grid-types';
import { Icon } from '@components/icon/Icon';
import { OpenInCTA } from '@components/open-in-cta/OpenInCTA';
import type { ExampleType, FileContents } from '@features/examples-generator/types';
import classnames from 'classnames';
import { type FunctionComponent, type ReactElement, useState } from 'react';

// Charts specific example runner styles
import chartsStyles from './ChartsExampleRunner.module.scss';
import { CodeViewer } from './CodeViewer';
import { ExampleIFrame } from './ExampleIFrame';
import styles from './ExampleRunner.module.scss';

interface Props {
    id: string;
    exampleUrl?: string;
    exampleRunnerExampleUrl?: string;
    exampleType?: ExampleType;
    initialShowCode?: boolean;
    externalLinkButton?: ReactElement;
    exampleHeight?: number;
    exampleFiles?: FileContents;
    initialSelectedFile?: string;
    internalFramework: InternalFramework;
    hideInternalFrameworkSelection?: boolean;
}

const DEFAULT_HEIGHT = 500;

export const ExampleRunner: FunctionComponent<Props> = ({
    id,
    exampleUrl,
    exampleRunnerExampleUrl,
    exampleType,
    initialShowCode,
    externalLinkButton,
    exampleHeight: initialExampleHeight,
    exampleFiles,
    initialSelectedFile,
    internalFramework,
    hideInternalFrameworkSelection,
}) => {
    const [showCode, setShowCode] = useState(initialShowCode);

    const exampleHeight = initialExampleHeight || DEFAULT_HEIGHT;

    return (
        <div id={id} className={styles.exampleOuter}>
            <div className={styles.tabsContainer}>
                <div
                    className={classnames(chartsStyles.content, styles.content)}
                    role="tabpanel"
                    aria-labelledby={`${showCode ? 'Preview' : 'Code'} tab`}
                    style={{ height: exampleHeight, width: '100%' }}
                >
                    <ExampleIFrame isHidden={showCode} url={exampleRunnerExampleUrl!} />
                    {exampleFiles && (
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

                    <ul className={classnames('list-style-none', styles.externalLinks)}>
                        <li>
                            <OpenInCTA type="newTab" href={exampleUrl!} />
                        </li>
                        {externalLinkButton && <li>{externalLinkButton}</li>}
                    </ul>
                </footer>
            </div>
        </div>
    );
};
