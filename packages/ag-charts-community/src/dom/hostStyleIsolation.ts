/**
 * Some host pages style every `input` and `button` with selectors that outrank the chart's class rules.
 * Inside a known host of that kind, the chart mounts into a shadow root that document-level rules cannot reach.
 */
export function isInHostWithLeakingStyles(container: HTMLElement): boolean {
    return isInClaudeVisualiser(container);
}

/** claude.ai's inline visualiser: its `button` rule carries ID weight, so no class-based chart rule can win. */
function isInClaudeVisualiser(container: HTMLElement): boolean {
    return container.closest('#vis-container') != null && hasClaudeVisualiserStylesheet(container.ownerDocument);
}

/** The visualiser's base styles exempt its own `form.elicit` controls, which no other page is likely to name. */
function hasClaudeVisualiserStylesheet(doc: Document): boolean {
    const { styleSheets } = doc;
    for (let i = 0, len = styleSheets.length; i < len; ++i) {
        let rules: CSSRuleList;
        try {
            rules = styleSheets[i].cssRules;
        } catch {
            // cross-origin stylesheets cannot be read
            continue;
        }
        for (let j = 0, rulesLen = rules.length; j < rulesLen; ++j) {
            const rule = rules[j];
            // Duck-typed rather than `instanceof CSSStyleRule`, which fails for a container in another window.
            if (
                'selectorText' in rule &&
                typeof rule.selectorText === 'string' &&
                rule.selectorText.includes('form.elicit')
            ) {
                return true;
            }
        }
    }
    return false;
}
