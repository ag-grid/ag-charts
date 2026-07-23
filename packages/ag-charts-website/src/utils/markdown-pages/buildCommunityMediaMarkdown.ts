import { renderBlogs, renderPodcasts, renderVideosTable } from './communityContent';

/**
 * Build the markdown twin of /community/media: videos, podcasts and blogs featuring AG Charts.
 * Reads the same videos/podcasts/blogs JSON the page renders.
 */
export function buildCommunityMediaMarkdown({ siteRoot }: { siteRoot?: string } = {}): string {
    const frontmatter = [
        '---',
        'title: "AG Charts: Media"',
        'description: "Browse our appearances in community podcasts, blogs, and events to get the latest news & updates directly from our team."',
        '---',
    ].join('\n');

    const document = [
        frontmatter,
        '# Community Podcasts and Publications featuring AG Charts',
        'Browse our appearances in community podcasts, blogs, and events to get the latest news & updates directly from our team.',
        `## Videos\n\n${renderVideosTable(siteRoot)}`,
        `## Podcasts\n\n${renderPodcasts(siteRoot)}`,
        `## Blogs\n\n${renderBlogs(siteRoot)}`,
    ].join('\n\n');

    return `${document.trimEnd()}\n`;
}
