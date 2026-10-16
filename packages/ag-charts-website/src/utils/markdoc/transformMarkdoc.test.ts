import Markdoc from '@markdoc/markdoc';
import { describe, expect, it } from 'vitest';

import { transformMarkdoc } from './transformMarkdoc';

describe('transformMarkdoc', () => {
    it('marks framework-relative links in inline content, so they can follow the visitor framework', () => {
        const markdocContent =
            '[Enterprise](./community-vs-enterprise/), [Vue](/vue/quick-start/) and [AG Grid](https://www.ag-grid.com/)';
        const { renderTree, partialRenderTree } = transformMarkdoc({ framework: 'react', markdocContent });

        const links = Markdoc.renderers.html(partialRenderTree).match(/<a [^>]*>/g);

        expect(links).toHaveLength(3);
        expect(links![0]).toContain('href="/react/community-vs-enterprise/" data-framework-link="true"');
        expect(links![1]).not.toContain('data-framework-link');
        expect(links![2]).not.toContain('data-framework-link');
        // Full documents are rendered for a page that already has its framework in the URL
        expect(Markdoc.renderers.html(renderTree)).not.toContain('data-framework-link');
    });
});
