import type { InternalFramework } from '@ag-grid-types';
import { getLoadingIFrameId } from '@ag-website-shared/components/loading-logo/getElementId';
import { excludeHiddenFiles } from '@components/docs/utils/excludeHiddenFiles';
import type { ExampleType } from '@components/example-generator/types';
import { ExampleRunner } from '@components/example-runner/components/ExampleRunner';
import { ExternalLinks } from '@components/example-runner/components/ExternalLinks';
import type { ExampleOptions } from '@components/example-runner/types';
import { useStore } from '@nanostores/react';
import { $internalFramework } from '@stores/frameworkStore';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';

import {
    getExampleCodeSandboxUrl,
    getExampleContentsUrl,
    getExamplePlunkrUrl,
    getExampleRunnerExampleUrl,
    getExampleUrl,
} from '../utils/urlPaths';

interface Props {
    name: string;
    title: string;
    exampleType?: ExampleType;
    options?: ExampleOptions;
    pageName: string;
    internalFrameworkOverride?: InternalFramework;
    hideCode?: boolean;
    hideExternalLinks?: boolean;
    hasExampleConsoleLog?: boolean;
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

const DocsExampleRunnerInner = ({
    name,
    title,
    exampleType,
    options,
    pageName,
    internalFrameworkOverride,
    hideCode,
    hideExternalLinks,
    hasExampleConsoleLog,
}: Props) => {
    const storeInternalFramework = useStore($internalFramework);
    const internalFramework = internalFrameworkOverride ?? storeInternalFramework;
    const [initialSelectedFile, setInitialSelectedFile] = useState();
    const [exampleUrl, setExampleUrl] = useState<string>();
    const [exampleRunnerExampleUrl, setExampleRunnerExampleUrl] = useState<string>();
    const [codeSandboxHtmlUrl, setCodeSandboxHtmlUrl] = useState<string>();
    const [plunkrHtmlUrl, setPlunkrHtmlUrl] = useState<string>();
    const [exampleFiles, setExampleFiles] = useState<Record<string, string>>();
    const [exampleRunnerFiles, setExampleRunnerFiles] = useState<Record<string, string>>();
    const [exampleBoilerPlateFiles, setExampleBoilerPlateFiles] = useState();
    const [packageJson, setPackageJson] = useState();

    const exampleName = name;
    const id = `example-${name}`;
    const loadingIFrameId = getLoadingIFrameId({ pageName, exampleName: name });

    const {
        isLoading: contentsIsLoading,
        isError: contentsIsError,
        data: [contents, exampleFileHtml] = [],
    } = useQuery(
        ['docsExampleContents', internalFramework, pageName, exampleName],
        () => {
            const getContents = fetch(
                getExampleContentsUrl({
                    internalFramework,
                    pageName,
                    exampleName,
                })
            ).then((res) => res.json());

            const getExampleFileHtml = fetch(
                getExampleUrl({
                    internalFramework,
                    pageName,
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
                internalFramework,
                pageName,
                exampleName,
            })
        );
        setExampleRunnerExampleUrl(
            getExampleRunnerExampleUrl({
                internalFramework,
                pageName,
                exampleName,
            })
        );
    }, [internalFramework, pageName, exampleName]);

    useEffect(() => {
        if (!contents || contentsIsLoading || contentsIsError) {
            return;
        }
        setInitialSelectedFile(contents?.mainFileName);
    }, [contents, contentsIsLoading, contentsIsError]);

    useEffect(() => {
        setCodeSandboxHtmlUrl(
            getExampleCodeSandboxUrl({
                internalFramework,
                pageName,
                exampleName,
            })
        );

        setPlunkrHtmlUrl(
            getExamplePlunkrUrl({
                internalFramework,
                pageName,
                exampleName,
            })
        );
    }, [internalFramework, pageName, exampleName]);

    useEffect(() => {
        if (!contents || contentsIsLoading || contentsIsError || !exampleFileHtml) {
            return;
        }
        const files = {
            ...contents.files,
            // Override `index.html` with generated file as
            // exampleFiles endpoint only gets the index html fragment
            'index.html': exampleFileHtml,
        };

        const newExampleRunnerFiles = excludeHiddenFiles({
            internalFramework,
            files,
        });

        setExampleFiles(files);
        setExampleRunnerFiles(newExampleRunnerFiles);
        setPackageJson(contents.packageJson);
        setExampleBoilerPlateFiles(contents.boilerPlateFiles);
    }, [internalFramework, contents, contentsIsLoading, contentsIsError, exampleFileHtml]);

    const externalLinks = (
        <ExternalLinks
            title={title}
            options={options}
            internalFramework={internalFramework}
            exampleFiles={exampleFiles}
            exampleBoilerPlateFiles={exampleBoilerPlateFiles}
            packageJson={packageJson}
            initialSelectedFile={initialSelectedFile}
            plunkrHtmlUrl={plunkrHtmlUrl}
            codeSandboxHtmlUrl={codeSandboxHtmlUrl}
        />
    );

    return (
        <ExampleRunner
            id={id}
            title={title}
            exampleName={exampleName}
            exampleUrl={exampleUrl}
            exampleRunnerExampleUrl={exampleRunnerExampleUrl}
            exampleType={exampleType}
            exampleHeight={options?.exampleHeight}
            exampleWidth={options?.exampleWidth}
            exampleFiles={exampleRunnerFiles}
            initialShowCode={options?.showCode}
            initialSelectedFile={initialSelectedFile}
            internalFramework={internalFramework}
            externalLinks={externalLinks}
            loadingIFrameId={loadingIFrameId}
            hideCode={hideCode}
            hideExternalLinks={hideExternalLinks}
            hasExampleConsoleLog={hasExampleConsoleLog}
            consoleBufferSize={options?.consoleBufferSize}
        />
    );
};

export const DocsExampleRunner = (props: Props) => {
    return (
        <QueryClientProvider client={queryClient}>
            <DocsExampleRunnerInner {...props} />
        </QueryClientProvider>
    );
};
