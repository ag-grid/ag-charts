import { excludeHiddenFiles } from '@components/docs/utils/excludeHiddenFiles';
import { ExampleRunner } from '@components/example-runner/components/ExampleRunner';
import { ExternalLinks } from '@components/example-runner/components/ExternalLinks';
import { type ReactElement, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';

import { GALLERY_EXAMPLE_TYPE, GALLERY_INTERNAL_FRAMEWORK } from '../constants';
import {
    getExampleCodeSandboxUrl,
    getExampleContentsUrl,
    getExampleLinkUrl,
    getExamplePlunkrUrl,
    getExampleRunnerExampleUrl,
} from '../utils/urlPaths';

interface Props {
    title: string;
    exampleName: string;
    loadingIFrameId: string;
    hideCode?: boolean;
    hideExternalLinks?: boolean;
    footerChildren?: ReactElement;
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

const GalleryExampleRunnerInner = ({
    title,
    exampleName,
    loadingIFrameId,
    hideCode,
    hideExternalLinks,
    footerChildren,
}: Props) => {
    const [initialSelectedFile, setInitialSelectedFile] = useState();
    const [exampleUrl, setExampleUrl] = useState<string>();
    const [exampleRunnerExampleUrl, setExampleRunnerExampleUrl] = useState<string>();
    const [codeSandboxHtmlUrl, setCodeSandboxHtmlUrl] = useState<string>();
    const [plunkrHtmlUrl, setPlunkrHtmlUrl] = useState<string>();
    const [exampleFiles, setExampleFiles] = useState<Record<string, string>>();
    const [exampleRunnerFiles, setExampleRunnerFiles] = useState<Record<string, string>>();
    const [exampleBoilerPlateFiles, setExampleBoilerPlateFiles] = useState();
    const [packageJson, setPackageJson] = useState();

    const internalFramework = GALLERY_INTERNAL_FRAMEWORK;
    const exampleType = GALLERY_EXAMPLE_TYPE;
    const id = `example-${exampleName}`;

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
                getExampleLinkUrl({
                    exampleName,
                })
            ).then((res) => res.text());

            return Promise.all([getContents, getExampleFileHtml]);
        },
        {
            ...queryOptions,
            enabled: !hideCode,
        }
    );

    useEffect(() => {
        if (!exampleName) {
            return;
        }

        setExampleUrl(
            getExampleLinkUrl({
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

        const newExampleRunnerFiles = excludeHiddenFiles({
            internalFramework,
            files,
        });

        setExampleFiles(files);
        setExampleRunnerFiles(newExampleRunnerFiles);
        setPackageJson(contents.packageJson);
        setExampleBoilerPlateFiles(contents.boilerPlateFiles);
    }, [internalFramework, contents, exampleFilesIsLoading, exampleFilesIsError, exampleFileHtml]);

    const externalLinks = hideExternalLinks ? undefined : (
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

    return (
        <ExampleRunner
            id={id}
            title={title}
            exampleName={exampleName}
            exampleUrl={exampleUrl}
            exampleRunnerExampleUrl={exampleRunnerExampleUrl}
            exampleType={exampleType}
            hideCode={hideCode}
            exampleFiles={exampleRunnerFiles}
            initialSelectedFile={initialSelectedFile}
            internalFramework={internalFramework}
            externalLinks={externalLinks}
            hideExternalLinks={hideExternalLinks}
            hideInternalFrameworkSelection={true}
            exampleHeight={620}
            loadingIFrameId={loadingIFrameId}
            footerChildren={footerChildren}
        />
    );
};

export const GalleryExampleRunner = (props: Props) => {
    return (
        <QueryClientProvider client={queryClient}>
            <GalleryExampleRunnerInner {...props} />
        </QueryClientProvider>
    );
};
