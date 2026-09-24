import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import type { FunctionComponent } from 'react';
import Markdown, { type Components } from 'react-markdown';

interface Props {
    /** Intro copy, written as prose and carrying inline markdown links. */
    intro: string;
}

/**
 * Links and hard line breaks only. An intro is copy, not a document: anything else an author
 * writes renders as its own text rather than as markup, so a stray `**` cannot restyle the page.
 */
const INTRO_ELEMENTS = ['p', 'a', 'br'];

const INTRO_COMPONENTS: Components = {
    // The page supplies the paragraph this sits in, and a <p> cannot nest inside one.
    p: ({ children }) => <>{children}</>,
    a: ({ children, href, ...props }) => (
        // Safari omits links from the tab order without an explicit tabindex.
        <a tabIndex={0} href={href} {...props}>
            {children}
        </a>
    ),
};

/**
 * A gallery example's intro. Rendered from markdown so one string serves both the page and its
 * `.md` twin, rather than a segmented structure each side has to reassemble.
 *
 * Deliberately not hydrated: the links are static, so Astro renders this to HTML at build.
 */
export const GalleryIntro: FunctionComponent<Props> = ({ intro }) => (
    <Markdown
        allowedElements={INTRO_ELEMENTS}
        unwrapDisallowed
        urlTransform={(url: string) => urlWithBaseUrl(url)}
        components={INTRO_COMPONENTS}
    >
        {intro}
    </Markdown>
);
