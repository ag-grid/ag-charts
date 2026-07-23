import { eventsByDate, renderEvents } from './communityContent';

/**
 * Build the markdown twin of /community/events: every event AG Charts has sponsored or spoken at,
 * split into upcoming and past. Reads the same events.json the page renders.
 */
export function buildCommunityEventsMarkdown({ siteRoot }: { siteRoot?: string } = {}): string {
    const { upcoming, past } = eventsByDate();

    const frontmatter = [
        '---',
        'title: "AG Charts: Events"',
        'description: "AG Charts is a regular sponsor and speaker at some of the biggest conferences in the world. Take a look at where we\'ll be this year or browse through all the events we\'ve sponsored and held since 2018."',
        '---',
    ].join('\n');

    const document = [
        frontmatter,
        '# Global Event Participation',
        "AG Charts is a regular sponsor and speaker at some of the biggest conferences in the world. Take a look at where we'll be this year or browse through all the events we've sponsored and held since 2018.",
        `## Upcoming Events\n\n${renderEvents(upcoming, siteRoot)}`,
        `## Past Events\n\n${renderEvents(past, siteRoot)}`,
    ].join('\n\n');

    return `${document.trimEnd()}\n`;
}
