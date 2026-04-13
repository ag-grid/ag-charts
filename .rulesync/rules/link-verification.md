---
targets: ['*']
description: 'Verify all URLs before including them in documents, plans, or analysis files'
globs: ['plans/**/*.md', 'packages/ag-charts-website/src/content/docs/**/*.mdoc']
---

# Link Verification

Before adding any URL to a document, plan, analysis file, or any other written output, verify it is reachable. A broken link undermines the credibility of the entire document, and finding dead links after the fact wastes time.

## Verification Process

1. **Fetch every URL** with `WebFetch` before including it. If the page loads (2xx or 3xx), the link is good.
2. **If the response is 403** (bot protection / WAF), the site is blocking automated requests. Fall back to the Chrome browser extension MCP tools (`mcp__claude-in-chrome__navigate` + `mcp__claude-in-chrome__read_page`) to verify the page loads in a real browser.
3. **If the URL is a genuine 404**, do not include it. Search for the correct/current URL instead — pages move, domains change, docs get restructured. If no replacement can be found, either remove the link or mark it visibly as dead (e.g., `~~https://example.com/old-page~~ (dead link)`).
4. **If the URL redirects** (301/302), update it to the final destination URL so readers don't depend on a redirect that may eventually break.

## Scope

This applies to every URL you write into a file — documentation links, reference URLs, Plunker links, GitHub issue links, blog posts, forum threads, and external product pages. It does not apply to URLs you output only in conversation (though verifying those is still good practice).
