import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Header } from './Header';

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
});
