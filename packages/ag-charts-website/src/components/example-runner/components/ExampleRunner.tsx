import type { InternalFramework } from '@ag-grid-types';
import { ExampleDevToolbar } from '@ag-website-shared/components/dev-tools/ExampleDevToolbar';
import { $exampleDevToolbar } from '@ag-website-shared/components/dev-tools/stores/devToolsStore';
import { ExampleLogger } from '@ag-website-shared/components/example-runner/components/ExampleLogger';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import { LinkIcon } from '@ag-website-shared/components/link-icon/LinkIcon';
import { OpenInCTA } from '@ag-website-shared/components/open-in-cta/OpenInCTA';
import type { ExampleType, FileContents } from '@components/example-generator/types';
import { getFrameworkFromInternalFramework } from '@utils/framework';
import { useStoreSsr } from '@utils/hooks/useStoreSsr';
import classnames from 'classnames';
import { type FunctionComponent, type ReactElement, useState } from 'react';

import { CodeViewer } from './CodeViewer';
import { ExampleIFrame } from './ExampleIFrame';
import styles from './ExampleRunner.module.scss';

interface Props {
    id: string;
    title: string;
    exampleName: string;
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
    hasExampleConsoleLog?: boolean;
    consoleBufferSize?: number;
    footerChildren?: ReactElement;
    initialLoadDeferred?: boolean;
}

const DEFAULT_HEIGHT = 500;
const MIN_HEIGHT = 320;
export const ExampleRunner: FunctionComponent<Props> = ({
    id,
    title,
    exampleName,
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
    hasExampleConsoleLog,
    consoleBufferSize,
    footerChildren,
    initialLoadDeferred = false,
}) => {
    const [deferred, setDeferred] = useState(initialLoadDeferred);
    const [showCode, setShowCode] = useState(initialShowCode);
    const hideFooter = !hideCode && !hideExternalLinks && !footerChildren;
    const showExampleDevToolbar = useStoreSsr($exampleDevToolbar, false);
    const framework = getFrameworkFromInternalFramework(internalFramework);

    return (
        <div className={styles.exampleOuter}>
            <div className={styles.tabsContainer}>
                <div
                    className={classnames(styles.content, {
                        [styles.hasExampleConsoleLog]: hasExampleConsoleLog,
                    })}
                    role="tabpanel"
                    aria-labelledby={`${showCode ? 'Preview' : 'Code'} tab`}
                    style={{ height: Math.max(exampleHeight, MIN_HEIGHT) }}
                >
                    {deferred ? (
                        <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
                            <button
                                style={{
                                    position: 'relative',
                                    boxShadow: '0 0 0 2px color(from var(--color-bg-primary) srgb r g b / 0.8)',
                                    zIndex: 1,
                                }}
                                onClick={() => setDeferred(false)}
                            >
                                Load
                            </button>
                        </div>
                    ) : (
                        <ExampleIFrame
                            title={title}
                            isHidden={showCode}
                            url={exampleRunnerExampleUrl}
                            loadingIFrameId={loadingIFrameId}
                        />
                    )}
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
                {hasExampleConsoleLog && <ExampleLogger exampleName={exampleName} bufferSize={consoleBufferSize} />}
                {hideFooter && (
                    <footer className={styles.footer}>
                        {showExampleDevToolbar && <ExampleDevToolbar framework={framework} exampleName={exampleName} />}
                        {!hideCode && (
                            <button
                                className={classnames(styles.previewCodeToggle, 'button-secondary')}
                                onClick={() => {
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
                                    <LinkIcon href={`#${id}`} exampleLink={true} />
                                </li>
                                <li>
                                    <OpenInCTA type="newTab" href={exampleUrl!} />
                                </li>
                                {externalLinks}
                            </ul>
                        )}

                        {footerChildren}
                    </footer>
                )}
            </div>
        </div>
    );
};
