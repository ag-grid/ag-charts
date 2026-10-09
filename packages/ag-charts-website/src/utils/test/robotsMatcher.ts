/**
 * Test-only robots.txt rule matching (RFC 9309), so a robots test asserts which URLs a crawler may
 * fetch rather than which lines the file contains.
 *
 * Within a group the most specific (longest) matching rule wins, and Allow wins a tie. `*` matches
 * any run of characters and a trailing `$` anchors the end; everything else is a prefix match.
 */

export interface RobotsGroup {
    allow: string[];
    disallow: string[];
}

function ruleMatches(rule: string, path: string): boolean {
    const anchored = rule.endsWith('$');
    const body = anchored ? rule.slice(0, -1) : rule;
    const pattern = body
        .split('*')
        .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
        .join('.*');
    return new RegExp(`^${pattern}${anchored ? '$' : ''}`).test(path);
}

/** Whether a crawler matching this group may fetch the path. */
export function isAllowed({ allow, disallow }: RobotsGroup, path: string): boolean {
    const longest = (rules: string[]) =>
        Math.max(-1, ...rules.filter((rule) => rule !== '' && ruleMatches(rule, path)).map((rule) => rule.length));
    return longest(allow) >= longest(disallow);
}

// The grid root robots.txt (grid `robotsTxt.ts`) is the only robots file crawlers read for
// www.ag-grid.com. It publishes this site's disallow list verbatim in two groups, and these mirror
// how it builds them. Kept in step by hand: a change there must be reflected here.
const ROOT_ALLOW = ['/', '/charts/', '/studio/', '/blog/'];
const isAiOpenExamplePath = (path: string) => /example/i.test(path) && !path.includes('/debug/');
const isAiOpenArchivePath = (path: string) => /\/archive(\/|$)/.test(path);

/** The `User-agent: *` group the root builds from a disallow list: search engines read this. */
export const wildcardGroup = (disallow: string[]): RobotsGroup => ({ allow: ROOT_ALLOW, disallow });

/** The named AI-crawler group: the same rules, minus the public examples and archives. */
export const aiCrawlerGroup = (disallow: string[]): RobotsGroup => ({
    allow: ROOT_ALLOW,
    disallow: disallow.filter((path) => !isAiOpenExamplePath(path) && !isAiOpenArchivePath(path)),
});
