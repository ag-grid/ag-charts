/**
 * Some host pages style every `input` and `button` with selectors that outrank the chart's class rules.
 * Inside a known host of that kind, the chart mounts into a shadow root that document-level rules cannot reach.
 */
export function isInHostWithLeakingStyles(container: HTMLElement): boolean {
    return isInClaudeVisualiser(container);
}

/** claude.ai's inline visualiser: its `button` rule carries ID weight, so no class-based chart rule can win. */
function isInClaudeVisualiser(container: HTMLElement): boolean {
    // The visualiser's base styles exempt its own `form.elicit` controls, which no other page is likely to name.
    return (
        container.closest('#vis-container') != null && hasStylesheetRuleMatching(container.ownerDocument, 'form.elicit')
    );
}

/** Whether any readable stylesheet in the document has a rule whose selector contains `selectorFragment`. */
function hasStylesheetRuleMatching(doc: Document, selectorFragment: string): boolean {
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
            // Duck-typed: rules from another window's stylesheets fail `instanceof` against this window's CSSStyleRule.
            if (
                'selectorText' in rule &&
                typeof rule.selectorText === 'string' &&
                rule.selectorText.includes(selectorFragment)
            ) {
                return true;
            }
        }
    }
    return false;
}
