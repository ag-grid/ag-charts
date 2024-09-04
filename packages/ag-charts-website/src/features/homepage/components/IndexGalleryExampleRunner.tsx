import { Icon, type IconName } from '@ag-website-shared/components/icon/Icon';
import { ExampleRunner } from '@features/example-runner/components/ExampleRunner';
import { ExternalLinks } from '@features/example-runner/components/ExternalLinks';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';

import { GALLERY_EXAMPLE_TYPE, GALLERY_INTERNAL_FRAMEWORK } from '../constants';
import {
    getExampleCodeSandboxUrl,
    getExampleContentsUrl,
    getExamplePlunkrUrl,
    getExampleRunnerExampleUrl,
    getExampleUrl,
} from '../utils/urlPaths';
import styles from './IndexGalleryExampleRunner.module.scss';

interface Props {
    examples: Array<{
        title: string;
        exampleName: string;
        buttonText: string;
        icon: string;
    }>;
    loadingIFrameId: string;
    format: string;
}

// NOTE: Not on the layout level, as that is generated at build time, and queryClient needs to be
// loaded on the client side
const queryClient = new QueryClient();

const queryOptions = {
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
};

const GalleryExampleRunnerInner = ({ examples, loadingIFrameId, format }: Props) => {
    const [currentExampleName, setCurrentExampleName] = useState(examples[0].exampleName);
    const currentExample = examples.find((example) => example.exampleName === currentExampleName) || examples[0];
    const { title, exampleName } = currentExample;

    const [initialSelectedFile, setInitialSelectedFile] = useState();
    const [exampleUrl, setExampleUrl] = useState<string>();
    const [exampleRunnerExampleUrl, setExampleRunnerExampleUrl] = useState<string>();
    const [codeSandboxHtmlUrl, setCodeSandboxHtmlUrl] = useState<string>();
    const [plunkrHtmlUrl, setPlunkrHtmlUrl] = useState<string>();
    const [exampleFiles, setExampleFiles] = useState();
    const [exampleBoilerPlateFiles, setExampleBoilerPlateFiles] = useState();
    const [packageJson, setPackageJson] = useState();

    const internalFramework = GALLERY_INTERNAL_FRAMEWORK;
    const exampleType = GALLERY_EXAMPLE_TYPE;
    const id = `example-${currentExampleName}`;

    const {
        isLoading: exampleFilesIsLoading,
        isError: exampleFilesIsError,
        data: [contents, exampleFileHtml] = [],
    } = useQuery(
        ['galleryExampleFiles', exampleName],
        () => {
            const getContents = fetch(
                getExampleContentsUrl({
                    exampleName,
                })
            ).then((res) => res.json());

            const getExampleFileHtml = fetch(
                getExampleUrl({
                    exampleName,
                })
            ).then((res) => res.text());

            return Promise.all([getContents, getExampleFileHtml]);
        },
        queryOptions
    );

    useEffect(() => {
        if (!exampleName) {
            return;
        }

        setExampleUrl(
            getExampleUrl({
                exampleName,
            })
        );

        setExampleRunnerExampleUrl(
            getExampleRunnerExampleUrl({
                exampleName,
            })
        );
    }, [exampleName]);

    useEffect(() => {
        if (!contents || exampleFilesIsLoading || exampleFilesIsError) {
            return;
        }
        setInitialSelectedFile(contents?.mainFileName);
    }, [contents, exampleFilesIsLoading, exampleFilesIsError]);

    useEffect(() => {
        setCodeSandboxHtmlUrl(
            getExampleCodeSandboxUrl({
                exampleName,
            })
        );

        setPlunkrHtmlUrl(
            getExamplePlunkrUrl({
                exampleName,
            })
        );
    }, [exampleName]);

    useEffect(() => {
        if (!contents || exampleFilesIsLoading || exampleFilesIsError || !exampleFileHtml) {
            return;
        }
        const files = {
            ...contents.files,
            // Override `index.html` with generated file as
            // exampleFiles endpoint only gets the index html fragment
            'index.html': exampleFileHtml,
        };

        setExampleFiles(files);
        setPackageJson(contents.packageJson);
        setExampleBoilerPlateFiles(contents.boilerPlateFiles);
    }, [contents, exampleFilesIsLoading, exampleFilesIsError, exampleFileHtml]);

    const externalLinks = (
        <ExternalLinks
            title={title}
            internalFramework={internalFramework}
            exampleFiles={exampleFiles}
            exampleBoilerPlateFiles={exampleBoilerPlateFiles}
            packageJson={packageJson}
            initialSelectedFile={initialSelectedFile}
            plunkrHtmlUrl={plunkrHtmlUrl}
            codeSandboxHtmlUrl={codeSandboxHtmlUrl}
        />
    );

    const handleExampleSelect = (exampleName: string) => {
        setCurrentExampleName(exampleName);
    };

    return (
        <div className={styles.container}>
            <div className={styles.tabContainer}>
                {examples.map((example) => (
                    <button
                        key={example.exampleName}
                        className={`${styles.tabButton} ${example.exampleName === currentExampleName ? styles.activeTabButton : ''}`}
                        onClick={() => handleExampleSelect(example.exampleName)}
                    >
                        <Icon
                            svgClasses={`${example.exampleName === currentExampleName ? styles.activeTabButtonIcon : styles.tabButtonIcon}`}
                            name={example.icon as IconName}
                        />
                        {example.buttonText}
                    </button>
                ))}
            </div>
            <div className={styles.exampleContainer}>
                <ExampleRunner
                    id={id}
                    title={title}
                    exampleUrl={exampleUrl}
                    exampleRunnerExampleUrl={exampleRunnerExampleUrl}
                    exampleType={exampleType}
                    exampleFiles={exampleFiles}
                    initialSelectedFile={initialSelectedFile}
                    internalFramework={internalFramework}
                    externalLinks={externalLinks}
                    hideInternalFrameworkSelection={true}
                    exampleHeight={620}
                    loadingIFrameId={loadingIFrameId}
                />
            </div>
        </div>
    );
};

export const IndexGalleryExampleRunner = (props: Props) => {
    return (
        <QueryClientProvider client={queryClient}>
            <GalleryExampleRunnerInner {...props} />
        </QueryClientProvider>
    );
};
