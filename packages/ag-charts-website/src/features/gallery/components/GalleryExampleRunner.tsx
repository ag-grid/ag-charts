import { OpenInCodeSandbox } from '@features/codeSandbox/components/OpenInCodeSandbox';
import { ExampleRunner } from '@features/example-runner/components/ExampleRunner';
import { OpenInPlunkr } from '@features/plunkr/components/OpenInPlunkr';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';

import { GALLERY_EXAMPLE_TYPE, GALLERY_INTERNAL_FRAMEWORK } from '../constants';
import {
    getExampleContentsUrl,
    getExampleRunnerExampleUrl,
    getExampleUrl,
    getExampleWithRelativePathUrl,
} from '../utils/urlPaths';

interface Props {
    title: string;
    exampleName: string;
    loadingIFrameId: string;
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

const GalleryExampleRunnerInner = ({ title, exampleName, loadingIFrameId }: Props) => {
    const [initialSelectedFile, setInitialSelectedFile] = useState();
    const [exampleUrl, setExampleUrl] = useState<string>();
    const [exampleRunnerExampleUrl, setExampleRunnerExampleUrl] = useState<string>();
    const [htmlUrl, setHtmlUrl] = useState<string>();
    const [exampleFiles, setExampleFiles] = useState();
    const [exampleBoilerPlateFiles, setExampleBoilerPlateFiles] = useState();

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
        setHtmlUrl(
            getExampleWithRelativePathUrl({
                exampleName,
            })
        );
    }, [exampleName]);

    // Override `index.html` with generated file as
    // exampleFiles endpoint only gets the index html fragment
    useEffect(() => {
        if (!contents || exampleFilesIsLoading || exampleFilesIsError || !exampleFileHtml) {
            return;
        }
        const files = {
            ...contents.files,
            'index.html': exampleFileHtml,
        };

        setExampleFiles(files);
        setExampleBoilerPlateFiles(contents.boilerPlateFiles);
    }, [contents, exampleFilesIsLoading, exampleFilesIsError, exampleFileHtml]);

    const externalLinks =
        exampleFiles && htmlUrl ? (
            <>
                <li>
                    <OpenInCodeSandbox
                        title={title}
                        files={exampleFiles}
                        htmlUrl={htmlUrl}
                        boilerPlateFiles={exampleBoilerPlateFiles}
                    />
                </li>
                <li>
                    <OpenInPlunkr
                        title={title}
                        files={exampleFiles}
                        htmlUrl={htmlUrl}
                        boilerPlateFiles={exampleBoilerPlateFiles}
                        fileToOpen={initialSelectedFile!}
                    />
                </li>
            </>
        ) : undefined;

    return (
        <ExampleRunner
            id={id}
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
    );
};

export const GalleryExampleRunner = (props: Props) => {
    return (
        <QueryClientProvider client={queryClient}>
            <GalleryExampleRunnerInner {...props} />
        </QueryClientProvider>
    );
};
