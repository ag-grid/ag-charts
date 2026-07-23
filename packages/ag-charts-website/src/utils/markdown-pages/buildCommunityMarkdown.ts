import {
    allTools,
    renderEvents,
    renderShowcase,
    renderSocialsLine,
    renderSupport,
    renderTools,
    renderVideosTable,
    showcaseFavourites,
    upcomingThisYear,
} from './communityContent';

// Mirror the counts the /community landing page shows per section (see home.astro props):
// UpcomingEvents shows this year's events (last 5), Showcase favouritesOnly maxItems 8,
// ToolsExtensions limit 3.
const NUM_UPCOMING_EVENTS = 5;
const NUM_SHOWCASE = 8;
const NUM_TOOLS = 3;

/**
 * Build the markdown twin of the /community/ page: this year's events, showcase favourites,
 * community tools & extensions, media, and support/social channels. The page is fully
 * data-driven, so this reads the same shared community JSON it renders and cannot drift.
 */
export function buildCommunityMarkdown({ siteRoot }: { siteRoot?: string } = {}): string {
    const frontmatter = [
        '---',
        'title: "AG Charts Community"',
        'description: "Dedicated to our open-source AG Charts community. Browse open-source projects, find 3rd party charting tools, and stay up-to-date with the latest news."',
        '---',
    ].join('\n');

    const document = [
        frontmatter,
        '# AG Charts Community',
        'Dedicated to our open-source AG Charts community — open-source projects, third-party charting tools, events, media, and support channels.',
        `## Events\n\n${renderEvents(upcomingThisYear(NUM_UPCOMING_EVENTS), siteRoot)}`,
        `## Showcase\n\n${renderShowcase(showcaseFavourites().slice(0, NUM_SHOWCASE), siteRoot)}`,
        `## Tools & Extensions\n\n${renderTools(allTools().slice(0, NUM_TOOLS), siteRoot)}`,
        `## Media\n\n${renderVideosTable(siteRoot)}`,
        `## Support & Socials\n\n${renderSupport(siteRoot)}\n\nSocials: ${renderSocialsLine(siteRoot)}`,
    ].join('\n\n');

    return `${document.trimEnd()}\n`;
}
