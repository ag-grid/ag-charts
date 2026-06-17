---
root: false
targets: ['*']
description: 'Localisation maintenance — keep ag-charts-locale translations complete and correct against en-US'
globs: ['packages/ag-charts-locale/src/**']
---

# Localisation Maintenance

`packages/ag-charts-locale` ships AG Charts' translated UI and screen-reader strings: a
source-of-truth `en-US.ts` plus one file per supported locale (`de-DE.ts`, `fr-FR.ts`, …). When any
file under `packages/ag-charts-locale/src/**` changes, the translations must stay complete and
consistent with `en-US.ts`.

## The contract

- **`en-US.ts` is the single source of truth.** Every locale file must expose exactly the same key
  set as `en-US.ts` — no missing keys, no extra keys. (Key *order* is not enforced by the test;
  mirror `en-US` ordering for new keys where practical.)
- **Preserve placeholders verbatim.** Values may contain variable placeholders `${variable}` and
  bracketed formatters (`[number]`, `[percent]`, `[percent0to2dp]`, `[date]`, `[time]`,
  `[datetime]`). Never translate, reorder, or drop these — the set of placeholders in a translated
  value must match the corresponding `en-US` value exactly.
- **Mirror date/time format structure.** For time/date format strings, keep the same component order
  and punctuation style while translating the component letters — e.g. `DD/MM/YYYY` becomes
  `JJ/MM/AAAA` for `fr-FR`.
- **Keep the per-file disclaimer.** Each translated file carries a comment noting that translations
  are illustrative and not guaranteed accurate. Retain it.
- **Each file's export name is fixed** as `AG_CHARTS_LOCALE_<XX_XX>` (e.g. `AG_CHARTS_LOCALE_DE_DE`).

## When `en-US.ts` changes

Adding, removing, renaming, or re-wording a key (or its explanatory comment) means the translations
have drifted. Propagate the change to every locale:

- Run the **`l10n-translate`** skill — it diffs `en-US.ts` against each locale and translates
  missing or changed keys, removes stale keys, and preserves placeholders.
- Then run `yarn nx test ag-charts-locale`. The `translations` suite enforces this contract:
  identical key sets, allowed formatters only, and matching `${variables}` against `en-US`.

On a PR touching these files, the **L10n Translation Review** workflow
(`.github/workflows/l10n-translation-review.yml`) posts an advisory comment with an LLM semantic
review of the changed translations. It is advisory only and never fails the build — the test suite
above is the enforced gate.

## Canonical translation instruction

The `l10n-translate` skill applies the following system prompt (where *context* is the explanatory
comment above the key or group of keys, and *productDescription* is AG Charts). Keep skill and rule
in step if this wording changes:

```
Translate the values in the JSON object to the specified language.
Return the JSON object with the translated values in the same format and structure.
Do not translate variable placeholders inside '{}' and '[]', e.g. '${variable}', '[number]' and '[percent]'.
Do not add any additional properties to the object - it should be returned with the same properties as it was provided to you.
For Time Format values, ensure these are translated and the translated value must reflect the same component order, and punctuation style. For example, "DD/MM/YYYY" becomes JJ/MM/AAAA in fr-FR.ts
For context, the JSON Object contains the {context} Locale Key/Values for {productDescription}.
Ensure translations are appropriate within the given context.
```
