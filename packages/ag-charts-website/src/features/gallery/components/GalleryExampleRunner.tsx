import { ExampleRunner } from '@features/example-runner/components/ExampleRunner';
import { OpenInPlunkr } from '@features/plunkr/components/OpenInPlunkr';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';

import { GALLERY_EXAMPLE_TYPE, GALLERY_INTERNAL_FRAMEWORK } from '../constants';
import { getExampleContentsUrl, getExampleUrl, getExampleWithRelativePathUrl } from '../utils/urlPaths';

interface Props {
    title: string;
    exampleName: string;
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

const GalleryExampleRunnerInner = ({ title, exampleName }: Props) => {
    const [initialSelectedFile, setInitialSelectedFile] = useState();
    const [exampleUrl, setExampleUrl] = useState<string>();
    const [plunkrHtmlUrl, setPlunkrHtmlUrl] = useState<string>();
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
        setExampleUrl(
            getExampleUrl({
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
        setPlunkrHtmlUrl(
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

    const externalLinkButton =
        exampleFiles && plunkrHtmlUrl ? (
            <OpenInPlunkr
                title={title}
                files={exampleFiles}
                plunkrHtmlUrl={plunkrHtmlUrl}
                boilerPlateFiles={exampleBoilerPlateFiles}
                fileToOpen={initialSelectedFile!}
            />
        ) : undefined;

    return (
        <ExampleRunner
            id={id}
            exampleUrl={exampleUrl}
            exampleType={exampleType}
            exampleFiles={exampleFiles}
            initialSelectedFile={initialSelectedFile}
            internalFramework={internalFramework}
            externalLinkButton={externalLinkButton}
            hideInternalFrameworkSelection={true}
            exampleHeight={620}
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
