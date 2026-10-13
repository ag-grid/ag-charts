import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { Header } from './Header';

// The test environment resolves SVG imports to data URLs, which `Icon` cannot render as a tag.
vi.mock('@ag-website-shared/components/icon/Icon', () => ({ Icon: () => null }));

type HeaderProps = Parameters<typeof Header>[0];

const defaultProps: HeaderProps = {
    title: 'Quick Start',
    framework: 'react',
    path: '/react/quick-start/',
    menuItems: [],
};

function renderHeader(props: Partial<HeaderProps> = {}) {
    return renderToStaticMarkup(<Header {...defaultProps} {...props} />);
}

function getHeadingHtml(props: Partial<HeaderProps> = {}) {
    const html = renderHeader(props);
    const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    if (!heading) {
        throw new Error(`No <h1> rendered in:\n${html}`);
    }
    return heading[1];
}

describe('Header', () => {
    it('renders the framework name inside the h1, as search engines index the heading', () => {
        expect(getHeadingHtml()).toContain('React Charts');
    });

    it("links the framework name to the framework's landing hub", () => {
        expect(getHeadingHtml()).toMatch(/<a [^>]*href="[^"]*\/react\/"[^>]*>React Charts<\/a>/);
    });

    it('leaves the framework name unlinked where the framework root forwards on to quick-start', () => {
        const headingHtml = getHeadingHtml({ framework: 'javascript', path: '/javascript/quick-start/' });

        expect(headingHtml).toContain('JavaScript Charts');
        expect(headingHtml).not.toContain('<a ');
    });

    it('omits the framework name from the h1 when it is suppressed', () => {
        const headingHtml = getHeadingHtml({ suppressFrameworkHeader: true });

        expect(headingHtml).not.toContain('React Charts');
        expect(headingHtml).toContain('Quick Start');
    });

    it('renders the version outside the h1, so it does not read as part of the heading', () => {
        const html = renderHeader({ version: '14.1.0' });

        expect(html).toContain('Version 14.1.0');
        expect(getHeadingHtml({ version: '14.1.0' })).not.toContain('Version 14.1.0');
    });

    it('marks the page title within the h1, as that is how the Algolia indexer finds it', () => {
        expect(getHeadingHtml()).toMatch(/<span[^>]*data-page-title[^>]*>Quick Start<\/span>/);
    });

    it("links the Enterprise label to the framework's community vs. enterprise page", () => {
        const html = renderHeader({ isEnterprise: true, framework: 'vue' });

        expect(html).toMatch(/<a[^>]*href="[^"]*\/vue\/community-vs-enterprise\/"[^>]*>Enterprise/);
    });

    it('omits the Enterprise label on community pages', () => {
        expect(renderHeader()).not.toContain('community-vs-enterprise');
    });
});
