import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import { OpenInPlunkr } from '../../plunkr/components/OpenInPlunkr';
import { ExampleRunner } from '../../example-runner/components/ExampleRunner';
import { getExampleContentsUrl, getExampleUrl, getExampleWithRelativePathUrl } from '../utils/urlPaths';
import { GALLERY_EXAMPLE_TYPE, GALLERY_INTERNAL_FRAMEWORK } from '../constants';

interface Props {
    title: string;
    exampleName: string;
}

// NOTE: Not on the layout level, as that is generated at build time, and queryClient needs to be
// loaded on the client side
const queryClient = new QueryClient();

const queryOptions = {
    retry: 3,
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
        data,
    } = useQuery(
        ['galleryExampleFiles', exampleName],
        () =>
            fetch(
                getExampleContentsUrl({
                    exampleName,
                })
            ).then((res) => res.json()),
        queryOptions
    );

    const { data: exampleFileHtml } = useQuery(
        ['galleryExampleHtml', exampleName],
        () =>
            fetch(
                getExampleUrl({
                    exampleName,
                })
            ).then((res) => res.text()),
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
        if (!data || exampleFilesIsLoading || exampleFilesIsError) {
            return;
        }
        setInitialSelectedFile(data?.entryFileName);
    }, [data, exampleFilesIsLoading, exampleFilesIsError]);

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

    const externalLinkButton =
        exampleFiles && plunkrHtmlUrl ? (
            <OpenInPlunkr
                title={title}
                files={exampleFiles}
                plunkrHtmlUrl={plunkrHtmlUrl}
                boilerPlateFiles={exampleBoilerPlateFiles}
                fileToOpen={initialSelectedFile!}
                internalFramework={internalFramework}
                pageName={title}
                exampleName={exampleName}
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
