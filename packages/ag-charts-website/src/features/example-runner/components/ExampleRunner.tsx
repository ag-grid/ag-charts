import type { InternalFramework } from '@ag-grid-types';
import { Icon } from '@components/icon/Icon';
import { OpenInCTA } from '@components/open-in-cta/OpenInCTA';
import type { ExampleType, FileContents } from '@features/examples-generator/types';
import classnames from 'classnames';
import { type FunctionComponent, type ReactElement, useState } from 'react';
import { CodeViewer } from './CodeViewer';
import { ExampleIFrame } from './ExampleIFrame';
import styles from './ExampleRunner.module.scss';

interface Props {
    id: string;
    exampleUrl?: string;
    exampleType?: ExampleType;
    initialShowCode?: boolean;
    externalLinkButton?: ReactElement;
    exampleHeight?: number;
    exampleFiles?: FileContents;
    initialSelectedFile?: string;
    internalFramework: InternalFramework;
    hideInternalFrameworkSelection?: boolean;
}

const FRAME_WRAPPER_HEIGHT = 48;
const DEFAULT_HEIGHT = 500;

export const ExampleRunner: FunctionComponent<Props> = ({
    id,
    exampleUrl,
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
    const minHeight = `${exampleHeight + FRAME_WRAPPER_HEIGHT}px`;

    return (
        <div id={id} style={{ minHeight }}>
            <div className={classnames('tabs-outer', styles.tabsContainer)}>
                <header className={classnames('tabs-header', styles.header)}>
                    <ul className="tabs-nav-list" role="tablist">
                        {/* eslint-disable-line */}
                        <li className="tabs-nav-item" role="presentation">
                            <button
                                className={classnames('button-style-none', 'tabs-nav-link', { active: !showCode })}
                                onClick={(e) => {
                                    setShowCode(false);
                                    e.preventDefault();
                                }}
                                role="tab"
                                title="Run example"
                                disabled={!showCode}
                            >
                                Preview <Icon name="executableProgram" />
                            </button>
                        </li>
                        <li className="tabs-nav-item" role="presentation">
                            <button
                                className={classnames(
                                    'button-style-none',
                                    'tabs-nav-link',
                                    { active: showCode },
                                    styles.codeTabButton
                                )}
                                onClick={(e) => {
                                    setShowCode(true);
                                    e.preventDefault();
                                }}
                                role="tab"
                                title="View Example Source Code"
                                disabled={showCode}
                            >
                                Code <Icon name="code" />
                            </button>
                        </li>
                    </ul>

                    <ul className={classnames('list-style-none', styles.externalLinks)}>
                        <li>
                            <OpenInCTA type="newTab" href={exampleUrl!} />
                        </li>
                        {externalLinkButton && <li>{externalLinkButton}</li>}
                    </ul>
                </header>
                <div
                    className={classnames('tabs-content', styles.content)}
                    role="tabpanel"
                    aria-labelledby={`${showCode ? 'Preview' : 'Code'} tab`}
                    style={{ height: exampleHeight, width: '100%' }}
                >
                    <ExampleIFrame isHidden={showCode} url={exampleUrl!} />
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
            </div>
        </div>
    );
};
