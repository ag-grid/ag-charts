import { useState, type FunctionComponent } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import classnames from 'classnames';
import type { InternalFramework } from '../../../types/ag-grid';
import { ExampleIFrame } from './ExampleIFrame';
import styles from './ExampleRunner.module.scss';
import { Icon } from '../../../components/icon/Icon';
import { OpenInCTA } from '../../../components/open-in-cta/OpenInCTA';
import type { ExampleOptions } from '../types';
import { CodeViewer } from './CodeViewer';
import { getExampleUrl, getExampleFilesUrl } from '../../../utils/pages';

interface Props {
    name: string;
    title: string;
    exampleType?: string;
    options?: ExampleOptions;
}

const FRAME_WRAPPER_HEIGHT = 48;
const DEFAULT_HEIGHT = 500;

// NOTE: Not on the layout level, as that is generated at build time, and queryClient needs to be
// loaded on the client side
const queryClient = new QueryClient();

const ExampleRunnerInner: FunctionComponent<Props> = ({ name, title, exampleType, options, framework, pageName }) => {
    const [showCode, setShowCode] = useState(!!options?.showCode);

    const internalFramework = 'typescript'; // TODO: Get this from framework selection

    const exampleId = `example-${name}`;
    const exampleHeight = options?.exampleHeight || DEFAULT_HEIGHT;
    const exampleName = name;
    const exampleUrl = getExampleUrl({
        internalFramework,
        pageName,
        exampleName,
    });
    const exampleFilesUrl = getExampleFilesUrl({
        internalFramework,
        pageName,
        exampleName,
    });
    const id = `example-${name}`;
    const minHeight = `${exampleHeight + FRAME_WRAPPER_HEIGHT}px`;

    const {
        isLoading: exampleFilesIsLoading,
        isError: exampleFilesIsError,
        data,
    } = useQuery('exampleFiles', () => fetch(exampleFilesUrl).then((res) => res.json()));
    const files = data?.files || [];
    const initialSelectedFile = data?.entryFileName;
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
                    {!exampleFilesIsLoading && !exampleFilesIsError && (
                        <CodeViewer
                            id={exampleId}
                            isActive={showCode}
                            files={files}
                            initialSelectedFile={initialSelectedFile}
                            exampleType={exampleType}
                            internalFramework={internalFramework}
                            setInternalFramework={setInternalFramework}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export const ExampleRunner = (props) => {
    return (
        <QueryClientProvider client={queryClient}>
            <ExampleRunnerInner {...props} />
        </QueryClientProvider>
    );
};
