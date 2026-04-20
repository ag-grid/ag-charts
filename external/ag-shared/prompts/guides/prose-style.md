---
targets: ['*']
description: 'Prose style rules for technical writing — docs, blog posts, release notes, PR descriptions. Catches AI-generated cadence.'
globs: ['**/*.mdoc', '**/*.md']
---

# Prose Style Guide

This guide applies to prose you write in documentation pages (`.mdoc`), blog posts, release notes, design documents, and PR descriptions. It does not apply to code comments, JSDoc, or machine-generated API reference text.

Model-generated prose has a recognisable cadence: overpacked sentences, padding words, defensive bullets, and implementation narration. Reviewers flag this as "reads very AI". Re-read every paragraph as if you were reviewing someone else's PR and rewrite when you see the following smells.

## Overpacked openers

One sentence that defines a term in a parenthetical, then em-dashes into a laundry list, then contrasts with a closing clause. Break it into two or three sentences.

**Avoid:**

> By default, data points with a missing colour value (i.e. the field is `null`, `undefined`, or absent from the datum) fall back to a series-specific default — Heatmap cells render as transparent, Treemap and Sunburst segments use the palette fill for their position, Map Markers use the series' default fill, and Map Shapes and Map Lines omit those datums entirely. Use `missingDataFill` to paint all of these points with a single explicit placeholder colour instead.

**Prefer:**

> When a datum has no colour value, each series type falls back to its own default: Heatmap cells are transparent, Treemap and Sunburst segments use their palette fill, Map Markers use the series fill, and Map Shapes and Map Lines skip the datum entirely.
>
> Set `missingDataFill` to use one placeholder colour across all of these cases instead.

## Padding words

Cut adjectives and phrases that don't change the meaning.

-   "a **single explicit** placeholder colour" → "one placeholder colour"
-   "a **series-specific** default" → "its own default"
-   "**in order to**" → "to"
-   "**It is possible to** customise" → "Customise"
-   "**You can** set" → "Set"

## Non-behaviour bullets

If a reader wouldn't have expected a behaviour, don't spend a bullet denying it.

**Avoid:** "The Gradient Legend does not display a separate swatch for missing data — the placeholder colour is only visible on the series itself."

Nothing in the preceding text implied otherwise, so this bullet creates confusion rather than resolving it. Delete.

## Implementation narration

State the user-visible effect. Leave the mechanism out.

**Avoid:** "…also enables tooltips and hover interactions for datums without a colour value, because those datums are now included in the series' node data rather than being skipped."

**Prefer:** "…also makes these datums respond to hover, since they are no longer skipped."

## Catalogue hedges

If the type definition already conveys the information, don't restate it.

**Avoid:** "`missingDataFill` accepts any CSS colour string (named colour, hex, `rgba(…)`, etc.)."

The type is `CssColor` — the reference tab says this. Delete.

## Checklist

Before submitting prose:

1. Does the opening sentence have more than one main clause *and* a parenthetical *and* an em-dash list? Split it.
2. Can you delete any adjective or adverb without changing the meaning? Delete it.
3. Does any bullet explain what something *doesn't* do, or narrate implementation? Rewrite or delete.
4. Does any bullet restate what the API Reference already says? Delete.
