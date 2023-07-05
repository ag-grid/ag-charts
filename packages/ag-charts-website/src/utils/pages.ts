import { FRAMEWORKS } from "../constants";

function ignoreUnderscoreFiles(page: any) {
    const pageFolders = page.slug.split("/");
    const pageName = pageFolders[pageFolders.length - 1];
    return pageName && !pageName.startsWith("_");
}

export function getDocPagesList(pages: any) {
    return pages.filter(ignoreUnderscoreFiles);
}

export function getDocPages(pages: any) {
    return FRAMEWORKS.map((framework) => {
        return getDocPagesList(pages).map((page: any) => {
            return {
                params: {
                    framework,
                    pageName: page.slug,
                },
                props: {
                    page,
                },
            };
        });
    }).flat();
}
