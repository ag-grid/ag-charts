import { useState, useEffect, type FunctionComponent } from 'react';
import { useStore } from '@nanostores/react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import classnames from 'classnames';
import { ExampleIFrame } from './ExampleIFrame';
import styles from './ExampleRunner.module.scss';
import { Icon } from '../../../components/icon/Icon';
import { OpenInCTA } from '../../../components/open-in-cta/OpenInCTA';
import type { ExampleOptions } from '../types';
import { CodeViewer } from './CodeViewer';
import { getExampleUrl, getExampleFilesUrl } from '../../../utils/pages';
import { getFrameworkFromInternalFramework } from '../../../utils/framework';
import { $internalFramework, updateInternalFrameworkBasedOnFramework } from '../../../stores/frameworkStore';
import type { Framework } from '../../../types/ag-grid';
import { OpenInPlunkr } from '../../plunkr/components/OpenInPlunkr';

interface Props {
    name: string;
    title: string;
    exampleType?: string;
    options?: ExampleOptions;
    framework: Framework;
    pageName: string;
}

const FRAME_WRAPPER_HEIGHT = 48;
const DEFAULT_HEIGHT = 500;

// NOTE: Not on the layout level, as that is generated at build time, and queryClient needs to be
// loaded on the client side
const queryClient = new QueryClient();

/**
 * Update the internal framework if it is different to the framework in the URL
 *
 * @param framework Framework from the URL
 */
function useUpdateInternalFrameworkFromFramework(framework: Framework) {
    const internalFramework = useStore($internalFramework);

    useEffect(() => {
        const frameworkFromInternalFramework = getFrameworkFromInternalFramework(internalFramework);
        if (frameworkFromInternalFramework !== framework) {
            updateInternalFrameworkBasedOnFramework(framework);
        }
    }, [internalFramework, framework]);
}

const queryOptions = {
    retry: 3,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
};

const ExampleRunnerInner: FunctionComponent<Props> = ({ name, title, exampleType, options, framework, pageName }) => {
    const [showCode, setShowCode] = useState(!!options?.showCode);
    const internalFramework = useStore($internalFramework);
    const [initialSelectedFile, setInitialSelectedFile] = useState();
    const [exampleUrl, setExampleUrl] = useState<string>();
    const [exampleFiles, setExampleFiles] = useState();
    const [exampleBoilerPlateFiles, setExampleBoilerPlateFiles] = useState();

    const exampleId = `example-${name}`;
    const exampleHeight = options?.exampleHeight || DEFAULT_HEIGHT;
    const exampleName = name;

    const id = `example-${name}`;
    const minHeight = `${exampleHeight + FRAME_WRAPPER_HEIGHT}px`;

    // NOTE: Plunkr only works for these internal frameworks for now
    const supportsPlunkr = ['vanilla', 'typescript', 'react', 'reactFunctional', 'reactFunctionalTs'].includes(
        internalFramework
    );

    const {
        isLoading: exampleFilesIsLoading,
        isError: exampleFilesIsError,
        data,
    } = useQuery(
        ['exampleFiles', internalFramework, pageName, exampleName],
        () =>
            fetch(
                getExampleFilesUrl({
                    internalFramework,
                    pageName,
                    exampleName,
                })
            ).then((res) => res.json()),
        queryOptions
    );

    const { data: exampleFileHtml } = useQuery(
        ['exampleHtml', internalFramework, pageName, exampleName],
        () =>
            fetch(
                getExampleUrl({
                    internalFramework,
                    pageName,
                    exampleName,
                })
            ).then((res) => res.text()),
        queryOptions
    );

    useEffect(() => {
        setExampleUrl(
            getExampleUrl({
                internalFramework,
                pageName,
                exampleName,
            })
        );
    }, [internalFramework, pageName, exampleName]);

    useEffect(() => {
        if (!data || exampleFilesIsLoading || exampleFilesIsError) {
            return;
        }
        setInitialSelectedFile(data?.entryFileName);
    }, [data, exampleFilesIsLoading, exampleFilesIsError]);

    // Override `index.html` with generated file as
    // exampleFiles endpoint only gets the index html fragment
    useEffect(() => {
        if (!data || exampleFilesIsLoading || exampleFilesIsError || !exampleFileHtml) {
            return;
        }
        const files = {
            ...data.files,
            'index.html': exampleFileHtml,
        };

        setExampleFiles(files);
        setExampleBoilerPlateFiles(data.boilerPlateFiles);
    }, [data, exampleFilesIsLoading, exampleFilesIsError, exampleFileHtml]);

    useUpdateInternalFrameworkFromFramework(framework);

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
                        {!options?.noPlunker && supportsPlunkr && exampleFiles && (
                            <li>
                                <OpenInPlunkr
                                    title={title}
                                    files={exampleFiles}
                                    boilerPlateFiles={exampleBoilerPlateFiles}
                                    fileToOpen={initialSelectedFile!}
                                    internalFramework={internalFramework}
                                    pageName={pageName}
                                    exampleName={exampleName}
                                />
                            </li>
                        )}
                    </ul>
                </header>
                <div
                    className={classnames('tabs-content', styles.content)}
                    role="tabpanel"
                    aria-labelledby={`${showCode ? 'Preview' : 'Code'} tab`}
                    style={{ height: exampleHeight, width: '100%' }}
                >
                    <ExampleIFrame isHidden={showCode} url={exampleUrl!} />
                    {!exampleFilesIsLoading && !exampleFilesIsError && exampleFiles && (
                        <CodeViewer
                            id={exampleId}
                            isActive={showCode}
                            files={exampleFiles}
                            initialSelectedFile={initialSelectedFile}
                            exampleType={exampleType}
                            internalFramework={internalFramework}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export const ExampleRunner = (props: any) => {
    return (
        <QueryClientProvider client={queryClient}>
            <ExampleRunnerInner {...props} />
        </QueryClientProvider>
    );
};
