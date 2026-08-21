// cspell:ignore whats
import { describe, expect, it } from 'vitest';

import angularCharts from '../../content/landing-pages/angular-charts.json';
import enterpriseCharts from '../../content/landing-pages/enterprise-charts.json';
import javascriptCharts from '../../content/landing-pages/javascript-charts.json';
import reactCharts from '../../content/landing-pages/react-charts.json';
import vueCharts from '../../content/landing-pages/vue-charts.json';
import versionsData from '../../content/versions/ag-charts-versions.json';
import type { ChartsLandingPageContent } from './buildChartsLandingPageMarkdown';
import { buildChartsLandingPageMarkdown } from './buildChartsLandingPageMarkdown';

const SITE_ROOT = 'https://www.ag-grid.com/';

// The real page content, so a section type with no branch in the builder shows up as missing.
const PAGES: Array<[string, ChartsLandingPageContent]> = [
    ['javascript-charts', javascriptCharts as ChartsLandingPageContent],
    ['react-charts', reactCharts as ChartsLandingPageContent],
    ['angular-charts', angularCharts as ChartsLandingPageContent],
    ['vue-charts', vueCharts as ChartsLandingPageContent],
    ['enterprise-charts', enterpriseCharts as ChartsLandingPageContent],
];

const build = (content: ChartsLandingPageContent) =>
    buildChartsLandingPageMarkdown({ content, versions: versionsData, siteRoot: SITE_ROOT });

describe.each(PAGES)('buildChartsLandingPageMarkdown (%s)', (_slug, content) => {
    const output = build(content);

    it("emits frontmatter from the page's own meta, then the hero as H1", () => {
        expect(output.startsWith('---\n')).toBe(true);
        expect(output).toContain(`title: ${JSON.stringify(content.meta.title)}`);
        expect(output).toContain(`description: ${JSON.stringify(content.meta.description)}`);
        const hero = content.sections.find((section) => section.type === 'hero');
        expect(hero).toBeDefined();
        expect(output).toContain(`\n# `);
    });

    it('renders every non-hero section heading, in page order', () => {
        const headings = content.sections
            .filter((section) => section.type !== 'hero')
            .map((section) => ('heading' in section ? section.heading : undefined))
            .filter((heading): heading is string => heading != null);

        expect(headings.length).toBeGreaterThan(0);
        let cursor = 0;
        for (const heading of headings) {
            const index = output.indexOf(`## ${heading}`, cursor);
            expect(index, `"${heading}" should appear after the preceding section`).toBeGreaterThan(-1);
            cursor = index;
        }
    });

    it('gives the install command for the page package', () => {
        expect(output).toContain(`Install: \`npm install ${content.packageName}\``);
    });

    it('resolves every relative link to an absolute URL', () => {
        const targets = [...output.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
        expect(targets.length).toBeGreaterThan(0);
        for (const target of targets) {
            expect(target, `${target} should be absolute`).toMatch(/^https?:\/\//);
        }
    });

    it('ends with a single trailing newline', () => {
        expect(output.endsWith('\n')).toBe(true);
        expect(output.endsWith('\n\n')).toBe(false);
    });
});

describe('buildChartsLandingPageMarkdown section rendering', () => {
    const output = build(javascriptCharts as ChartsLandingPageContent);

    it('lists feature-grid cards with their links and descriptions', () => {
        expect(output).toContain(
            '- **[Canvas-based Performance](https://www.ag-grid.com/javascript/large-dataset-interactivity/)** —'
        );
    });

    it('lists chart types with the link each card points at', () => {
        expect(output).toContain('- **[Area Charts](https://www.ag-grid.com/javascript/area-series/)** —');
    });

    it('fences the code example in its declared language, under its filename', () => {
        expect(output).toContain('`revenueChart.js`');
        expect(output).toContain("```js\nimport { AgCharts } from 'ag-charts-community';");
    });

    it("lists the same releases as the page's What's New section", () => {
        const [latest] = versionsData.filter((version) => version.version.endsWith('.0'));
        expect(output).toContain(`### [${latest.version}`);
    });

    it('links the hero gallery examples to their gallery pages', () => {
        expect(output).toContain('- [Line](https://www.ag-grid.com/gallery/line-with-time-axis/)');
    });

    it('resolves FAQ answer links, which are framework-relative Markdoc', () => {
        expect(output).toContain('## Frequently Asked Questions');
        expect(output).toContain('[AG Charts Enterprise](https://www.ag-grid.com/license-pricing/)');
    });
});

describe('buildChartsLandingPageMarkdown enterprise page', () => {
    const output = build(enterpriseCharts as ChartsLandingPageContent);

    it('renders the pricing cards with their features and CTA', () => {
        const pricing = (enterpriseCharts as ChartsLandingPageContent).sections.find(
            (section) => section.type === 'pricing'
        );
        expect(pricing).toBeDefined();
        const [card] = pricing!.cards;
        expect(output).toContain(`### ${card.title} — ${card.price}`);
        expect(output).toContain(`- ${card.features[0]}`);
    });

    it('lists the map chart cards', () => {
        const maps = (enterpriseCharts as ChartsLandingPageContent).sections.find(
            (section) => section.type === 'map-charts'
        );
        expect(maps).toBeDefined();
        expect(output).toContain(`- **${maps!.cards[0].title}** —`);
    });
});
