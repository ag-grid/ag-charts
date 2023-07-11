import { useState, type FunctionComponent } from 'react';
import classnames from 'classnames';
import type { InternalFramework } from '../../../types/ag-grid';
import { ExampleIFrame } from './ExampleIFrame';
import styles from './ExampleRunner.module.scss';
import { Icon } from '../../../components/icon/Icon';
import { OpenInCTA } from '../../../components/open-in-cta/OpenInCTA';
import type { ExampleOptions } from '../types';
import { CodeViewer } from './CodeViewer';

interface Props {
    name: string;
    title: string;
    exampleType?: string;
    options?: ExampleOptions;
    exampleUrl: string;
    internalFramework: InternalFramework;
    files: Record<string, string>;
    initialSelectedFile: string;
    // setInternalFramework: (internalFramework: InternalFramework) => void;
}

const FRAME_WRAPPER_HEIGHT = 48;
const DEFAULT_HEIGHT = 500;

export const ExampleRunner: FunctionComponent<Props> = ({
    name,
    title,
    exampleType,
    options,
    exampleUrl,
    internalFramework,
    files,
    initialSelectedFile,
}) => {
    const [showCode, setShowCode] = useState(!!options?.showCode);

    const exampleId = `example-${name}`;
    const exampleHeight = options?.exampleHeight || DEFAULT_HEIGHT;
    const id = `example-${name}`;
    const minHeight = `${exampleHeight + FRAME_WRAPPER_HEIGHT}px`;

    const setInternalFramework = (internalFramework) => {
        console.log('TODO: Set', internalFramework);
    };

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
                            <OpenInCTA type="newTab" href={exampleUrl} />
                        </li>
                        {!options?.noPlunker && <li>TODO: Open in Plunkr</li>}
                    </ul>
                </header>
                <div
                    className={classnames('tabs-content', styles.content)}
                    role="tabpanel"
                    aria-labelledby={`${showCode ? 'Preview' : 'Code'} tab`}
                    style={{ height: exampleHeight, width: '100%' }}
                >
                    <ExampleIFrame isHidden={showCode} url={exampleUrl} />
                    <CodeViewer
                        id={exampleId}
                        isActive={showCode}
                        files={files}
                        initialSelectedFile={initialSelectedFile}
                        exampleType={exampleType}
                        internalFramework={internalFramework}
                        setInternalFramework={setInternalFramework}
                    />
                </div>
            </div>
        </div>
    );
};
