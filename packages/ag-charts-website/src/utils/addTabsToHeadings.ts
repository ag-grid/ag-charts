import Markdoc, { type Node } from '@markdoc/markdoc';
import GithubSlugger from 'github-slugger';
import type { Heading } from 'src/types/markdoc';

const TABS_TAG_NAME = 'tabs';
const TAB_ITEM_TAG_NAME = 'tabItem';

interface ParentHeading {
    depth: number;
    text: string;
    slug: string;
}

function isTabsTag({ type, tag }: Node) {
    return type === 'tag' && tag === TABS_TAG_NAME;
}

function isTabItemTag({ type, tag }: Node) {
    return type === 'tag' && tag === TAB_ITEM_TAG_NAME;
}

function getParentHeadingFromIndex({ tab, ast }: { tab: Node; ast: Node }) {
    const astChildren = ast.children;
    const tabIndex = astChildren.findIndex((child: Node) => {
        return child === tab;
    });

    let heading;
    for (let i = tabIndex - 1; i >= 0; i--) {
        const node = astChildren[i];
        if (node.type === 'heading') {
            heading = node;
            break;
        }
    }

    return heading;
}

function getParentHeadingData(parentHeadingAst: Node): ParentHeading {
    const slugger = new GithubSlugger();
    const parentHeadingText = parentHeadingAst.children[0].children[0].attributes.content;
    const parentHeadingSlug = slugger.slug(parentHeadingText);

    return {
        depth: parentHeadingAst.attributes.level,
        text: parentHeadingText,
        slug: parentHeadingSlug,
    };
}

/**
 * Extract markdoc `{% tabs %}` tag data from content
 */
function getMarkdocTabs(content: string) {
    const ast = Markdoc.parse(content);

    const astTabs = ast.children.filter(isTabsTag);
    const tabs = astTabs
        .map((tab) => {
            const parentHeadingAst = getParentHeadingFromIndex({ tab, ast });
            if (!parentHeadingAst) {
                return;
            }
            const parentHeading = getParentHeadingData(parentHeadingAst);
            const tabItemsAst = tab.children.filter(isTabItemTag);
            const tabItems = tabItemsAst.map(({ attributes }) => attributes);

            return {
                parentHeading,
                tabItems,
            };
        })
        .filter(Boolean);

    return tabs;
}

export function addTabsToHeadings({
    markdocContent,
    headings,
    getTabItemSlug,
}: {
    markdocContent: string;
    headings: Heading[];
    getTabItemSlug: (params: { id: string; parentHeading: ParentHeading }) => string;
}) {
    const tabs = getMarkdocTabs(markdocContent);
    let extendedHeadings = headings.slice();

    tabs.forEach((tab) => {
        const { parentHeading } = tab!;
        const headingIndex = extendedHeadings.findIndex(({ slug }) => {
            return slug === parentHeading.slug;
        });

        if (headingIndex >= 0) {
            const depth = parentHeading.depth + 1;
            const tabItemHeadings: Heading[] =
                tab?.tabItems.map(({ id, label }) => {
                    return {
                        depth,
                        text: label,
                        slug: getTabItemSlug({ parentHeading, id }),
                    };
                }) || [];
            const insertIndex = headingIndex + 1;

            extendedHeadings = extendedHeadings
                .slice(0, insertIndex)
                .concat(tabItemHeadings)
                .concat(extendedHeadings.slice(insertIndex));
        }
    });

    return extendedHeadings;
}
