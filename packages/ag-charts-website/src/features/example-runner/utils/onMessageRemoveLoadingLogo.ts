import { getLoadingIFrameId, getLoadingLogoId } from './getLoadingLogoId';

interface Params {
    pageName: string;
    exampleName: string;
}

interface MessageParams {
    data: {
        pageName: string;
        exampleName: string;
        type: 'init';
    };
}

const createRemoveLoadingLogo =
    ({ pageName, exampleName }: Params) =>
    ({ data }: MessageParams) => {
        const loadingIFrameId = getLoadingIFrameId({ pageName, exampleName });
        const loadingLogoId = getLoadingLogoId({ pageName, exampleName });
        const isExample = pageName === data?.pageName && exampleName === data?.exampleName;
        if (!isExample) return;

        if (data?.type === 'init') {
            // FIXME - some pages have the same example on the page twice
            // this code works, but we should move off IDs so we can handle this case
            document.querySelectorAll('#' + loadingLogoId).forEach((loadingLogoId) => {
                loadingLogoId.remove();
            });
            document.querySelectorAll('#' + loadingIFrameId).forEach((el) => {
                const iframe = el as HTMLIFrameElement;
                if (!iframe || !iframe.contentDocument) {
                    return;
                }

                iframe.style.visibility = 'visible';
                if (document.documentElement.dataset['darkMode'] === 'true') {
                    iframe.contentDocument.documentElement.dataset.darkMode = 'true';
                }
            });
        }
    };

/**
 * Note: This is duplicated in `RemoveLogoOnInitScript.astro` for Astro use cases
 */
export function onMessageRemoveLoadingLogo({ pageName, exampleName }: Params) {
    const removeLoadingLogo = createRemoveLoadingLogo({ pageName, exampleName });

    window.addEventListener('message', removeLoadingLogo);

    return {
        cleanUp: () => window.removeEventListener('message', removeLoadingLogo),
    };
}
